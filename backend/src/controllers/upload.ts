import { Response } from 'express';
import * as xlsx from 'xlsx';
import { getClient } from '../config/db';
import { fetchGoogleSheetData } from '../services/sheets';
import { AuthRequest } from '../middlewares/rbac';
import { cleanseAndTransform } from '../utils/cleansing';
import { UploadService } from '../services/upload.service';
import { CleanedData } from '../interfaces/upload.interface';
import { detectAnomalies } from '../services/analytics';
import { sendAnomalyEmail } from '../services/emailService';

export const uploadData = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await getClient();
  const sourceType = req.body.sheetsUrl ? 'GSheets' : 'Excel';
  let totalRawRows = 0;
  let successCount = 0;

  try {
    const { sheetsUrl, range } = req.body;
    let rawData: any[][] = [];

    // 1. Ekstraksi Data Mentah
    if (sheetsUrl) {
      const match = sheetsUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        res.status(400).json({ error: 'Format URL Google Sheets tidak valid' });
        return;
      }
      rawData = (await fetchGoogleSheetData(match[1], range || 'Sheet1!A1:Z10000')) || [];
    } else if (req.file) {
      // Menggunakan req.file.buffer yang diinjeksi oleh Multer memoryStorage
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      res.status(400).json({ error: 'File Excel atau URL Sheets wajib disertakan' });
      return;
    }

    if (rawData.length === 0) {
      res.status(400).json({ error: 'Data kosong. Tidak ada baris yang bisa diproses.' });
      return;
    }

    // 2. Deteksi Header
    let headerIdx = rawData.findIndex(r => 
      r.some((cell: any) => {
        if (typeof cell !== 'string') return false;
        const lower = cell.toLowerCase().trim();
        return lower === 'tanggal' || lower === 'pjp' || lower === 'mcc' || lower === 'action' || lower === 'nomor' || lower === 'nama pjp' || lower === 'tanggal pengajuan';
      })
    );
    if (headerIdx === -1) headerIdx = 0;

    const headers = rawData[headerIdx] || [];
    
    // 3. Mapping Raw Array to Objects
    const dataToProcess = rawData.slice(headerIdx + 1)
      .filter(r => r.length > 0 && r.some(c => c !== null && c !== ''))
      .map(r => {
        let obj: any = {};
        headers.forEach((h: string, i: number) => {
            if (h) obj[h.toString().trim()] = r[i]; 
        });
        return obj;
      });

    totalRawRows = dataToProcess.length;
    
    if (totalRawRows === 0) {
      res.status(400).json({ error: 'Tidak ada baris data valid (diluar header) yang ditemukan.' });
      return;
    }

    // 4. Data Cleansing & Transform
    const cleanedRows: CleanedData[] = [];
    const errors: any[] = [];

    for (let i = 0; i < dataToProcess.length; i++) {
      try {
        const cleaned = cleanseAndTransform(dataToProcess[i]);
        if (cleaned) {
          cleanedRows.push(cleaned);
        } else {
          errors.push({ row: i + headerIdx + 2, data: dataToProcess[i], reason: 'Kolom Wajib (Tanggal/PJP/Action) kosong atau format tidak dikenali' });
        }
      } catch (err: any) {
        errors.push({ row: i + headerIdx + 2, data: dataToProcess[i], reason: err.message });
      }
    }

    // 5. Bulk Insert dengan Database Transaction
    await client.query('BEGIN');

    try {
      if (cleanedRows.length > 0) {
        // Pemanggilan logic BULK INSERT
        successCount = await UploadService.bulkUpsertAppeals(client, cleanedRows);
      }

      // Dapatkan User ID yang valid agar tidak terkena Foreign Key Constraint
      let validUserId = req.user?.id || null;
      if (validUserId) {
        const userCheck = await client.query('SELECT id FROM USERS WHERE id = $1', [validUserId]);
        if (userCheck.rows.length === 0) validUserId = null;
      }
      
      if (!validUserId) {
        const firstUser = await client.query('SELECT id FROM USERS LIMIT 1');
        if (firstUser.rows.length > 0) validUserId = firstUser.rows[0].id;
      }

      // Log to IMPORT_LOGS
      await client.query(
        'INSERT INTO IMPORT_LOGS (user_id, source_type, status, rows_processed) VALUES ($1, $2, $3, $4)',
        [validUserId, sourceType, errors.length > 0 ? 'Partial' : 'Success', cleanedRows.length]
      );

      await client.query('COMMIT');
    } catch (dbError: any) {
      await client.query('ROLLBACK');
      throw new Error(`Database error saat Bulk Insert: ${dbError.message}`);
    }

    if (errors.length > 0) {
      console.error("DEBUG UPLOAD ERROR (First Row):", errors[0]);
    }

    // 6. Jalankan Anomaly Detection setelah data masuk, lalu kirim Email jika ada
    if (successCount > 0) {
      try {
        const anomalyData = await detectAnomalies();
        if (anomalyData.anomaliesDetected && anomalyData.anomaliesDetected.length > 0) {
          // TODO: Ambil email dari database SCHEDULED_REPORTS. Sementara pakai dummy/fallback:
          const emailListRes = await client.query('SELECT recipient_emails FROM SCHEDULED_REPORTS LIMIT 1');
          let recipients: string[] = [];
          if (emailListRes.rows.length > 0 && emailListRes.rows[0].recipient_emails) {
            recipients = emailListRes.rows[0].recipient_emails.split('\n').map((e: string) => e.trim()).filter(Boolean);
          } else {
            // Ambil email Admin dari database jika tabel jadwal laporan kosong
            const adminRes = await client.query("SELECT email FROM USERS WHERE role = 'Admin' LIMIT 1");
            if (adminRes.rows.length > 0) {
              recipients = [adminRes.rows[0].email];
            } else {
              recipients = ["admin@gmail.com"];
            }
          }
          // Kirim email secara asynchronous agar tidak memblokir respon ke client
          sendAnomalyEmail(recipients, anomalyData.anomaliesDetected).catch(console.error);
        }
      } catch (anoErr) {
        console.error("Gagal menjalankan deteksi anomali pasca-upload:", anoErr);
      }
    }

    // 7. Response
    res.status(200).json({
      message: 'Processing complete',
      totalRows: totalRawRows,
      successfulRows: cleanedRows.length,
      failedRows: errors.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error("DEBUG ERROR UPLOAD:", error.message || error);
    res.status(500).json({ error: 'Sistem error selama pemrosesan data', details: error.message });
  } finally {
    if (client) client.release();
  }
};
