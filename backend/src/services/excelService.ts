import * as xlsx from 'xlsx';
import fs from 'fs';
import pool from '../config/database';

export const processExcelUpload = async (filePath: string, originalName: string) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1, raw: false });
  
  let headerIndex = 0;
  let maxScore = 0;
  for (let i = 0; i < Math.min(20, rawData.length); i++) {
    const rowString = (rawData[i] || []).join(' ').toLowerCase();
    let score = 0;
    if (rowString.includes('tanggal') || rowString.includes('date')) score += 3;
    if (rowString.includes('pjp') || rowString.includes('mitra')) score += 2;
    if (rowString.includes('merchant') || rowString.includes('toko')) score += 2;
    if (rowString.includes('mcc')) score += 1;
    if (rowString.includes('action') || rowString.includes('tindakan')) score += 1;
    
    if (score > maxScore) {
      maxScore = score;
      headerIndex = i;
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
      
      const findCol = (keywords: string[]) => {
        for (const key of Object.keys(normalizedRow)) {
          if (keywords.some(kw => key.includes(kw))) return normalizedRow[key];
        }
        return '';
      };
      
      const noRef = findCol(['no referensi', 'referensi', 'no_ref', 'nomor']) || normalizedRow['no'] || '';
      let tanggalStr = findCol(['tanggal', 'date']);
      const appealWorker = findCol(['appeal worker', 'worker', 'pic']);
      const pjp = findCol(['pjp', 'mitra']);
      const namaMerchant = findCol(['nama merchant', 'merchant', 'toko']);
      const mcc = findCol(['mcc', 'kategori']);
      const action = findCol(['action', 'tindakan', 'aksi']);
      
      if (!tanggalStr && !pjp && !namaMerchant && !action) {
        // Baris kosong / ghost row (biasanya karena sisa border/formula di bagian bawah Excel)
        continue;
      }

      if (!tanggalStr || !pjp || !namaMerchant) {
        const availableCols = Object.keys(row).join(', ');
        errors.push({ row: i + headerIndex + 2, reason: `Kolom Wajib Kosong. Kolom yg ditemukan: ${availableCols}` });
        continue;
      }
      
      let dbTanggal = tanggalStr;
      if (typeof tanggalStr === 'string') {
        const d = new Date(tanggalStr);
        if (!isNaN(d.getTime())) {
          // MM/DD/YYYY atau YYYY-MM-DD
          dbTanggal = d.toISOString().split('T')[0];
        } else if (tanggalStr.includes('/')) {
          // DD/MM/YYYY fallback
          const parts = tanggalStr.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            dbTanggal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      } else if (typeof tanggalStr === 'number') {
        const d = new Date(Math.round((tanggalStr - 25569) * 86400 * 1000));
        dbTanggal = d.toISOString().split('T')[0];
      }

      const insertQuery = `
        INSERT INTO operasional_harian_detail (
          no_referensi, tanggal, appeal_worker, pjp, nama_merchant, mcc, action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(insertQuery, [noRef.toString(), dbTanggal, appealWorker, pjp, namaMerchant, mcc.toString(), action]);
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
