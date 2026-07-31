import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Tag, Package, MapPin, Send, Sparkles } from 'lucide-react';

export default function AnalitikModule({ boxes, pallets, zones, onDispatchPlacement, showToast }) {
  const [searchQuery, setSearchQuery] = useState('484959');

  // Multi-level trace: Act # -> Box ID -> Pallet ID -> Zone Location
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results = [];

    boxes.forEach((box) => {
      const matchingActs = box.actNumbers.filter((act) =>
        act.toLowerCase().includes(query)
      );
      const isBoxMatch = box.id.toLowerCase().includes(query);

      if (matchingActs.length > 0 || isBoxMatch) {
        const pallet = pallets.find((p) => p.id === box.palletId) || null;
        const zone =
          pallet && pallet.zoneId
            ? zones.find((z) => z.id === pallet.zoneId)
            : null;

        results.push({
          matchedAct: matchingActs.join(', ') || query,
          box,
          pallet,
          zone
        });
      }
    });

    return results;
  }, [searchQuery, boxes, pallets, zones]);

  const targetZoneId = searchResults.length > 0 && searchResults[0].zone ? searchResults[0].zone.id : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="glass-card p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            3-BOSQICH: ANALITIK QIDIRUVI (REAL-VAQT LOKATSIYASI)
          </h2>
          <p className="text-xs text-gray-400">
            Akt raqamini yozing. Kameraga qaramasdan padon qayerdaligini 1 soniyada ko'ring!
          </p>
        </div>

        <button
          onClick={() => setSearchQuery('484959')}
          className="btn btn-secondary btn-sm text-xs"
        >
          ⚡ Akt #484959 ni izlash
        </button>
      </div>

      {/* Main Search Bar */}
      <div className="glass-card p-6 space-y-4">
        <label className="input-label font-bold text-gray-200 text-base">
          Akt Raqamini Kiriting:
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Masalan: 484959 yoki 32879"
            className="input-field text-xl font-mono font-bold text-purple-300 py-3.5 pl-12 border-purple-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-6 h-6 text-purple-400 absolute left-4 top-4" />
        </div>
      </div>

      {/* Search Result Trace Card */}
      {searchQuery.trim() !== '' && (
        <div className="glass-card p-6 space-y-4 border-2 border-purple-500/40">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            QIDIRUV NATIJASI VA REAL-VAQT LOKATSIYASI
          </h3>

          {searchResults.length === 0 ? (
            <div className="p-6 text-center text-gray-400 font-medium">
              "<b>{searchQuery}</b>" raqamli akt topilmadi.
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((res, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-purple-950/40 border border-purple-500/40 space-y-5"
                >
                  {/* Step-by-Step Flow Path */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    
                    {/* Step 1: Act */}
                    <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/30">
                      <span className="text-[11px] text-blue-400 font-bold block mb-1">1. AKT</span>
                      <span className="font-mono font-bold text-blue-200 text-sm">#{res.matchedAct}</span>
                    </div>

                    {/* Step 2: Box */}
                    <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30">
                      <span className="text-[11px] text-indigo-400 font-bold block mb-1">2. KOROBKA</span>
                      <span className="font-mono font-bold text-indigo-200 text-sm">{res.box ? res.box.id : '-'}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">({res.box?.actNumbers?.length} ta akt bor)</span>
                    </div>

                    {/* Step 3: Pallet */}
                    <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30">
                      <span className="text-[11px] text-amber-400 font-bold block mb-1">3. PADDON</span>
                      <span className="font-mono font-bold text-amber-200 text-sm">{res.pallet ? res.pallet.id : '-'}</span>
                    </div>

                    {/* Step 4: Zone Location */}
                    <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 animate-pulse">
                      <span className="text-[11px] text-emerald-400 font-bold block mb-1">4. HOZIRGI JOYI</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {res.zone ? res.zone.name : 'Parkovka kutilmoqda'}
                      </span>
                    </div>

                  </div>

                  {/* Action Button */}
                  {res.pallet && (
                    <div className="flex justify-end border-t border-gray-800 pt-3">
                      <button
                        onClick={() => {
                          onDispatchPlacement(res.pallet.id);
                          showToast(`🪵 ${res.pallet.id} paddoni Razmeshcheniyaga yuborildi!`, 'success');
                        }}
                        className="btn btn-purple btn-md w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" />
                        <span>Razmeshcheniyaga Yuborish ➡️</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visual 2D Map */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2 flex items-center justify-between">
          <span>Ombor Zonalari Xaritasi</span>
          <span className="text-xs text-gray-400">Yashil yonib-o'chayotgan zona — qidirilgan paddon turgan joy!</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {zones.map((zone) => {
            const isTarget = targetZoneId === zone.id;
            const palletsInZone = pallets.filter((p) => p.zoneId === zone.id);

            return (
              <div
                key={zone.id}
                className={`p-3 rounded-xl border text-center transition ${
                  isTarget
                    ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse'
                    : palletsInZone.length > 0
                    ? 'bg-gray-900 border-blue-500/30'
                    : 'bg-gray-950 border-gray-800 opacity-60'
                }`}
              >
                <div className="font-mono font-bold text-xs text-gray-200">{zone.id}</div>
                <div className="text-[11px] text-gray-400 truncate mt-0.5">{zone.name}</div>
                <div className="text-[11px] text-amber-400 font-bold mt-1">
                  🪵 {palletsInZone.length} paddon
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
