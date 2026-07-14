import * as xlsx from 'xlsx';
import fs from 'fs';
import pool from '../config/database';

export const processExcelUpload = async (filePath: string, originalName: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1, raw: false });
  
  let headerIndex = 0;
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const rowString = (rawData[i] || []).join(' ').toLowerCase();
    if (rowString.includes('tanggal') || rowString.includes('pjp') || rowString.includes('merchant')) {
      headerIndex = i;
      break;
    }
  }

  const sheetData = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { raw: false, range: headerIndex });
  
  if (sheetData.length === 0) {
    throw new Error('File Excel kosong atau format tidak valid (tidak ada data setelah header)');
  }

  const client = await pool.connect();
  let inserted = 0;
  const errors: any[] = [];

  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      const normalizedRow: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        normalizedRow[k.toLowerCase().trim()] = row[k];
      });
      
      const noRef = normalizedRow['no'] || normalizedRow['no referensi'] || '';
      const tanggalStr = normalizedRow['tanggal'] || '';
      const appealWorker = normalizedRow['appeal worker'] || '';
      const pjp = normalizedRow['pjp'] || '';
      const namaMerchant = normalizedRow['nama merchant'] || '';
      const mcc = normalizedRow['mcc'] || '';
      const action = normalizedRow['action'] || '';
      
      if (!tanggalStr || !pjp || !namaMerchant) {
        const availableCols = Object.keys(row).join(', ');
        errors.push({ row: i + 2, reason: `Kolom Wajib Kosong. Kolom yg ditemukan: ${availableCols}` });
        continue;
      }

      const insertQuery = `
        INSERT INTO appeal_merchant_harian (
          no_referensi, tanggal, appeal_worker, pjp, nama_merchant, mcc, action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(insertQuery, [noRef.toString(), tanggalStr, appealWorker, pjp, namaMerchant, mcc.toString(), action]);
      inserted++;
    }
    
    await client.query('COMMIT');
    return { inserted, errors, fileName: originalName };
  } catch (dbErr: any) {
    await client.query('ROLLBACK');
    throw dbErr;
  } finally {
    client.release();
    fs.unlinkSync(filePath);
  }
};
