import { Response } from 'express';
import * as xlsx from 'xlsx';
import { getClient } from '../config/db';
import { fetchGoogleSheetData } from '../services/sheets';
import { AuthRequest } from '../middlewares/rbac';

async function processDetailRow(client: any, row: any) {
  const query = `
    INSERT INTO APPEALS (
      report_date, pjp_name, pjp_tier, mcc, status, detail_action
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (report_date, pjp_name, mcc) 
    DO UPDATE SET 
      pjp_tier = EXCLUDED.pjp_tier,
      status = EXCLUDED.status,
      detail_action = EXCLUDED.detail_action,
      created_at = CURRENT_TIMESTAMP;
  `;
  const values = [
    row['Tanggal'] || row[1],
    row['PJP'] || row[3],
    row['Tier'] || 'Tier 3', // Simplified logic for demo
    row['MCC'] || row[5],
    row['Action'] || row[9],
    row['Insert Whitelist'] === 'Yes' ? 'Insert whitelist' : 'Rekomendasi'
  ];
  
  if (!values[0] || !values[1] || !values[3]) {
      throw new Error("Missing mandatory unique fields: Tanggal, PJP, or MCC");
  }

  await client.query(query, values);
}

export const uploadData = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await getClient();
  let dataToProcess: any[] = [];
  const errors: any[] = [];
  let totalRows = 0;
  const sourceType = req.body.sheetsUrl ? 'GSheets' : 'Excel';

  try {
    const { sheetsUrl, range } = req.body;

    if (sheetsUrl) {
      const match = sheetsUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        res.status(400).json({ error: 'Invalid Google Sheets URL' });
        return;
      }
      const sheetData = await fetchGoogleSheetData(match[1], range || 'Sheet1!A1:Z10000');
      const headers = sheetData[0];
      dataToProcess = sheetData.slice(1).map(row => {
          let obj: any = {};
          headers.forEach((h: string, i: number) => {
              obj[h] = row[i];
          });
          return obj;
      });
    } else if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      dataToProcess = xlsx.utils.sheet_to_json(sheet);
    } else {
      res.status(400).json({ error: 'No file or Sheets URL provided' });
      return;
    }

    totalRows = dataToProcess.length;
    await client.query('BEGIN');

    for (let i = 0; i < dataToProcess.length; i++) {
        try {
            await processDetailRow(client, dataToProcess[i]);
        } catch (err: any) {
            errors.push({ row: i + 2, data: dataToProcess[i], reason: err.message });
        }
    }

    // Log to IMPORT_LOGS
    await client.query(
      'INSERT INTO IMPORT_LOGS (user_id, source_type, status, rows_processed) VALUES ($1, $2, $3, $4)',
      [req.user?.id, sourceType, errors.length > 0 ? 'Partial' : 'Success', totalRows - errors.length]
    );

    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Processing complete',
      totalRows,
      successfulRows: totalRows - errors.length,
      failedRows: errors.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'System error during processing', details: error.message });
  } finally {
    client.release();
  }
};
