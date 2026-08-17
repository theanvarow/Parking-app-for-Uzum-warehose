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

const NEON_DB_FALLBACK = "postgresql://neondb_owner:npg_7vN5cgAiwmoD@ep-rough-dust-axq99tna-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const connectionString = process.env.DATABASE_URL || NEON_DB_FALLBACK;
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

// Helper to create a direct client for reliable serverless execution
export async function getClient() {
  const client = new pg.Client({
    connectionString: connectionString || NEON_DB_FALLBACK,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  });
  await client.connect();
  return client;
}

export const query = async (text, params) => {
  const client = await getClient();
  try {
    return await client.query(text, params);
  } finally {
    await client.end().catch(() => {});
  }
};

// Initialize Tables from schema.sql
export async function initDb() {
  let client;
  try {
    client = await getClient();
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(sql);
      console.log('✅ PostgreSQL database tables successfully initialized!');
      return true;
    }
  } catch (err) {
    console.warn('⚠️ Could not initialize PostgreSQL DB:', err.message);
  } finally {
    if (client) await client.end().catch(() => {});
  }
  return false;
}

// Fetch all data from PostgreSQL tables
export async function fetchDataFromDb() {
  let client;
  try {
    client = await getClient();
    const boxesRes = await client.query('SELECT * FROM boxes ORDER BY created_at DESC');
    const palletsRes = await client.query('SELECT * FROM pallets ORDER BY placed_at DESC NULLS LAST');
    const zonesRes = await client.query('SELECT * FROM zones ORDER BY id ASC');
    let logsRes = { rows: [] };
    try {
      logsRes = await client.query('SELECT * FROM history_logs ORDER BY created_at DESC');
    } catch (e) {}

    const logsMap = {};
    for (const log of logsRes.rows) {
      const key = log.gm_id;
      if (!logsMap[key]) logsMap[key] = [];
      logsMap[key].push({
        id: log.id,
        time: log.time,
        worker: log.worker,
        workerName: log.worker_name,
        userName: log.user_name,
        shift: log.shift,
        action: log.action,
        actionType: log.action_type,
        gmId: log.gm_id,
        zoneId: log.zone_id,
        count: log.count,
        details: log.details
      });
    }

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
      historyLogs: logsMap[row.id] || []
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
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

const parseToUtcIso = (val) => {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') {
    if (val.includes('Z') || val.includes('+')) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    const d = new Date(`${val.replace(' ', 'T')}+05:00`);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
};

// Save or sync dataset into PostgreSQL tables
export async function saveDataToDb(data) {
  if (!data) return false;
  let client;
  try {
    client = await getClient();

    // 1. Sync Boxes
    if (Array.isArray(data.boxes)) {
      for (const box of data.boxes) {
        try {
          const formattedCreatedAt = parseToUtcIso(box.createdAt);
          await client.query(
            `INSERT INTO boxes (id, act_numbers, pallet_id, counter_name, user_name, shift, created_at, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               act_numbers = EXCLUDED.act_numbers,
               pallet_id = EXCLUDED.pallet_id,
               counter_name = EXCLUDED.counter_name,
               user_name = EXCLUDED.user_name,
               shift = EXCLUDED.shift,
               created_at = EXCLUDED.created_at,
               status = EXCLUDED.status,
               notes = EXCLUDED.notes`,
            [
              box.id,
              JSON.stringify(box.actNumbers || []),
              box.palletId || box.id,
              box.counterName || '',
              box.userName || '',
              box.shift || '1 смена',
              formattedCreatedAt,
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
          const formattedPlacedAt = p.placedAt ? parseToUtcIso(p.placedAt) : null;
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
              formattedPlacedAt,
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
              const formattedLogTime = parseToUtcIso(log.time);
              const logGmId = log.gmId || box.id;
              const logActionType = log.actionType || 'sort';
              const logTimeStr = log.time || '';

              const logZoneId = log.zoneId || null;
              const existingLog = await client.query(
                `SELECT id FROM history_logs WHERE gm_id = $1 AND action_type = $2 AND time = $3 AND (zone_id = $4 OR ($4::text IS NULL AND zone_id IS NULL)) LIMIT 1`,
                [logGmId, logActionType, logTimeStr, logZoneId]
              );

              if (existingLog.rows.length === 0) {
                await client.query(
                  `INSERT INTO history_logs (time, worker, worker_name, user_name, shift, action, action_type, gm_id, zone_id, count, details, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    logTimeStr || new Date().toISOString(),
                    log.worker || box.counterName || '',
                    log.workerName || box.userName || '',
                    log.userName || box.userName || '',
                    log.shift || box.shift || '1 смена',
                    log.action || 'Сортировка',
                    logActionType,
                    logGmId,
                    log.zoneId || null,
                    log.count || (box.actNumbers ? box.actNumbers.length : 0),
                    log.details || '',
                    formattedLogTime
                  ]
                );
              }
            } catch (errLog) {}
          }
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('⚠️ Error connecting to PostgreSQL DB:', err.message);
    return false;
  } finally {
    if (client) await client.end().catch(() => {});
  }
}
