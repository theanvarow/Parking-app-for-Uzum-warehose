import { getClient } from '../db.js';

async function testParkovkaWorkflow() {
  console.log('====================================================');
  console.log('📍 WMS PARKOVKA FIXATION WORKFLOW TEST');
  console.log('====================================================\n');

  const palletId = "84-PARK-TEST-999";
  const zoneId = "ZONE-B4";
  const loaderName = "Sardor (Yuklovchi)";
  const timestamp = new Date().toISOString();

  // 1. Fetch current database state
  const getRes = await fetch('http://localhost:3001/api/data');
  const currentDb = await getRes.json();

  const parkHistoryLog = {
    id: Date.now(),
    time: timestamp,
    worker: `${loaderName} (1 смена)`,
    workerName: loaderName,
    userName: loaderName,
    shift: '1 смена',
    action: 'Парковка',
    actionType: 'park',
    gmId: palletId,
    zoneId: zoneId,
    details: `${palletId} pallet ${zoneId} zonasiga joylashtirildi`
  };

  // Update boxes & pallets as App.jsx does
  let boxFound = false;
  const updatedBoxes = (currentDb.boxes || []).map(b => {
    if (b.id === palletId || b.palletId === palletId) {
      boxFound = true;
      return { ...b, historyLogs: [...(b.historyLogs || []), parkHistoryLog] };
    }
    return b;
  });

  if (!boxFound) {
    updatedBoxes.unshift({
      id: palletId,
      actNumbers: [],
      palletId: palletId,
      counterName: loaderName,
      userName: loaderName,
      shift: '1 смена',
      createdAt: timestamp,
      status: 'on_pallet',
      notes: 'Parkovka qilingan pallet',
      historyLogs: [parkHistoryLog]
    });
  }

  let palletFound = false;
  const updatedPallets = (currentDb.pallets || []).map(p => {
    if (p.id === palletId) {
      palletFound = true;
      return { ...p, zoneId: zoneId, loaderName: loaderName, status: 'parked', placedAt: timestamp };
    }
    return p;
  });

  if (!palletFound) {
    updatedPallets.unshift({
      id: palletId,
      boxIds: [palletId],
      zoneId: zoneId,
      loaderName: loaderName,
      status: 'parked',
      placedAt: timestamp,
      notes: 'Parkovka qilingan'
    });
  }

  const payload = {
    ...currentDb,
    boxes: updatedBoxes,
    pallets: updatedPallets
  };

  console.log('1️⃣  PARKOVKA SINXRONIZATSIYASI (POST /api/sync)...');
  const syncRes = await fetch('http://localhost:3001/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const syncResult = await syncRes.json();
  console.log('   ✅ Server response status:', syncResult.status);

  console.log('\n2️⃣  POSTGRESQL BAZASIDAN PARKOVKA NATIJASINI TEKSHIRISH:');
  const client = await getClient();
  try {
    const pRes = await client.query('SELECT * FROM pallets WHERE id = $1', [palletId]);
    console.log('   📌 Pallets jadvalidagi status va zone_id:');
    console.dir(pRes.rows[0], { depth: null });

    const lRes = await client.query('SELECT * FROM history_logs WHERE gm_id = $1 AND action_type = \'park\' ORDER BY id DESC LIMIT 1', [palletId]);
    console.log('\n   📌 History Logs jadvalidagi Parkovka amali:');
    console.dir(lRes.rows[0], { depth: null });
  } finally {
    await client.end();
  }
}

testParkovkaWorkflow().catch(console.error);
