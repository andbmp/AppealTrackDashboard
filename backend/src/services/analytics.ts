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

export async function detectAnomalies() {
   const client = await getClient();
   const anomaliesDetected: any[] = [];
   try {
     const maxDateRes = await client.query(`SELECT MAX(report_date) as max_date FROM APPEALS`);
     const anchorDate = maxDateRes.rows[0].max_date ? `'${maxDateRes.rows[0].max_date.toISOString().split('T')[0]}'` : 'CURRENT_DATE';

     // Hitung tiering historis (HANYA berdasarkan data sebelum 7 hari terakhir)
     // Ini mencegah "Paradoks Tier": di mana PJP Tier 3 yang mendadak melonjak langsung dianggap Tier 2 dan lolos dari deteksi.
     const histTiers = await client.query(`
       SELECT pjp_name, COUNT(*) as vol 
       FROM APPEALS 
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '45 days'
       AND report_date < ${anchorDate}::DATE - INTERVAL '15 days'
       GROUP BY pjp_name
     `);
     
     const tier1Names: string[] = [];
     const tier3Names: string[] = [];
     
     histTiers.rows.forEach(r => {
       const v = parseInt(r.vol);
       if (v > 20) tier1Names.push(r.pjp_name);
       else if (v < 5) tier3Names.push(r.pjp_name);
     });

     // 1. Anomali FR-4.3: PJP [tier 1] mendadak 0 pengajuan (7 hari terakhir)
     if (tier1Names.length > 0) {
       const recentT1 = await client.query(`
         SELECT DISTINCT pjp_name FROM APPEALS 
         WHERE report_date >= ${anchorDate}::DATE - INTERVAL '15 days' 
         AND pjp_name = ANY($1)
       `, [tier1Names]);
        const activeT1 = recentT1.rows.map(r => r.pjp_name);
       const inactiveT1 = tier1Names.filter((pjp: string) => !activeT1.includes(pjp));
        if (inactiveT1.length > 0) {
         const pjpList = inactiveT1.join(', ');
         anomaliesDetected.push({
           type: 'TIER1_ZERO',
           title: `Peringatan: ${inactiveT1.length} PJP (Tier 1) Vakum`,
           description: `Terdapat ${inactiveT1.length} PJP Tier 1 (${pjpList}) yang mendadak mengirimkan 0 pengajuan appeal dalam 15 hari terakhir. Silakan selidiki hambatan operasional mereka.`,
           severity: 'high',
           date: maxDateRes.rows[0].max_date || new Date()
         });
       }
     }

     // 2. Anomali FR-4.3: PJP [tier 3] lonjakan vs rata-rata Tier 3 bulan sebelumnya
     const t3Dummy = tier3Names.length > 0 ? tier3Names : ['-'];
     const t3AvgRes = await client.query(`
       SELECT COUNT(*)::FLOAT / 30 as avg_daily 
       FROM APPEALS 
       WHERE pjp_name = ANY($1) 
       AND report_date >= ${anchorDate}::DATE - INTERVAL '45 days' 
       AND report_date < ${anchorDate}::DATE - INTERVAL '15 days'
     `, [t3Dummy]);
     const t3Avg = t3AvgRes.rows[0].avg_daily || 1;

     const t3Spikes = await client.query(`
       SELECT pjp_name, report_date, COUNT(*) as vol
       FROM APPEALS
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '15 days'
       AND pjp_name = ANY($1)
       GROUP BY pjp_name, report_date
       HAVING COUNT(*) > ${Math.max(t3Avg * 3, 5)}
       ORDER BY report_date DESC
     `, [t3Dummy]);

     for (const row of t3Spikes.rows) {
       anomaliesDetected.push({
         type: 'TIER3_SPIKE',
         title: `Lonjakan Ekstrem Tier 3: ${row.pjp_name}`,
         description: `Terdeteksi ${row.vol} pengajuan pada ${new Date(row.report_date).toLocaleDateString('id-ID')}. Ini melonjak sangat jauh dari rata-rata PJP Tier 3 bulan lalu.`,
         severity: 'high',
         date: row.report_date
       });
     }

     // 3. Anomali FR-4.3: PJP [all tier] lonjakan vs rata-rata seluruh tier bulan lalu
     const allAvgRes = await client.query(`
       SELECT COUNT(*)::FLOAT / 30 as avg_daily 
       FROM APPEALS 
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '45 days' 
       AND report_date < ${anchorDate}::DATE - INTERVAL '15 days'
     `);
     const allAvg = allAvgRes.rows[0].avg_daily || 1;

     const allSpikes = await client.query(`
       SELECT pjp_name, report_date, COUNT(*) as vol
       FROM APPEALS
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '15 days'
       GROUP BY pjp_name, report_date
       HAVING COUNT(*) > ${Math.max(allAvg * 2, 10)}
       ORDER BY report_date DESC
     `);

     for (const row of allSpikes.rows) {
       if (!tier3Names.includes(row.pjp_name)) { // Jangan didobel jika sudah masuk di alarm Tier 3
         anomaliesDetected.push({
           type: 'ALL_TIER_SPIKE',
           title: `Lonjakan Volume Sistem: ${row.pjp_name}`,
           description: `Terdapat ${row.vol} pengajuan pada ${new Date(row.report_date).toLocaleDateString('id-ID')}. Lonjakan ini melampaui rata-rata harian sistem dari bulan sebelumnya.`,
           severity: 'medium',
           date: row.report_date
         });
       }
     }

     // 4. Anomali FR-4.3 (Kalimat Utama): Konsentrasi Fraud pada satu kategori merchant (MCC)
     const mccSpikes = await client.query(`
       SELECT mcc, report_date, COUNT(*) as vol
       FROM APPEALS
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '15 days'
       GROUP BY mcc, report_date
       HAVING COUNT(*) > 10
       ORDER BY report_date DESC
     `);

     for (const row of mccSpikes.rows) {
       anomaliesDetected.push({
         type: 'MCC_SPIKE',
         title: `Konsentrasi Fraud Berisiko (MCC: ${row.mcc})`,
         description: `Terdapat ${row.vol} pengajuan pada kategori MCC ${row.mcc} dalam satu hari (${new Date(row.report_date).toLocaleDateString('id-ID')}). Harap periksa kemungkinan fraud/pencucian uang.`,
         severity: 'high',
         date: row.report_date
       });
     }

     return { anomaliesDetected };
   } catch (err: any) {
     console.error("Anomaly Detection Error:", err);
     return { anomaliesDetected: [] };
   } finally {
     client.release();
   }
}
