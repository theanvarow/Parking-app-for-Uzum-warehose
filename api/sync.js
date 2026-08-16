import { saveDataToDb, fetchDataFromDb, initDb } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body && (body.boxes || body.pallets)) {
      await saveDataToDb(body);
      const updated = await fetchDataFromDb();
      return res.status(200).json({ status: 'ok', data: updated });
    }
    return res.status(400).json({ error: 'Invalid data format' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
