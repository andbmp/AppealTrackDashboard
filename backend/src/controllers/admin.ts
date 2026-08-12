import { Request, Response } from 'express';
import { getClient } from '../config/db';

export const getConfig = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS SYSTEM_SETTINGS (id INT PRIMARY KEY DEFAULT 1, sheet_url TEXT)`);
    
    const emailRes = await client.query('SELECT recipient_emails FROM SCHEDULED_REPORTS LIMIT 1');
    const emails = emailRes.rows.length > 0 ? emailRes.rows[0].recipient_emails.split('\n') : [];
    
    const settingsRes = await client.query('SELECT sheet_url FROM SYSTEM_SETTINGS LIMIT 1');
    const sheetUrl = settingsRes.rows.length > 0 ? settingsRes.rows[0].sheet_url : '';

    res.json({ emails, sheetUrl });
  } catch (error: any) {
    res.status(500).json({ error: 'Database error', details: error.message });
  } finally {
    client.release();
  }
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { emails, sheetUrl } = req.body;
    console.log("Menerima request save config:", { emails, sheetUrl });
    
    if (emails && Array.isArray(emails)) {
      const emailString = emails.join('\n');
      const check = await client.query('SELECT id FROM SCHEDULED_REPORTS LIMIT 1');
      if (check.rows.length > 0) {
        await client.query('UPDATE SCHEDULED_REPORTS SET recipient_emails = $1 WHERE id = $2', [emailString, check.rows[0].id]);
      } else {
        await client.query('INSERT INTO SCHEDULED_REPORTS (report_type, recipient_emails) VALUES ($1, $2)', ['ANOMALY_ALERT', emailString]);
      }
    }

    if (sheetUrl !== undefined) {
      await client.query(`CREATE TABLE IF NOT EXISTS SYSTEM_SETTINGS (id INT PRIMARY KEY DEFAULT 1, sheet_url TEXT)`);
      const checkSet = await client.query('SELECT id FROM SYSTEM_SETTINGS LIMIT 1');
      if (checkSet.rows.length > 0) {
        await client.query('UPDATE SYSTEM_SETTINGS SET sheet_url = $1 WHERE id = $2', [sheetUrl, checkSet.rows[0].id]);
      } else {
        await client.query('INSERT INTO SYSTEM_SETTINGS (id, sheet_url) VALUES (1, $1)', [sheetUrl]);
      }
    }

    res.json({ message: 'Config updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Database error', details: error.message });
  } finally {
    client.release();
  }
};
