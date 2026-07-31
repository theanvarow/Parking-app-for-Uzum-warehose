import React, { useState, useMemo } from 'react';
import { Search, QrCode, Plus, CheckCircle2, MapPin, Package, Truck, Sparkles, Send, Tag, Layers, RefreshCw } from 'lucide-react';
import QRScannerModal from './QRScannerModal';

export default function SingleScreenApp({ dbData, onAddBox, onUpdatePalletZone, onDispatchPlacement, onResetData, showToast }) {
  // State for search
  const [searchQuery, setSearchQuery] = useState('484959');

  // State for quick action mode ('sanash' | 'parkovka')
  const [actionMode, setActionMode] = useState('sanash');

  // Form states for Sanash
  const [boxId, setBoxId] = useState('');
  const [actsInput, setActsInput] = useState('');
  const [palletId, setPalletId] = useState('');

  // Form states for Parkovka
  const [selectedPalletId, setSelectedPalletId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // QR Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Search logic: Akt # -> Korobka -> Paddon -> Zona
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results = [];

    dbData.boxes.forEach((box) => {
      const matchingActs = box.actNumbers.filter((act) =>
        act.toLowerCase().includes(query)
      );
      const isBoxMatch = box.id.toLowerCase().includes(query);

      if (matchingActs.length > 0 || isBoxMatch) {
        const pallet = dbData.pallets.find((p) => p.id === box.palletId) || null;
        const zone =
          pallet && pallet.zoneId
            ? dbData.zones.find((z) => z.id === pallet.zoneId)
            : null;

        results.push({
          matchedAct: matchingActs.join(', ') || query,
          box,
          pallet,
          zone
        });
      }
    });

    // Check pallet ID match
    dbData.pallets.forEach((pallet) => {
      if (pallet.id.toLowerCase().includes(query)) {
        if (!results.some((r) => r.pallet && r.pallet.id === pallet.id)) {
          const assignedBoxes = dbData.boxes.filter((b) => b.palletId === pallet.id);
          const zone = pallet.zoneId
            ? dbData.zones.find((z) => z.id === pallet.zoneId)
            : null;
          results.push({
            matchedAct: null,
            box: assignedBoxes[0] || null,
            pallet,
            zone
          });
        }
      }
    });

    return results;
  }, [searchQuery, dbData]);

  // Submit Sanash form
  const handleSanashSubmit = (e) => {
    e.preventDefault();

    if (!boxId.trim()) {
      showToast('Korobka raqamini kiriting!', 'error');
      return;
    }
    if (!actsInput.trim()) {
      showToast('Akt raqamlarini kiriting!', 'error');
      return;
    }
    if (!palletId.trim()) {
      showToast('Paddon raqamini kiriting!', 'error');
      return;
    }

    const actList = actsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddBox({
      id: boxId.trim(),
      actNumbers: actList,
      palletId: palletId.trim(),
      counterName: 'Sanash xodimi',
      notes: ''
    });

    showToast(`Korobka ${boxId} muvaffaqiyatli saqlandi!`, 'success');

    setBoxId('');
    setActsInput('');
    setPalletId('');
  };

  // Submit Parkovka form
  const handleParkovkaSubmit = (e) => {
    e.preventDefault();

    if (!selectedPalletId) {
      showToast('Paddon raqamini tanlang!', 'error');
      return;
    }
    if (!selectedZoneId) {
      showToast('Zonani tanlang!', 'error');
      return;
    }

    onUpdatePalletZone({
      palletId: selectedPalletId,
      zoneId: selectedZoneId,
      loaderName: 'Yuklovchi',
      notes: ''
    });

    const zoneObj = dbData.zones.find((z) => z.id === selectedZoneId);
    showToast(`🪵 ${selectedPalletId} paddoni ${zoneObj ? zoneObj.name : selectedZoneId} ga joylandi!`, 'success');

    setSelectedPalletId('');
    setSelectedZoneId('');
  };

  // Quick preset demo loader
  const handleLoadDemo = () => {
    setSearchQuery('484959');
    setBoxId('80-00056560');
    setActsInput('32879, 3848, 4848, 484959, 48548');
    setPalletId('PDN-102');
  };

  // Callback from QR Scanner
  const handleScanResult = (scannedCode) => {
    // If it looks like search, put in search
    setSearchQuery(scannedCode);
    showToast(`QR Skanerlandi: "${scannedCode}"`, 'success');
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-10">
      
      {/* 1. Header Bar */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            📦
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Ombor Paddon Skaner</h1>
            <p className="text-[11px] text-gray-400">1-Ekranli Tezkor Boshqaruv</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1 text-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Skaner</span>
          </button>
          
          <button
            onClick={handleLoadDemo}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold border border-gray-700"
            title="Demo ma'lumot (484959)"
          >
            ⚡ Demo
          </button>
        </div>
      </div>

      {/* 2. INSTANT SEARCH BAR & TRACE RESULT */}
      <div className="glass-card p-4 space-y-3 border-2 border-purple-500/40">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-4 h-4 text-purple-400" />
            TEZKOR AKT QIDIRUVI (REAL-VAQT LOKATSIYASI)
          </label>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[11px] text-gray-400 hover:text-white">
              Tozalash
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Akt raqamini kiriting (masalan: 484959)"
            className="input-field text-lg font-mono font-bold text-purple-300 py-3 pl-10 border-purple-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
        </div>

        {/* Trace Result Box */}
        {searchQuery.trim() !== '' && (
          <div className="pt-2 space-y-3 border-t border-gray-800">
            {searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">
                "<b>{searchQuery}</b>" raqamli akt topilmadi.
              </div>
            ) : (
              searchResults.map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-gray-900/90 border border-purple-500/40 space-y-3">
                  {/* Visual Trace Flow */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
                    <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30">
                      <span className="text-[10px] text-blue-400 block font-sans">1. AKT</span>
                      <span className="text-blue-200">#{res.matchedAct}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30">
                      <span className="text-[10px] text-indigo-400 block font-sans">2. KOROBKA</span>
                      <span className="text-indigo-200">{res.box ? res.box.id : '-'}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 block font-sans">3. PADDON</span>
                      <span className="text-amber-200">{res.pallet ? res.pallet.id : '-'}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-950/80 border-2 border-emerald-400 animate-pulse col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-emerald-400 block font-sans">4. HOZIRGI JOYI</span>
                      <span className="text-white font-sans text-xs">
                        {res.zone ? res.zone.name : 'Joylanmagan'}
                      </span>
                    </div>
                  </div>

                  {/* Dispatch action button */}
                  {res.pallet && (
                    <button
                      onClick={() => {
                        onDispatchPlacement(res.pallet.id);
                        showToast(`🪵 ${res.pallet.id} paddoni Razmeshcheniyaga yuborildi!`, 'success');
                      }}
                      className="btn btn-purple btn-sm w-full font-bold text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Razmeshcheniyaga Yuborish ➡️</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. ACTION MODE SWITCHER (SANASH VS PARKOVKA) */}
      <div className="glass-card p-4 space-y-4">
        {/* Toggle switch tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-900 border border-gray-800">
          <button
            onClick={() => setActionMode('sanash')}
            className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              actionMode === 'sanash'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Sanash (Korobka)</span>
          </button>

          <button
            onClick={() => setActionMode('parkovka')}
            className={`py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              actionMode === 'parkovka'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. Yuklovchi (Parkovka)</span>
          </button>
        </div>

        {/* SANASH FORM */}
        {actionMode === 'sanash' && (
          <form onSubmit={handleSanashSubmit} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Korobka Raqami *</label>
              <input
                type="text"
                placeholder="Masalan: 80-00056560"
                className="input-field text-sm font-mono font-bold text-blue-400 py-2"
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Akt Raqamlari (Vergul bilan ajratib yozing) *
              </label>
              <input
                type="text"
                placeholder="Masalan: 32879, 3848, 484959"
                className="input-field text-xs font-mono py-2"
                value={actsInput}
                onChange={(e) => setActsInput(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Paddon Raqami *</label>
              <input
                type="text"
                placeholder="Masalan: PDN-102"
                className="input-field text-sm font-mono font-bold text-amber-400 py-2"
                value={palletId}
                onChange={(e) => setPalletId(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-md w-full font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>KOROBKANISAQLASH</span>
            </button>
          </form>
        )}

        {/* PARKOVKA FORM */}
        {actionMode === 'parkovka' && (
          <form onSubmit={handleParkovkaSubmit} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Qaysi Paddonni Olib Bordingiz? *</label>
              <select
                className="input-field text-sm font-mono font-bold text-amber-400 py-2"
                value={selectedPalletId}
                onChange={(e) => setSelectedPalletId(e.target.value)}
              >
                <option value="">-- Paddonni tanlang --</option>
                {dbData.pallets.map((p) => (
                  <option key={p.id} value={p.id}>
                    🪵 {p.id} {p.zoneId ? `(Joriy: ${p.zoneId})` : '(Joylanmagan)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Qaysi Zonaga Qo'ydingiz? *</label>
              <select
                className="input-field text-sm font-semibold text-emerald-400 py-2"
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
              >
                <option value="">-- Zonani tanlang --</option>
                {dbData.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    📍 {z.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-emerald btn-md w-full font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>ZONAGA JOYLASHTIRDIM</span>
            </button>
          </form>
        )}
      </div>

      {/* 4. LIVE LOGS & RECENT PALLETS LIST */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-800 pb-2 flex items-center justify-between">
          <span>🪵 OMBORDAGI PADDONLAR VA LOKATSIYALAR</span>
          <span className="text-[10px] text-gray-400">{dbData.pallets.length} ta paddon</span>
        </h3>

        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {dbData.pallets.map((p) => {
            const assignedBoxes = dbData.boxes.filter((b) => b.palletId === p.id);
            return (
              <div key={p.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">🪵 {p.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${p.zoneId ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                    {p.zoneId ? `📍 ${p.zoneId}` : '⏳ Joylanmagan'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Korobkalar ({assignedBoxes.length}):{' '}
                  <span className="font-mono text-gray-200">
                    {assignedBoxes.map((b) => b.id).join(', ') || 'Yo\'q'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
        pallets={dbData.pallets}
        zones={dbData.zones}
      />
    </div>
  );
}
