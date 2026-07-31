import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data_store.json');
const DIST_DIR = path.join(__dirname, 'dist');

// INITIAL DEFAULT DATABASE
const DEFAULT_ZONES = [
  { id: 'ZONE-A1', name: 'Sektor A - Qabul 1', sector: 'A', row: 1, shelf: 1, capacity: 5 },
  { id: 'ZONE-A2', name: 'Sektor A - Qabul 2', sector: 'A', row: 1, shelf: 2, capacity: 5 },
  { id: 'ZONE-A3', name: 'Sektor A - Qabul 3', sector: 'A', row: 2, shelf: 1, capacity: 5 },
  
  { id: 'ZONE-B1', name: 'Sektor B - Parkovka 1', sector: 'B', row: 1, shelf: 1, capacity: 8 },
  { id: 'ZONE-B2', name: 'Sektor B - Parkovka 2', sector: 'B', row: 1, shelf: 2, capacity: 8 },
  { id: 'ZONE-B3', name: 'Sektor B - Parkovka 3', sector: 'B', row: 2, shelf: 1, capacity: 8 },
  { id: 'ZONE-B4', name: 'Sektor B - Parkovka 4', sector: 'B', row: 2, shelf: 2, capacity: 8 },

  { id: 'ZONE-C1', name: 'Sektor C - Javon 1 (2-qavat)', sector: 'C', row: 1, shelf: 1, capacity: 10 },
  { id: 'ZONE-C2', name: 'Sektor C - Javon 2 (2-qavat)', sector: 'C', row: 1, shelf: 2, capacity: 10 },
  { id: 'ZONE-C3', name: 'Sektor C - Javon 3 (3-qavat)', sector: 'C', row: 2, shelf: 1, capacity: 10 },

  { id: 'ZONE-D1', name: 'Sektor D - Razmeshcheniye', sector: 'D', row: 1, shelf: 1, capacity: 12 },
  { id: 'ZONE-D2', name: 'Sektor D - Yuklash Hududi', sector: 'D', row: 1, shelf: 2, capacity: 12 },
];

const DEFAULT_BOXES = [
  {
    id: '84-000056560',
    actNumbers: ['32879', '3848', '4848', '484959', '48548', '134231'],
    palletId: '84-000056560',
    counterName: "JO'RABEK SAIDIMURADOV",
    userName: "JO'RABEK SAIDIMURADOV",
    shift: '1 смена',
    createdAt: '2026-07-29 17:50:12',
    status: 'on_pallet',
    historyLogs: [
      {
        id: 101,
        time: '2026-07-29 17:50:12',
        worker: "JO'RABEK SAIDIMURADOV (1-смена)",
        workerName: "JO'RABEK SAIDIMURADOV",
        userName: "JO'RABEK SAIDIMURADOV",
        shift: '1 смена',
        action: 'Сортировка',
        actionType: 'sort',
        gmId: '84-000056560',
        count: 6,
        details: '84-000056560 pallet va 6 ta korob sortirovka qilindi'
      },
      {
        id: 102,
        time: '2026-07-29 17:54:45',
        worker: "JO'RABEK SAIDIMURADOV (Yuklovchi)",
        workerName: "JO'RABEK SAIDIMURADOV",
        userName: "JO'RABEK SAIDIMURADOV",
        shift: '1 смена',
        action: 'Парковка',
        actionType: 'park',
        gmId: '84-000056560',
        zoneId: 'ZONE-B4',
        details: '84-000056560 pallet ZONE-B4 (Sektor B - Parkovka 4) zonasiga joylashtirildi'
      }
    ],
    notes: 'Kiyim-kechaklar va tovarlar'
  }
];

const DEFAULT_PALLETS = [
  {
    id: '84-000056560',
    boxIds: ['84-000056560'],
    zoneId: 'ZONE-B4',
    loaderName: "JO'RABEK SAIDIMURADOV",
    status: 'parked',
    placedAt: '2026-07-29 17:54:45',
    notes: 'B4 parkovkasiga qo\'yilgan'
  }
];

// LOAD STORED DATA FROM FILE OR USE DEFAULTS
function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading data_store.json:', err);
  }
  return { boxes: DEFAULT_BOXES, pallets: DEFAULT_PALLETS, zones: DEFAULT_ZONES };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data_store.json:', err);
  }
}

let db = loadDatabase();

// MIME TYPES FOR STATIC FILE SERVING
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP SERVER CREATION
const server = http.createServer((req, res) => {
  // CORS HEADERS FOR MULTI-DEVICE ACCESSIBILITY
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;

  // REST API ENDPOINTS
  if (url.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && url === '/api/data') {
      res.writeHead(200);
      res.end(JSON.stringify(db));
      return;
    }

    if (req.method === 'POST' && url === '/api/sync') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.boxes && parsed.pallets) {
            db = parsed;
            saveDatabase(db);
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'ok', data: db }));
          } else {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid data structure' }));
          }
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Bad JSON' }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url === '/api/reset') {
      db = { boxes: DEFAULT_BOXES, pallets: DEFAULT_PALLETS, zones: DEFAULT_ZONES };
      saveDatabase(db);
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', data: db }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API route not found' }));
    return;
  }

  // STATIC FILE SERVING FOR PRODUCTION DIST BUNDLE
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: File not found. Build the frontend with `npm run build` first.');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 WMS MULTI-USER WAREHOUSE SERVER IS RUNNING!`);
  console.log(`==================================================`);
  console.log(`   Localhost:  http://localhost:${PORT}`);
  console.log(`   Network/Wi-Fi: http://0.0.0.0:${PORT} (Access from any phone/TSD gun)`);
  console.log(`   Data Store: ${DATA_FILE}`);
  console.log(`==================================================\n`);
});
