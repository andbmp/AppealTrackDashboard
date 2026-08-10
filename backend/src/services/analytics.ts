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

     // Anomali 1: PJP Spike ( > 15 volume per hari untuk 1 PJP )
     const pjpSpike = await client.query(`
       SELECT pjp_name, report_date, COUNT(*) as vol
       FROM APPEALS
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '7 days'
       GROUP BY pjp_name, report_date
       HAVING COUNT(*) > 15
       ORDER BY report_date DESC
     `);

     for (const row of pjpSpike.rows) {
       anomaliesDetected.push({
         type: 'PJP_SPIKE',
         title: `Lonjakan Volume PJP: ${row.pjp_name}`,
         description: `Terdeteksi ${row.vol} pengajuan dari ${row.pjp_name} pada tanggal ${new Date(row.report_date).toLocaleDateString('id-ID')}. Ini melebihi batas kewajaran harian.`,
         severity: 'high',
         date: row.report_date
       });
     }

     // Anomali 2: MCC Konsentrasi Tinggi ( > 10 per hari untuk 1 MCC spesifik )
     const mccSpike = await client.query(`
       SELECT mcc, report_date, COUNT(*) as vol
       FROM APPEALS
       WHERE report_date >= ${anchorDate}::DATE - INTERVAL '7 days'
       GROUP BY mcc, report_date
       HAVING COUNT(*) > 10
       ORDER BY report_date DESC
     `);

     for (const row of mccSpike.rows) {
       anomaliesDetected.push({
         type: 'MCC_SPIKE',
         title: `Konsentrasi MCC Berisiko: ${row.mcc}`,
         description: `Terdapat ${row.vol} pengajuan pada MCC ${row.mcc} dalam satu hari (${new Date(row.report_date).toLocaleDateString('id-ID')}). Harap periksa kemungkinan fraud/anomali.`,
         severity: 'medium',
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
