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
  // Mengatasi ghost rows (baris kosong)
  if (!row || Object.keys(row).length === 0) return;

  let rawDate = row['Tanggal'] || row['Date'] || row[1];
  
  // Handling tipe data tanggal (Excel terkadang mengirim sebagai integer/serial date atau berbagai format string)
  let parsedDate = rawDate;
  if (typeof rawDate === 'number') {
    const jsDate = new Date((rawDate - (25567 + 2)) * 86400 * 1000); 
    parsedDate = jsDate.toISOString().split('T')[0];
  } else if (rawDate instanceof Date) {
    parsedDate = rawDate.toISOString().split('T')[0];
  } else if (typeof rawDate === 'string') {
    // Menangani format dd/mm/yyyy atau dd-mm-yyyy
    const parts = rawDate.split(/[\/\-]/);
    if (parts.length === 3) {
      // Asumsi format Indonesia/UK: dd/mm/yyyy -> yyyy-mm-dd
      if (parts[2].length === 4) {
        parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        // Jika formatnya sudah yyyy-mm-dd
        parsedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  }

  const allValues = Object.values(row).map(String).join(' ').toLowerCase();
  
  let detailAction = 'Rekomendasi Nama'; // Default fallback
  let status = 'Pending';
  
  if (allValues.includes('whitelist')) {
      detailAction = 'Whitelist';
      status = 'Done';
  } else if (allValues.includes('reject') || allValues.includes('tolak')) {
      detailAction = 'Reject';
      status = 'Rejected';
  } else if (allValues.includes('mcc')) {
      detailAction = 'Rekomendasi MCC';
      status = 'Pending';
  } else if (allValues.includes('nama') || allValues.includes('rekomendasi')) {
      detailAction = 'Rekomendasi Nama';
      status = 'Pending';
  } else if (allValues.includes('done') || allValues.includes('selesai') || allValues.includes('sesuai')) {
      status = 'Done';
      detailAction = 'Whitelist';
  }

  const values = [
    parsedDate,
    row['PJP'] || row['pjp'] || row[3] || 'Unknown PJP',
    row['Tier'] || 'Tier 3', 
    row['MCC'] || row['mcc'] || row[5] || 'Unknown MCC',
    status,
    detailAction
  ];
  
  // Jika field wajib benar-benar tidak ada meskipun sudah difallback
  if (!values[0]) {
      throw new Error("Missing mandatory unique fields: Tanggal tidak valid atau kosong.");
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

    let rawData: any[][] = [];

    if (sheetsUrl) {
      const match = sheetsUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        res.status(400).json({ error: 'Invalid Google Sheets URL' });
        return;
      }
      rawData = (await fetchGoogleSheetData(match[1], range || 'Sheet1!A1:Z10000')) || [];
    } else if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      res.status(400).json({ error: 'No file or Sheets URL provided' });
      return;
    }

    // Deteksi baris header secara cerdas dan KETAT (menghindari baris judul seperti "DATA MERCHANT DARI PJP")
    let headerIdx = rawData.findIndex(r => 
      r.some((cell: any) => {
        if (typeof cell !== 'string') return false;
        const lower = cell.toLowerCase().trim();
        return lower === 'tanggal' || lower === 'pjp' || lower === 'mcc' || lower === 'action' || lower === 'nomor' || lower === 'nama pjp' || lower === 'tanggal pengajuan';
      })
    );
    if (headerIdx === -1) headerIdx = 0; // Fallback

    const headers = rawData[headerIdx] || [];
    dataToProcess = rawData.slice(headerIdx + 1)
      .filter(r => r.length > 0 && r.some(c => c)) // Skip baris benar-benar kosong
      .map(r => {
        let obj: any = {};
        headers.forEach((h: string, i: number) => {
            if (h) obj[h.toString().trim()] = r[i]; 
        });
        return obj;
      });

    totalRows = dataToProcess.length;
    await client.query('BEGIN');

    for (let i = 0; i < dataToProcess.length; i++) {
        try {
            await processDetailRow(client, dataToProcess[i]);
        } catch (err: any) {
            errors.push({ row: i + 2, data: dataToProcess[i], reason: err.message });
        }
    }
    if (errors.length > 0) {
      console.error("DEBUG UPLOAD ERROR (First Row):", errors[0]);
      require('fs').appendFileSync('error_log.txt', JSON.stringify(errors[0]) + '\n');
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
