import app from './app';
import dotenv from 'dotenv';
import { initCronJobs } from './services/reporting';

dotenv.config();

const port = process.env.PORT || 5000;

// Start background jobs
initCronJobs();

app.listen(port, () => {
  console.log(`[Server]: Server berjalan di http://localhost:${port}`);
});
