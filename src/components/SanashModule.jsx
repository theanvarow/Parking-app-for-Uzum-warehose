import React, { useState } from 'react';
import { Package, Plus, CheckCircle2 } from 'lucide-react';

export default function SanashModule({ boxes, pallets, onAddBox, showToast }) {
  const [boxId, setBoxId] = useState('');
  const [actsInput, setActsInput] = useState('');
  const [palletId, setPalletId] = useState('');

  // Quick preset loader for demonstration
  const handleLoadDemo = () => {
    setBoxId('80-00056560');
    setActsInput('32879, 3848, 4848, 484959, 48548');
    setPalletId('Paddon-1');
  };

  const handleSubmit = (e) => {
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

    const actNumbersList = actsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddBox({
      id: boxId.trim(),
      actNumbers: actNumbersList,
      palletId: palletId.trim(),
      counterName: 'Sanash xodimi',
      notes: ''
    });

    showToast(`Korobka ${boxId} muvaffaqiyatli saqlandi!`, 'success');

    setBoxId('');
    setActsInput('');
    setPalletId('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div className="glass-card p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            1-BOSQICH: SANASH HODIMI
          </h2>
          <p className="text-xs text-gray-400">
            Aktlarni sanang, Korobka va Paddon raqamini kiriting.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadDemo}
          className="btn btn-secondary btn-sm text-xs"
        >
          ⚡ Namuna to'ldirish (80-00056560)
        </button>
      </div>

      {/* Main Simple Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="input-label font-bold text-gray-200">1. Korobka Raqami *</label>
          <input
            type="text"
            placeholder="Masalan: 80-00056560"
            className="input-field font-mono text-base font-bold text-blue-400"
            value={boxId}
            onChange={(e) => setBoxId(e.target.value)}
          />
        </div>

        <div>
          <label className="input-label font-bold text-gray-200">
            2. Akt Raqamlari (Vergul bilan ajratib yozing) *
          </label>
          <input
            type="text"
            placeholder="Masalan: 32879, 3848, 4848, 484959, 48548"
            className="input-field font-mono text-sm"
            value={actsInput}
            onChange={(e) => setActsInput(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Bitta korobka ichida bir nechta akt bo'lishi mumkin.
          </p>
        </div>

        <div>
          <label className="input-label font-bold text-gray-200">3. Paddon Raqami *</label>
          <input
            type="text"
            placeholder="Masalan: Paddon-1"
            className="input-field font-mono text-base font-bold text-amber-400"
            value={palletId}
            onChange={(e) => setPalletId(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>TIZIMGA SAQLASH</span>
        </button>
      </form>

      {/* List of Created Boxes */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-bold text-white text-sm border-b border-gray-800 pb-2">
          Saqlangan Korobkalar Ro'yxati ({boxes.length})
        </h3>

        <div className="space-y-2">
          {boxes.map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-400 text-sm">📦 Korobka: {b.id}</span>
                <span className="font-mono font-bold text-amber-400 text-xs">🪵 Paddon: {b.palletId}</span>
              </div>
              <div className="text-xs text-gray-400">
                Aktlar: <span className="font-mono text-gray-200">{b.actNumbers.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
