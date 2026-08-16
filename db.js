import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AUTO-LOAD .env FILE IF PRESENT
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
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
  }
} catch (e) {}

const { Pool } = pg;

// PostgreSQL Connection String (Environment variable or direct Neon Cloud fallback for Vercel)
const NEON_DB_FALLBACK = "postgresql://neondb_owner:npg_7vN5cgAiwmoD@ep-rough-dust-axq99tna-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const connectionString = process.env.DATABASE_URL || NEON_DB_FALLBACK;

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: connectionString || NEON_DB_FALLBACK,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
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
// Save or sync dataset into PostgreSQL tables
export async function saveDataToDb(data) {
  if (!data) return false;
  try {
    const client = await pool.connect();
    try {
      // 1. Sync Boxes
      if (Array.isArray(data.boxes)) {
        for (const box of data.boxes) {
          try {
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
          } catch (errBox) {
            console.error(`⚠️ Error saving box ${box.id} to DB:`, errBox.message);
          }
        }
      }

      // 2. Sync Pallets
      if (Array.isArray(data.pallets)) {
        for (const p of data.pallets) {
          try {
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
          } catch (errPallet) {
            console.error(`⚠️ Error saving pallet ${p.id} to DB:`, errPallet.message);
          }
        }
      }

      // 3. Sync History Logs
      if (Array.isArray(data.boxes)) {
        for (const box of data.boxes) {
          if (Array.isArray(box.historyLogs)) {
            for (const log of box.historyLogs) {
              try {
                await client.query(
                  `INSERT INTO history_logs (time, worker, worker_name, user_name, shift, action, action_type, gm_id, zone_id, count, details)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                  [
                    log.time || new Date().toISOString(),
                    log.worker || box.counterName || '',
                    log.workerName || box.userName || '',
                    log.userName || box.userName || '',
                    log.shift || box.shift || '1 смена',
                    log.action || 'Сортировка',
                    log.actionType || 'sort',
                    log.gmId || box.id,
                    log.zoneId || null,
                    log.count || (box.actNumbers ? box.actNumbers.length : 0),
                    log.details || ''
                  ]
                );
              } catch (errLog) {
                // Ignore duplicate log errors
              }
            }
          }
        }
      }

      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('⚠️ Error connecting to PostgreSQL DB:', err.message);
    return false;
  }
}
