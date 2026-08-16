import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AUTO-LOAD .env FILE IF PRESENT
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      const envConfig = fs.readFileSync(envPath, 'utf-8');
      envConfig.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valParts] = trimmedLine.split('=');
          if (key && valParts.length > 0) {
            const val = valParts.join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key.trim()] = val;
          }
        }
      });
    }
  } catch (e) {}
}

const { Pool } = pg;

// PostgreSQL Connection String (Environment variable or local PostgreSQL fallback)
const connectionString = process.env.DATABASE_URL || '';

const isLocalhost = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: connectionString || 'postgres://postgres:postgres@localhost:5432/wms_db',
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
});

export const query = (text, params) => pool.query(text, params);

// Initialize Tables from schema.sql
export async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      console.log('✅ PostgreSQL database tables successfully initialized!');
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Could not initialize PostgreSQL DB (will fallback to data_store.json):', err.message);
  }
  return false;
}

// Fetch all data from PostgreSQL tables
export async function fetchDataFromDb() {
  try {
    const boxesRes = await pool.query('SELECT * FROM boxes ORDER BY created_at DESC');
    const palletsRes = await pool.query('SELECT * FROM pallets ORDER BY placed_at DESC NULLS LAST');
    const zonesRes = await pool.query('SELECT * FROM zones ORDER BY id ASC');

    const boxes = boxesRes.rows.map(row => ({
      id: row.id,
      actNumbers: typeof row.act_numbers === 'string' ? JSON.parse(row.act_numbers) : (row.act_numbers || []),
      palletId: row.pallet_id,
      counterName: row.counter_name,
      userName: row.user_name,
      shift: row.shift,
      createdAt: row.created_at,
      status: row.status,
      notes: row.notes,
      historyLogs: []
    }));

    const pallets = palletsRes.rows.map(row => ({
      id: row.id,
      boxIds: typeof row.box_ids === 'string' ? JSON.parse(row.box_ids) : (row.box_ids || []),
      zoneId: row.zone_id,
      loaderName: row.loader_name,
      status: row.status,
      placedAt: row.placed_at,
      notes: row.notes
    }));

    const zones = zonesRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      sector: row.sector,
      row: row.row_num,
      shelf: row.shelf,
      capacity: row.capacity
    }));

    return { boxes, pallets, zones };
  } catch (err) {
    console.warn('⚠️ Error fetching from PostgreSQL DB:', err.message);
    return null;
  }
}

// Save or sync dataset into PostgreSQL tables
export async function saveDataToDb(data) {
  if (!data) return false;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Sync Boxes
      if (Array.isArray(data.boxes)) {
        for (const box of data.boxes) {
          await client.query(
            `INSERT INTO boxes (id, act_numbers, pallet_id, counter_name, user_name, shift, created_at, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               act_numbers = EXCLUDED.act_numbers,
               pallet_id = EXCLUDED.pallet_id,
               counter_name = EXCLUDED.counter_name,
               user_name = EXCLUDED.user_name,
               shift = EXCLUDED.shift,
               status = EXCLUDED.status,
               notes = EXCLUDED.notes`,
            [
              box.id,
              JSON.stringify(box.actNumbers || []),
              box.palletId || box.id,
              box.counterName || '',
              box.userName || '',
              box.shift || '1 смена',
              box.createdAt || new Date(),
              box.status || 'on_pallet',
              box.notes || ''
            ]
          );
        }
      }

      // 2. Sync Pallets
      if (Array.isArray(data.pallets)) {
        for (const p of data.pallets) {
          await client.query(
            `INSERT INTO pallets (id, box_ids, zone_id, loader_name, status, placed_at, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               box_ids = EXCLUDED.box_ids,
               zone_id = EXCLUDED.zone_id,
               loader_name = EXCLUDED.loader_name,
               status = EXCLUDED.status,
               placed_at = EXCLUDED.placed_at,
               notes = EXCLUDED.notes`,
            [
              p.id,
              JSON.stringify(p.boxIds || []),
              p.zoneId || null,
              p.loaderName || null,
              p.status || 'created',
              p.placedAt || null,
              p.notes || ''
            ]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error saving to PostgreSQL:', err.message);
      return false;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('⚠️ Error connecting to PostgreSQL DB:', err.message);
    return false;
  }
}
