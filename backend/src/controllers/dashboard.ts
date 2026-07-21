import { Request, Response } from 'express';
import { getClient } from '../config/db';
import { getTiering, getForecast, detectAnomalies } from '../services/analytics';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const maxDateRes = await client.query(`SELECT MAX(report_date) as max_date FROM APPEALS`);
    const anchorDate = maxDateRes.rows[0].max_date ? `'${maxDateRes.rows[0].max_date.toISOString().split('T')[0]}'` : 'CURRENT_DATE';

    const { startDate, endDate } = req.query;
    const dateFilter = startDate && endDate 
      ? `WHERE report_date BETWEEN $1 AND $2` 
      : `WHERE report_date >= ${anchorDate}::DATE - INTERVAL '30 days'`;
    const params = startDate && endDate ? [startDate, endDate] : [];

    const mccQuery = await client.query(`SELECT COUNT(DISTINCT mcc) as total_mcc FROM APPEALS ${dateFilter}`, params);
    
    // FR-08
    const pjpQuery = await client.query(`SELECT pjp_name as pjp, COUNT(*) as count FROM APPEALS ${dateFilter ? dateFilter + " AND " : "WHERE "} status = 'Done' GROUP BY pjp_name`, params);

    // FR-11
    const volumeQuery = await client.query(`SELECT report_date as tanggal, COUNT(*) as volume FROM APPEALS ${dateFilter} GROUP BY report_date ORDER BY report_date ASC`, params);

    // FR-07: MCC Detail (JOIN dengan master_mcc)

    const getMccQuery = async (interval: string) => {
      const res = await client.query(`
        SELECT 
          a.mcc, 
          COALESCE(m.description, 'Kategori ' || a.mcc) as label, 
          COUNT(DISTINCT a.pjp_name) as count, 
          COUNT(*) as appeals 
        FROM APPEALS a 
        LEFT JOIN master_mcc m ON a.mcc = m.mcc_code 
        WHERE a.report_date >= ${anchorDate}::DATE - INTERVAL '${interval}'
        GROUP BY a.mcc, m.description 
        ORDER BY appeals DESC 
        LIMIT 10
      `);
      return res.rows.map(r => ({ ...r, count: Number(r.count), appeals: Number(r.appeals), pct: Math.round((Number(r.appeals)/Math.max(1, Number(r.count)))*100) }));
    };

    const mccHarian = await getMccQuery('1 day');
    const mccMingguan = await getMccQuery('7 days');
    const mccBulanan = await getMccQuery('30 days');

    // FR-Adv: Heatmap
    const heatRaw = await client.query(`SELECT EXTRACT(ISODOW FROM report_date) as dow, CEIL(EXTRACT(DAY FROM report_date)/7.0) as week, COUNT(*) as count FROM APPEALS GROUP BY dow, week`);
    const dayMap = { 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 7: "Minggu" };
    const heatmapData = [1,2,3,4,5,6,7].map(d => ({
      day: dayMap[d as keyof typeof dayMap],
      w: [1,2,3,4].map(w => Number(heatRaw.rows.find(r => r.dow == d && r.week == w)?.count || 0))
    }));

    // FR-Adv: Action PJP
    const actionPjp = await client.query(`SELECT pjp_name as pjp, COUNT(*) FILTER (WHERE detail_action ILIKE '%Rekomendasi Nama%') as rn, COUNT(*) FILTER (WHERE detail_action ILIKE '%Rekomendasi MCC%') as rm, COUNT(*) FILTER (WHERE detail_action ILIKE '%Whitelist%') as wl, COUNT(*) FILTER (WHERE detail_action ILIKE '%Reject%') as rj FROM APPEALS GROUP BY pjp_name ORDER BY COUNT(*) DESC LIMIT 10`);

    // FR-10: Monthly Trend
    const monthlyTrend = await client.query(`SELECT TO_CHAR(report_date, 'Mon YYYY') as month, COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Done' OR status = 'done') as done, COUNT(*) FILTER (WHERE status = 'Pending' OR status = 'pending') as pending, COUNT(*) FILTER (WHERE status = 'Rejected' OR status = 'rejected') as rejected FROM APPEALS GROUP BY TO_CHAR(report_date, 'Mon YYYY'), EXTRACT(YEAR FROM report_date), EXTRACT(MONTH FROM report_date) ORDER BY EXTRACT(YEAR FROM report_date), EXTRACT(MONTH FROM report_date)`);
    const formattedTrend = monthlyTrend.rows.map(r => ({ month: r.month, total: Number(r.total), done: Number(r.done), pending: Number(r.pending), rejected: Number(r.rejected) }));

    // FR-09: Top 10 PJP
    const top5 = await client.query(`
      SELECT 
        pjp_name as name, 
        'Bank' as type, 
        CASE 
          WHEN COUNT(*) > 20 THEN 1
          WHEN COUNT(*) >= 5 THEN 2
          ELSE 3
        END as tier, 
        COUNT(*) as vol, 
        COUNT(*) FILTER (WHERE status ILIKE 'done') as done 
      FROM APPEALS 
      GROUP BY pjp_name 
      ORDER BY vol DESC 
      LIMIT 10
    `);
    const formattedTop = top5.rows.map(r => ({ ...r, vol: Number(r.vol), done: Number(r.done) }));

    // Activity Log
    const logs = await client.query(`SELECT id, executed_at, source_type, status, rows_processed FROM IMPORT_LOGS ORDER BY executed_at DESC LIMIT 15`);
    const activityLog = logs.rows.map(r => ({
      id: r.id,
      time: new Date(r.executed_at).toLocaleString('id-ID'),
      user: "Admin Master",
      role: "Admin",
      action: "Upload Laporan " + r.source_type,
      status: r.status.toLowerCase(),
      records: Number(r.rows_processed)
    }));

    // Advanced Analytics
    const tiering = await getTiering();
    const forecast = await getForecast();
    const anomalies = await detectAnomalies();

    res.json({
      uniqueMcc: mccQuery.rows[0].total_mcc,
      distributionByPjp: pjpQuery.rows.map(r => ({ pjp: r.pjp, count: Number(r.count) })),
      volumePerDate: volumeQuery.rows.map(r => ({ tanggal: new Date(r.tanggal).toLocaleDateString('id-ID'), volume: Number(r.volume) })),
      mccData: { harian: mccHarian, mingguan: mccMingguan, bulanan: mccBulanan },
      heatmapData,
      actionPjpData: actionPjp.rows.map(r => ({ pjp: r.pjp, rn: Number(r.rn), rm: Number(r.rm), wl: Number(r.wl), rj: Number(r.rj) })),
      monthlyTrend: formattedTrend,
      top5: formattedTop,
      activityLog,
      advanced: {
        tiering,
        forecast,
        anomalies
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'System error', details: error.message });
  } finally {
    client.release();
  }
};
