import { PoolClient } from 'pg';
import { CleanedData } from '../interfaces/upload.interface';

export class UploadService {
  /**
   * Bulk UPSERT menggunakan PostgreSQL UNNEST.
   * Sangat cepat karena semua baris disuntikkan dalam 1 kueri tunggal, 
   * dan aman dari batasan maximum statement parameters.
   */
  static async bulkUpsertAppeals(client: PoolClient, data: CleanedData[]): Promise<number> {
    if (data.length === 0) return 0;

    // --- DEDUPLIKASI DATA MENTAH ---
    // PostgreSQL 'ON CONFLICT DO UPDATE' akan error jika dalam satu kueri 
    // ada baris dengan (tanggal, pjp, mcc) yang sama lebih dari satu kali.
    // Solusi: Kita lakukan deduplikasi di level memori (ambil baris paling terakhir).
    const uniqueMap = new Map<string, CleanedData>();
    for (const d of data) {
      const key = `${d.report_date}_${d.pjp_name}_${d.mcc}`;
      uniqueMap.set(key, d); // Baris yang muncul lebih akhir akan menimpa yang lama
    }
    const uniqueData = Array.from(uniqueMap.values());

    const query = `
      INSERT INTO APPEALS (report_date, pjp_name, pjp_tier, mcc, status, detail_action)
      SELECT * FROM UNNEST ($1::date[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])
      ON CONFLICT (report_date, pjp_name, mcc)
      DO UPDATE SET
        pjp_tier = EXCLUDED.pjp_tier,
        status = EXCLUDED.status,
        detail_action = EXCLUDED.detail_action,
        created_at = CURRENT_TIMESTAMP
    `;

    // Extract arrays for UNNEST dari data yang sudah dide-duplikasi
    const dates = uniqueData.map(d => d.report_date);
    const pjps = uniqueData.map(d => d.pjp_name);
    const tiers = uniqueData.map(d => d.pjp_tier);
    const mccs = uniqueData.map(d => d.mcc);
    const statuses = uniqueData.map(d => d.status);
    const actions = uniqueData.map(d => d.detail_action);

    const result = await client.query(query, [dates, pjps, tiers, mccs, statuses, actions]);
    
    // Result.rowCount will be non-zero representing the total affected rows
    return uniqueData.length;
  }
}
