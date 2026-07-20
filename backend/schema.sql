-- ==============================================================================
-- DATABASE SCHEMA & DATA INITIALIZATION
-- Dashboard Analisis Laporan Appeal Pendaftaran Merchant PJP
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CLEANUP (Opsional: Menghapus tabel lama jika ingin mengulang dari awal)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS operasional_harian_detail CASCADE;
DROP TABLE IF EXISTS operasional_harian_blacklist CASCADE;
DROP TABLE IF EXISTS operasional_harian_ktpnp CASCADE;
DROP TABLE IF EXISTS summary_appeal CASCADE;
DROP TABLE IF EXISTS master_mcc CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- ------------------------------------------------------------------------------
-- 1. TABEL MASTER: Merchant Category Code (MCC)
-- ------------------------------------------------------------------------------
CREATE TABLE master_mcc (
    mcc_code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. TABEL OPERASIONAL UTAMA
-- ------------------------------------------------------------------------------

-- Tabel: Operasional Harian Detail (Eskalasi Data Merchant)
CREATE TABLE operasional_harian_detail (
    id SERIAL PRIMARY KEY,
    no_referensi VARCHAR(100),
    tanggal DATE NOT NULL,
    appeal_worker VARCHAR(150),
    pjp VARCHAR(255) NOT NULL,
    nama_merchant VARCHAR(255) NOT NULL,
    mcc VARCHAR(50),
    tanggal_respond DATE,
    rekomendasi_nama_merchant VARCHAR(255),
    rekomendasi_mcc VARCHAR(50),
    action VARCHAR(150),
    bukti_pendukung_1 TEXT,
    bukti_pendukung_2 TEXT,
    bukti_pendukung_3 TEXT,
    bukti_pendukung_4 TEXT,
    insert_whitelist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Constraint agar fungsi UPSERT (ON CONFLICT) berjalan akurat saat ada pembaruan data
    CONSTRAINT unique_appeal_merchant UNIQUE (tanggal, pjp, nama_merchant)
);

-- Tabel: Operasional Harian Blacklist
CREATE TABLE operasional_harian_blacklist (
    id SERIAL PRIMARY KEY,
    no_referensi VARCHAR(100),
    tanggal DATE NOT NULL,
    pjp VARCHAR(255) NOT NULL,
    nama_merchant VARCHAR(255) NOT NULL,
    ktp VARCHAR(100),
    npwp VARCHAR(100),
    pjp_yang_melaporkan VARCHAR(255),
    terindikasi_nama_merchant VARCHAR(255),
    terindikasi_ktp VARCHAR(100),
    terindikasi_npwp VARCHAR(100),
    keterangan_delete TEXT,
    kota VARCHAR(150),
    kodepos VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: Operasional Harian Detail KTP & NPWP (KTPNP)
CREATE TABLE operasional_harian_ktpnp (
    id SERIAL PRIMARY KEY,
    no_referensi VARCHAR(100),
    tanggal DATE NOT NULL,
    appeal_worker VARCHAR(150),
    pjp VARCHAR(255) NOT NULL,
    nomor_ktp VARCHAR(100),
    nomor_npwp VARCHAR(100),
    tanggal_respon DATE,
    respon_nomor_ktp VARCHAR(100),
    respon_nomor_npwp VARCHAR(100),
    action VARCHAR(150),
    bukti_pendukung_1 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: Summary Appeal (Untuk keperluan agregasi pencapaian harian makro)
CREATE TABLE summary_appeal (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL UNIQUE,
    total_appeal_affan INT DEFAULT 0,
    total_appeal_sulthan INT DEFAULT 0,
    total_appeal_merchant INT DEFAULT 0,
    selisih_appeal_worker INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: Audit Trail (Log Aktivitas Pengguna)
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    aktivitas TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION (Mempercepat Loading Dashboard < 2 Detik)
-- ------------------------------------------------------------------------------
CREATE INDEX idx_ophariandetail_tanggal ON operasional_harian_detail(tanggal);
CREATE INDEX idx_ophariandetail_pjp ON operasional_harian_detail(pjp);
CREATE INDEX idx_opharianblacklist_tanggal ON operasional_harian_blacklist(tanggal);
CREATE INDEX idx_opharian_ktpnp_tanggal ON operasional_harian_ktpnp(tanggal);
CREATE INDEX idx_summary_appeal_tanggal ON summary_appeal(tanggal);

