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
   const forecast = await getForecast();
   return { anomaliesDetected: [] };
}
