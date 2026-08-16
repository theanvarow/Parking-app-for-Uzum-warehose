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

  // REAL-TIME SERVER MULTI-USER SYNCHRONIZATION POLLING
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data && data.boxes && data.pallets) {
            setDbData(data);
            saveDataToStorage(data);
          }
        }
      } catch (err) {
        // Fallback to local storage if offline
      }
    };

    fetchServerData();

    // Poll server every 2.5 seconds to sync data across all 10+ devices instantly
    const interval = setInterval(fetchServerData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Broadcast state updates to server API
  const syncWithServer = async (updatedData) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (e) {
      // Offline fallback
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

    const targetBox = dbData.boxes.find(b => b.id === palletId || b.palletId === palletId);
    const prevLogs = targetBox?.historyLogs || [];

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

    const updatedBoxes = dbData.boxes.map((b) => {
      if (b.id === palletId || b.palletId === palletId) {
        return {
          ...b,
          historyLogs: [...prevLogs, parkHistoryLog]
        };
      }
      return b;
    });

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
