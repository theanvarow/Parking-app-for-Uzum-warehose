import { fetchDataFromDb, initDb } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDb();
    const data = await fetchDataFromDb();
    if (data) {
      return res.status(200).json(data);
    }
    return res.status(200).json({ boxes: [], pallets: [], zones: [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
