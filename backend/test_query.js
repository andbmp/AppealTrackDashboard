const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'db_appeal', password: '103032300144', port: 5432 });
async function run() {
  await client.connect();
  const res1 = await client.query('SELECT MAX(report_date) as max_date FROM APPEALS');
  const maxd = res1.rows[0].max_date.toISOString().split('T')[0];
  console.log('Anchor Date:', maxd);
  const res2 = await client.query(`
    SELECT 
      COUNT(*) FILTER (WHERE detail_action ILIKE '%Rekomendasi Nama%') as rn,
      COUNT(*) FILTER (WHERE detail_action ILIKE '%Rekomendasi MCC%') as rm,
      COUNT(*) FILTER (WHERE detail_action ILIKE '%Whitelist%') as wl,
      COUNT(*) FILTER (WHERE detail_action ILIKE '%Reject%') as rj
    FROM APPEALS 
    WHERE report_date >= '${maxd}'::DATE - INTERVAL '30 days' AND pjp_name = 'BRI'
  `);
  console.log('BRI Action Ratio:', res2.rows[0]);
  await client.end();
}
run();
