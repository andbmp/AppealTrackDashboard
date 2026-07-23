-- ==============================================================================
-- DATABASE SCHEMA: Dashboard Analisis Laporan Appeal (appealtrack.md)
-- ==============================================================================

DROP TABLE IF EXISTS SCHEDULED_REPORTS CASCADE;
DROP TABLE IF EXISTS ANOMALIES CASCADE;
DROP TABLE IF EXISTS IMPORT_LOGS CASCADE;
DROP TABLE IF EXISTS APPEALS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;
DROP TABLE IF EXISTS master_mcc CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. MASTER_MCC
CREATE TABLE master_mcc (
    mcc_code VARCHAR(10) PRIMARY KEY,
    description VARCHAR(255)
);

-- 1. USERS
CREATE TABLE USERS (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Manajemen', 'Staff')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. APPEALS
CREATE TABLE APPEALS (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    pjp_name VARCHAR(255) NOT NULL,
    pjp_tier VARCHAR(50),
    mcc VARCHAR(50),
    status VARCHAR(150),
    detail_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upsert constraint: Assume unique by report_date, pjp_name, and mcc/status combination to prevent duplication.
-- To keep it simple and robust per ponytail, we will enforce a strict constraint on date, pjp, and mcc.
ALTER TABLE APPEALS ADD CONSTRAINT unique_appeal_upsert UNIQUE (report_date, pjp_name, mcc);

-- 3. IMPORT_LOGS
CREATE TABLE IMPORT_LOGS (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES USERS(id) ON DELETE SET NULL,
    source_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    rows_processed INT DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ANOMALIES
CREATE TABLE ANOMALIES (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appeal_id UUID REFERENCES APPEALS(id) ON DELETE CASCADE,
    rule_type VARCHAR(150) NOT NULL,
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SCHEDULED_REPORTS
CREATE TABLE SCHEDULED_REPORTS (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(100) NOT NULL,
    recipient_emails TEXT NOT NULL,
    last_sent TIMESTAMP
);

-- Seed default Admin User (password is 'admin' hashed with bcrypt)
INSERT INTO USERS (email, name, password_hash, role) 
VALUES ('admin@gmail.com', 'System Admin', '$2b$10$xBdiVTTbjDluwACC0XohKuvfnJKl9tFi8x.Lhvzs264kn95qvp0RK', 'Admin');