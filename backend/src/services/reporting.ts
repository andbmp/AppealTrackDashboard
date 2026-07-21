import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { getDashboardStats } from '../controllers/dashboard';

// FR-20: Scheduled reporting
export function initCronJobs() {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily report job...');
    
    // In a real app, you'd pull the configured emails from the DB
    // and fetch the actual dashboard stats to format an email.
    
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });
    
    console.log('Daily report sent (simulated).');
  });
}
