// Initial Mock Database for Warehouse Management System with Timestamp Logs

export const DEFAULT_ZONES = [
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

export const DEFAULT_BOXES = [
  {
    id: '84-000056560',
    actNumbers: ['32879', '3848', '4848', '484959', '48548', '134231'],
    palletId: '84-000056560',
    counterName: 'Alisher Qodirov (1-смена)',
    userName: 'Alisher',
    shift: '1 смена',
    createdAt: '2026-07-29 17:50:12',
    status: 'on_pallet',
    historyLogs: [
      {
        id: 101,
        time: '2026-07-29 17:50:12',
        worker: 'Alisher Qodirov (1-смена)',
        userName: 'Alisher',
        shift: '1 смена',
        action: 'Сортировка',
        actionType: 'sort',
        gmId: '84-000056560',
        count: 6,
        details: '84-000056560 паллети ва 6 та короб сортировкаланди'
      },
      {
        id: 102,
        time: '2026-07-29 17:54:45',
        worker: 'Sobirjon Karimov (Yuklovchi)',
        userName: 'Sobirjon',
        shift: '1 смена',
        action: 'Парковка',
        actionType: 'park',
        gmId: '84-000056560',
        zoneId: 'ZONE-B4',
        details: '84-000056560 паллети ZONE-B4 (Sektor B - Parkovka 4) зонасига жойлаштирилди'
      }
    ],
    notes: 'Kiyim-kechaklar va tovarlar'
  },
  {
    id: '84-000056561',
    actNumbers: ['99210', '99211', '99212'],
    palletId: '84-000056561',
    counterName: 'Mohinur Saidova (1-смена)',
    userName: 'Mohinur',
    shift: '1 смена',
    createdAt: '2026-07-29 17:52:05',
    status: 'on_pallet',
    historyLogs: [
      {
        id: 103,
        time: '2026-07-29 17:52:05',
        worker: 'Mohinur Saidova (1-смена)',
        userName: 'Mohinur',
        shift: '1 смена',
        action: 'Сортировка',
        actionType: 'sort',
        gmId: '84-000056561',
        count: 3,
        details: '84-000056561 паллети ва 3 та короб сортировкаланди'
      }
    ],
    notes: 'Aksessuarlar'
  }
];

export const DEFAULT_PALLETS = [
  {
    id: '84-000056560',
    boxIds: ['84-000056560'],
    zoneId: 'ZONE-B4',
    loaderName: 'Sobirjon Karimov',
    status: 'parked',
    placedAt: '2026-07-29 17:54:45',
    notes: 'B4 parkovkasiga qo\'yilgan'
  },
  {
    id: '84-000056561',
    boxIds: ['84-000056561'],
    zoneId: null,
    loaderName: null,
    status: 'created',
    placedAt: null,
    notes: 'Kutilmoqda'
  }
];

export const STORAGE_KEYS = {
  BOXES: 'wms_terminal_boxes',
  PALLETS: 'wms_terminal_pallets',
  ZONES: 'wms_terminal_zones'
};

export function loadStoredData() {
  try {
    const boxes = localStorage.getItem(STORAGE_KEYS.BOXES);
    const pallets = localStorage.getItem(STORAGE_KEYS.PALLETS);
    const zones = localStorage.getItem(STORAGE_KEYS.ZONES);

    return {
      boxes: boxes ? JSON.parse(boxes) : DEFAULT_BOXES,
      pallets: pallets ? JSON.parse(pallets) : DEFAULT_PALLETS,
      zones: zones ? JSON.parse(zones) : DEFAULT_ZONES
    };
  } catch (error) {
    console.error('Error loading localStorage WMS data:', error);
    return {
      boxes: DEFAULT_BOXES,
      pallets: DEFAULT_PALLETS,
      zones: DEFAULT_ZONES
    };
  }
}

export function saveDataToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(data.boxes));
    localStorage.setItem(STORAGE_KEYS.PALLETS, JSON.stringify(data.pallets));
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(data.zones));
  } catch (error) {
    console.error('Error saving WMS data to localStorage:', error);
  }
}

export function resetToDefaults() {
  try {
    localStorage.removeItem(STORAGE_KEYS.BOXES);
    localStorage.removeItem(STORAGE_KEYS.PALLETS);
    localStorage.removeItem(STORAGE_KEYS.ZONES);
  } catch (e) {
    console.error(e);
  }
}
