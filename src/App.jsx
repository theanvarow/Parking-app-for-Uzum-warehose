import React, { useState, useEffect, useRef } from 'react';
import WarehouseTerminalApp from './components/WarehouseTerminalApp';
import Toast from './components/Toast';
import { loadStoredData, saveDataToStorage, resetToDefaults } from './data/mockData';

// Helper for exact timestamp formatted YYYY-MM-DD HH:mm:ss
const getFormattedNow = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
};

export default function App() {
  const [dbData, setDbData] = useState(loadStoredData);
  const [toast, setToast] = useState(null);
  const isInitialMount = useRef(true);

  // Helper for resilient API fetching across dev, local, and production
  const getApiUrl = (endpoint) => {
    return endpoint;
  };

  // REAL-TIME SERVER MULTI-USER SYNCHRONIZATION POLLING WITH SMART NON-DESTRUCTIVE MERGE
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        let res = await fetch('/api/data');
        if (!res.ok) {
          res = await fetch('http://localhost:3001/api/data');
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.boxes && data.pallets) {
            setDbData(prev => {
              const mergedBoxMap = new Map();
              (prev.boxes || []).forEach(b => mergedBoxMap.set(b.id, b));
              (data.boxes || []).forEach(b => mergedBoxMap.set(b.id, b));

              const mergedPalletMap = new Map();
              (prev.pallets || []).forEach(p => mergedPalletMap.set(p.id, p));
              (data.pallets || []).forEach(p => mergedPalletMap.set(p.id, p));

              const mergedData = {
                boxes: Array.from(mergedBoxMap.values()),
                pallets: Array.from(mergedPalletMap.values()),
                zones: data.zones && data.zones.length > 0 ? data.zones : (prev.zones || [])
              };
              saveDataToStorage(mergedData);
              return mergedData;
            });
          }
        }
      } catch (err) {
        try {
          const resLocal = await fetch('http://localhost:3001/api/data');
          if (resLocal.ok) {
            const data = await resLocal.json();
            if (data && data.boxes && data.pallets) {
              setDbData(prev => {
                const mergedBoxMap = new Map();
                (prev.boxes || []).forEach(b => mergedBoxMap.set(b.id, b));
                (data.boxes || []).forEach(b => mergedBoxMap.set(b.id, b));

                const mergedPalletMap = new Map();
                (prev.pallets || []).forEach(p => mergedPalletMap.set(p.id, p));
                (data.pallets || []).forEach(p => mergedPalletMap.set(p.id, p));

                const mergedData = {
                  boxes: Array.from(mergedBoxMap.values()),
                  pallets: Array.from(mergedPalletMap.values()),
                  zones: data.zones && data.zones.length > 0 ? data.zones : (prev.zones || [])
                };
                saveDataToStorage(mergedData);
                return mergedData;
              });
            }
          }
        } catch (e) {}
      }
    };

    fetchServerData();
    const interval = setInterval(fetchServerData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Broadcast state updates to server API with clear Toast feedback
  const syncWithServer = async (updatedData) => {
    let success = false;
    try {
      let res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        success = true;
      } else {
        let res2 = await fetch('http://localhost:3001/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (res2.ok) success = true;
      }
    } catch (e) {
      try {
        let res3 = await fetch('http://localhost:3001/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (res3.ok) success = true;
      } catch (err) {}
    }

    if (success) {
      showToast('☁️ Neon SQL bazasiga saqlandi!', 'success');
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      saveDataToStorage(dbData);
    }
  }, [dbData]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleAddBox = (newBoxData) => {
    const timestamp = getFormattedNow();
    const cleanWorkerName = newBoxData.counterName ? newBoxData.counterName.replace(/\s*\([^)]*\)/, '') : "Xodim";
    
    const historyLogItem = {
      id: Date.now(),
      time: timestamp,
      worker: newBoxData.counterName || "Xodim (1-smena)",
      workerName: cleanWorkerName,
      userName: cleanWorkerName,
      shift: newBoxData.shift || '1 смена',
      action: 'Сортировка',
      actionType: 'sort',
      gmId: newBoxData.id,
      count: newBoxData.actNumbers.length,
      details: `${newBoxData.id} pallet va ${newBoxData.actNumbers.length} ta korob sortirovka qilindi`
    };

    const boxWithLogs = {
      ...newBoxData,
      counterName: cleanWorkerName,
      createdAt: timestamp,
      historyLogs: [historyLogItem]
    };

    const updatedBoxes = [boxWithLogs, ...dbData.boxes];

    let updatedPallets = [...dbData.pallets];
    const existingPalletIndex = updatedPallets.findIndex((p) => p.id === newBoxData.palletId || p.id === newBoxData.id);

    if (existingPalletIndex >= 0) {
      updatedPallets[existingPalletIndex] = {
        ...updatedPallets[existingPalletIndex],
        boxIds: [newBoxData.id],
        status: 'created',
        photoUrl: newBoxData.photoUrl || updatedPallets[existingPalletIndex].photoUrl || null
      };
    } else {
      updatedPallets.unshift({
        id: newBoxData.palletId || newBoxData.id,
        boxIds: [newBoxData.id],
        zoneId: null,
        loaderName: null,
        status: 'created',
        placedAt: null,
        notes: '',
        photoUrl: newBoxData.photoUrl || null
      });
    }

    const nextData = {
      ...dbData,
      boxes: updatedBoxes,
      pallets: updatedPallets
    };

    setDbData(nextData);
    syncWithServer(nextData);
  };

  const handleUpdatePalletZone = ({ palletId, zoneId, loaderName, notes }) => {
    const timestamp = getFormattedNow();
    const cleanLoaderName = loaderName ? loaderName.replace(/\s*\([^)]*\)/, '') : "Xodim";

    const parkHistoryLog = {
      id: Date.now(),
      time: timestamp,
      worker: loaderName || "Xodim (Yuklovchi)",
      workerName: cleanLoaderName,
      userName: cleanLoaderName,
      shift: '1 смена',
      action: 'Парковка',
      actionType: 'park',
      gmId: palletId,
      zoneId: zoneId,
      details: `${palletId} pallet ${zoneId} zonasiga joylashtirildi`
    };

    let boxFound = false;
    const updatedBoxes = dbData.boxes.map((b) => {
      if (b.id === palletId || b.palletId === palletId) {
        boxFound = true;
        const prevLogs = b.historyLogs || [];
        return {
          ...b,
          historyLogs: [...prevLogs, parkHistoryLog]
        };
      }
      return b;
    });

    if (!boxFound) {
      updatedBoxes.unshift({
        id: palletId,
        actNumbers: [],
        palletId: palletId,
        counterName: cleanLoaderName,
        userName: cleanLoaderName,
        shift: '1 смена',
        createdAt: timestamp,
        status: 'on_pallet',
        notes: 'Parkovka qilingan pallet',
        historyLogs: [parkHistoryLog]
      });
    }

    let palletFound = false;
    const updatedPallets = dbData.pallets.map((p) => {
      if (p.id === palletId) {
        palletFound = true;
        return {
          ...p,
          zoneId,
          loaderName: cleanLoaderName,
          status: 'parked',
          placedAt: timestamp,
          notes: notes || p.notes
        };
      }
      return p;
    });

    if (!palletFound) {
      updatedPallets.unshift({
        id: palletId,
        boxIds: [palletId],
        zoneId,
        loaderName: cleanLoaderName,
        status: 'parked',
        placedAt: timestamp,
        notes: notes || ''
      });
    }

    const nextData = {
      ...dbData,
      boxes: updatedBoxes,
      pallets: updatedPallets
    };

    setDbData(nextData);
    syncWithServer(nextData);
  };

  const handleDispatchPlacement = (boxId) => {
    const nextData = {
      ...dbData,
      boxes: dbData.boxes.filter((b) => b.id !== boxId)
    };
    setDbData(nextData);
    syncWithServer(nextData);
  };

  const handleResetData = async () => {
    resetToDefaults();
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDbData(data.data);
      } else {
        setDbData(loadStoredData());
      }
    } catch (e) {
      setDbData(loadStoredData());
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      <WarehouseTerminalApp
        dbData={dbData}
        onAddBox={handleAddBox}
        onUpdatePalletZone={handleUpdatePalletZone}
        onDispatchPlacement={handleDispatchPlacement}
        onResetData={handleResetData}
        showToast={showToast}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
