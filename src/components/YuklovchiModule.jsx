import React, { useState } from 'react';
import { Truck, MapPin, CheckCircle2, QrCode } from 'lucide-react';

export default function YuklovchiModule({ pallets, zones, onUpdatePalletZone, onOpenScanner, showToast }) {
  const [selectedPalletId, setSelectedPalletId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  const handlePark = (e) => {
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

    const zoneObj = zones.find(z => z.id === selectedZoneId);
    showToast(`🪵 ${selectedPalletId} paddoni ${zoneObj ? zoneObj.name : selectedZoneId} ga joylashtirildi!`, 'success');

    setSelectedPalletId('');
    setSelectedZoneId('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div className="glass-card p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            2-BOSQICH: YUKLOVCHI (PARKOVKA)
          </h2>
          <p className="text-xs text-gray-400">
            Paddonni ombor zonasiga olib borib qo'yganingizda, Paddon va Zonani belgilang.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="btn btn-emerald btn-sm flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Skaner</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handlePark} className="glass-card p-6 space-y-4">
        <div>
          <label className="input-label font-bold text-gray-200">1. Qaysi Paddonni Olib Bordingiz? *</label>
          <select
            className="input-field text-base font-mono font-bold text-amber-400"
            value={selectedPalletId}
            onChange={(e) => setSelectedPalletId(e.target.value)}
          >
            <option value="">-- Paddon raqamini tanlang --</option>
            {pallets.map((p) => (
              <option key={p.id} value={p.id}>
                🪵 {p.id} {p.zoneId ? `(Joriy joyi: ${p.zoneId})` : '(Hali joylanmagan ⏳)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label font-bold text-gray-200">2. Paddonni Qaysi Zonaga Qo'ydingiz? *</label>
          <select
            className="input-field text-base font-semibold text-emerald-400"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
          >
            <option value="">-- Zonani tanlang --</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                📍 {z.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-emerald btn-lg w-full mt-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>ZONAGA JOYLASHTIRDIM (SAQLASH)</span>
        </button>
      </form>

      {/* Parked Pallets List */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
          Ombor Zonasida Turgan Paddonlar
        </h3>

        <div className="space-y-2">
          {pallets.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
              <span className="font-mono font-bold text-amber-400 text-sm">🪵 Paddon: {p.id}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${p.zoneId ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                {p.zoneId ? `📍 ${p.zoneId}` : '⏳ Joylanmagan'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
