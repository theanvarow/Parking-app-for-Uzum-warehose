-- WMS Warehouse Terminal Database Schema for PostgreSQL

CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(50),
  row_num INT,
  shelf INT,
  capacity INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS boxes (
  id VARCHAR(100) PRIMARY KEY,
  act_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  pallet_id VARCHAR(100) NOT NULL,
  counter_name VARCHAR(255),
  user_name VARCHAR(255),
  shift VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'on_pallet',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS pallets (
  id VARCHAR(100) PRIMARY KEY,
  box_ids JSONB DEFAULT '[]'::jsonb,
  zone_id VARCHAR(100),
  loader_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created',
  placed_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS history_logs (
  id BIGSERIAL PRIMARY KEY,
  time VARCHAR(100),
  worker VARCHAR(255),
  worker_name VARCHAR(255),
  user_name VARCHAR(255),
  shift VARCHAR(50),
  action VARCHAR(100),
  action_type VARCHAR(50),
  gm_id VARCHAR(100),
  zone_id VARCHAR(100),
  count INT DEFAULT 0,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INITIAL SEED ZONES
INSERT INTO zones (id, name, sector, row_num, shelf, capacity) VALUES
  ('ZONE-A1', 'Sektor A - Qabul 1', 'A', 1, 1, 5),
  ('ZONE-A2', 'Sektor A - Qabul 2', 'A', 1, 2, 5),
  ('ZONE-B1', 'Sektor B - Parkovka 1', 'B', 1, 1, 8),
  ('ZONE-B2', 'Sektor B - Parkovka 2', 'B', 1, 2, 8),
  ('ZONE-B3', 'Sektor B - Parkovka 3', 'B', 2, 1, 8),
  ('ZONE-B4', 'Sektor B - Parkovka 4', 'B', 2, 2, 8)
ON CONFLICT (id) DO NOTHING;
