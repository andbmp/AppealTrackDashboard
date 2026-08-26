import { getClient } from '../config/db';

export async function getTiering() {
  const client = await getClient();
  try {
    const res = await client.query(`
      SELECT pjp_name as pjp, COUNT(*) as volume 
      FROM APPEALS 
      GROUP BY pjp_name
      ORDER BY volume DESC
    `);
    
    const tier1: any[] = [];
    const tier2: any[] = [];
    const tier3: any[] = [];
    
    res.rows.forEach(row => {
      const vol = parseInt(row.volume);
      if (vol > 20) tier1.push(row);
      else if (vol >= 5) tier2.push(row);
      else tier3.push(row);
    });

    return { tier1, tier2, tier3 };
  } finally {
    client.release();
  }
}

export async function getForecast() {
  const client = await getClient();
  try {
    const res = await client.query(`
      SELECT 
        EXTRACT(MONTH FROM report_date) as month, 
        COUNT(*) as total 
      FROM APPEALS 
      GROUP BY month ORDER BY month DESC LIMIT 3
    `);
    
    const totals = res.rows.map(r => parseInt(r.total));
    const avg = totals.length > 0 ? totals.reduce((a,b) => a+b, 0) / totals.length : 0;
    
    return { 
      forecastedNextMonthVolume: Math.round(avg),
      historicalData: res.rows
    };
  } finally {
    client.release();
  }
}

export async function detectAnomalies(dateFilter: string = "") {
   const client = await getClient();
   const anomaliesDetected: any[] = [];
   try {
     // 1. Tentukan Tier tiap PJP berdasarkan data historis (tanpa memedulikan dateFilter)
     // Ini memastikan PJP Tier 1 tetap dianggap Tier 1 walaupun mereka vakum (0 pengajuan) di filter saat ini.
     const tierQuery = await client.query(`
       SELECT pjp_name, COUNT(*) as vol 
       FROM APPEALS 
       GROUP BY pjp_name
     `);
     
     const tier1: string[] = [];
     const tier3: string[] = [];
     tierQuery.rows.forEach(r => {
       const v = parseInt(r.vol);
       if (v > 20) tier1.push(r.pjp_name);
       else if (v < 5) tier3.push(r.pjp_name);
     });

       // 2. [FR-4.3] PJP [tier 1] yang mendadak mengirimkan 0 pengajuan (Vakum > 15 Hari)
       if (tier1.length > 0) {
         const t1Dummy = tier1.length > 0 ? tier1 : ['-'];
         const vacuumQuery = `
          WITH pjp_dates AS (
            SELECT pjp_name, report_date, LAG(report_date) OVER (PARTITION BY pjp_name ORDER BY report_date) as prev_date
            FROM (SELECT DISTINCT pjp_name, report_date FROM APPEALS WHERE pjp_name = ANY($1)) sub
          )
          SELECT pjp_name, report_date as last_date, prev_date, (report_date - prev_date) as gap_days
          FROM pjp_dates
          ${dateFilter ? dateFilter.replace("WHERE report_date", "WHERE report_date").replace("WHERE", "WHERE (") + ") AND " : "WHERE "} (report_date - prev_date) >= 15
       `;
       
       const vacuums = await client.query(vacuumQuery, [t1Dummy]);
       for (const row of vacuums.rows) {
         anomaliesDetected.push({
           type: 'TIER1_VACUUM',
           title: `Peringatan: PJP Tier 1 (${row.pjp_name}) Vakum`,
           description: `Terdapat celah kosong pengajuan selama ${row.gap_days} hari antara ${new Date(row.prev_date).toLocaleDateString('id-ID')} hingga ${new Date(row.last_date).toLocaleDateString('id-ID')} untuk PJP Tier 1 ini.`,
           severity: 'high',
           date: row.last_date
         });
       }

       }
       
     // Hitung rentang hari dari dateFilter untuk pembagi rata-rata harian (agar rata-rata tidak melonjak salah)
     const rangeRes = await client.query(`
       SELECT (MAX(report_date) - MIN(report_date)) + 1 as days FROM APPEALS ${dateFilter}
     `);
     const totalDays = Math.max(parseInt(rangeRes.rows[0].days) || 1, 1);

     // 3. [FR-4.3] PJP [tier 3] melonjak vs Rata-rata Tier 3
     if (tier3.length > 0) {
       const t3Dummy = tier3.length > 0 ? tier3 : ['-'];
       const t3AvgRes = await client.query(`
         SELECT COUNT(*)::FLOAT / $2 as avg_daily 
         FROM APPEALS ${dateFilter ? dateFilter + " AND " : "WHERE "} pjp_name = ANY($1)
       `, [t3Dummy, totalDays]);
       const t3Avg = t3AvgRes.rows[0].avg_daily || 1;

       const t3Spikes = await client.query(`
         SELECT pjp_name, report_date, COUNT(*) as vol
         FROM APPEALS
         ${dateFilter ? dateFilter + " AND " : "WHERE "} pjp_name = ANY($1)
         GROUP BY pjp_name, report_date
         HAVING COUNT(*) > ${Math.max(t3Avg * 3, 5)}
         ORDER BY report_date DESC
         LIMIT 10
       `, [t3Dummy]);

       for (const row of t3Spikes.rows) {
         anomaliesDetected.push({
           type: 'TIER3_SPIKE',
           title: `Lonjakan Ekstrem Tier 3: ${row.pjp_name}`,
           description: `Terdeteksi ${row.vol} pengajuan pada ${new Date(row.report_date).toLocaleDateString('id-ID')}. Ini melonjak 3x lipat di atas rata-rata harian seluruh PJP Tier 3 (${Math.round(t3Avg)}).`,
           severity: 'high',
           date: row.report_date
         });
       }
     }

     // 4. [FR-4.3] PJP [all tier] melonjak vs Rata-rata Seluruh Tier
     const allAvgRes = await client.query(`
       SELECT COUNT(*)::FLOAT / $1 as avg_daily FROM APPEALS ${dateFilter}
     `, [totalDays]);
     const allAvg = allAvgRes.rows[0].avg_daily || 1;

     const allSpikes = await client.query(`
       SELECT pjp_name, report_date, COUNT(*) as vol
       FROM APPEALS
       ${dateFilter}
       GROUP BY pjp_name, report_date
       HAVING COUNT(*) > ${Math.max(allAvg * 2, 10)}
       ORDER BY report_date DESC
       LIMIT 15
     `);

     for (const row of allSpikes.rows) {
       if (!tier3.includes(row.pjp_name)) { // Hindari duplikasi alarm jika sudah masuk alert Tier 3
         anomaliesDetected.push({
           type: 'ALL_TIER_SPIKE',
           title: `Lonjakan Volume Sistem: ${row.pjp_name}`,
           description: `Terdapat ${row.vol} pengajuan pada ${new Date(row.report_date).toLocaleDateString('id-ID')}. Ini melampaui 2x lipat rata-rata harian sistem secara keseluruhan (${Math.round(allAvg)}).`,
           severity: 'medium',
           date: row.report_date
         });
       }
     }

     return { anomaliesDetected };
   } catch (err: any) {
     console.error("Anomaly Detection Error:", err);
     return { anomaliesDetected: [] };
   } finally {
     client.release();
   }
}
