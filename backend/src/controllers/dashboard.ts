import { Request, Response } from 'express';
import { getClient } from '../config/db';
import { getTiering, getForecast, detectAnomalies } from '../services/analytics';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate 
      ? `WHERE report_date BETWEEN $1 AND $2` 
      : `WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'`;
    
    const params = startDate && endDate ? [startDate, endDate] : [];

    const mccQuery = await client.query(`SELECT COUNT(DISTINCT mcc) as total_mcc FROM APPEALS ${dateFilter}`, params);
    
    const pjpQuery = await client.query(`
      SELECT pjp_name as pjp, COUNT(*) as count 
      FROM APPEALS 
      ${dateFilter ? dateFilter + " AND " : "WHERE "} status = 'Done'
      GROUP BY pjp_name
    `, params);

    const volumeQuery = await client.query(`
      SELECT report_date as tanggal, COUNT(*) as volume 
      FROM APPEALS 
      ${dateFilter}
      GROUP BY report_date ORDER BY report_date ASC
    `, params);

    const tiering = await getTiering();
    const forecast = await getForecast();
    const anomalies = await detectAnomalies();

    res.json({
      uniqueMcc: mccQuery.rows[0].total_mcc,
      distributionByPjp: pjpQuery.rows,
      volumePerDate: volumeQuery.rows,
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
