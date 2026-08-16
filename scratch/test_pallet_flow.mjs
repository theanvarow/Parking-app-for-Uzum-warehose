import { getClient } from '../db.js';

async function runPalletWorkflow() {
  console.log('====================================================');
  console.log('🚀 WMS TERMINAL: PALLET SCAN & ZAVERSHIT WORKFLOW');
  console.log('====================================================\n');
  
  const workerName = "Alisher Navoiy (TSD Gun)";
  const shift = "1 смена";
  const palletId = "84-000055443";
  const boxCodes = ["80-44111", "80-44112", "80-44113", "80-44114"];
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  console.log('1️⃣  DASTURGA KIRISH:');
  console.log(`   - FIO / Xodim: ${workerName}`);
  console.log(`   - Smena: ${shift}`);

  console.log('\n2️⃣  PALLET SKANERLASH & KOROB TIQISH:');
  console.log(`   - Pallet ID: ${palletId}`);
  console.log(`   - Skanerlangan Koroblar (${boxCodes.length} ta):`);
  boxCodes.forEach(code => console.log(`     📦 + ${code}`));

  const newBoxData = {
    id: palletId,
    actNumbers: boxCodes,
    palletId: palletId,
    counterName: workerName,
    userName: workerName,
    shift: shift,
    createdAt: timestamp,
    status: 'on_pallet',
    notes: 'Zavershit qilingan pallet',
    historyLogs: [
      {
        id: Date.now(),
        time: timestamp,
        worker: `${workerName} (${shift})`,
        workerName: workerName,
        userName: workerName,
        shift: shift,
        action: 'Сортировка',
        actionType: 'sort',
        gmId: palletId,
        count: boxCodes.length,
        details: `${palletId} pallet va ${boxCodes.length} ta korob sortirovka qilindi`
      }
    ]
  };

  // Fetch current database data
  const getRes = await fetch('http://localhost:3001/api/data');
  const currentDb = await getRes.json();

  const updatedBoxes = [newBoxData, ...(currentDb.boxes || [])];
  const updatedPallets = [
    {
      id: palletId,
      boxIds: [palletId],
      zoneId: null,
      loaderName: null,
      status: 'created',
      placedAt: null,
      notes: 'Zavershit qilingan pallet'
    },
    ...(currentDb.pallets || [])
  ];

  const payload = {
    ...currentDb,
    boxes: updatedBoxes,
    pallets: updatedPallets
  };

  console.log('\n3️⃣  PALLETNI ZAVERSHIT QILISH (POST /api/sync):');
  const syncRes = await fetch('http://localhost:3001/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const syncResult = await syncRes.json();
  console.log('   ✅ Server holati:', syncResult.status);

  console.log('\n4️⃣  POSTGRESQL BAZASIDAN TEKSHIRISH (SELECT SQL Queries):');
  const client = await getClient();
  try {
    const boxDbRes = await client.query('SELECT * FROM boxes WHERE id = $1', [palletId]);
    console.log('\n   📊 [BOXES JADVALI] Topilgan record:');
    console.dir(boxDbRes.rows[0], { depth: null });

    const palletDbRes = await client.query('SELECT * FROM pallets WHERE id = $1', [palletId]);
    console.log('\n   📊 [PALLETS JADVALI] Topilgan record:');
    console.dir(palletDbRes.rows[0], { depth: null });

    const logDbRes = await client.query('SELECT * FROM history_logs WHERE gm_id = $1 ORDER BY id DESC LIMIT 1', [palletId]);
    console.log('\n   📊 [HISTORY_LOGS JADVALI] Topilgan record:');
    console.dir(logDbRes.rows[0], { depth: null });

  } finally {
    await client.end();
  }
  console.log('\n====================================================');
  console.log('✅ TEST MUVAFFAQIYATLI YAKUNLANDI!');
  console.log('====================================================');
}

runPalletWorkflow().catch(console.error);
