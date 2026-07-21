import pool from './src/config/database';

async function resetDB() {
  try {
    console.log("Sedang menghapus data tabel...");
    await pool.query('TRUNCATE TABLE operasional_harian_detail RESTART IDENTITY CASCADE;');
    console.log("Berhasil! Semua data telah dihapus dari tabel operasional_harian_detail.");
    process.exit(0);
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    process.exit(1);
  }
}

resetDB();
