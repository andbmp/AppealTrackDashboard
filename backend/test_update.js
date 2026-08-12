const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:103032300144@localhost:5432/db_appeal' });
client.connect().then(() => {
  client.query('UPDATE SYSTEM_SETTINGS SET sheet_url = $1 WHERE id = 1', ['https://docs.google.com/spreadsheets/d/1X2Y3Z']).then(() => {
    console.log('updated directly');
    client.query('SELECT * FROM SYSTEM_SETTINGS').then(res => {
      console.log(res.rows);
      client.end();
    });
  });
});
