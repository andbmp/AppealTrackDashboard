import { query } from './src/config/db';

async function resetDB() {
  try {
    console.log("Sedang menghapus data tabel...");
    await query('TRUNCATE TABLE APPEALS, ANOMALIES, IMPORT_LOGS RESTART IDENTITY CASCADE;');
    console.log("Berhasil! Semua data telah dihapus dari tabel APPEALS, ANOMALIES, dan IMPORT_LOGS.");
    process.exit(0);
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    process.exit(1);
  }
}

resetDB();
