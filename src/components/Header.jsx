import React from 'react';
import { Package, Truck, Search, QrCode } from 'lucide-react';

export default function Header({ activeRole, setActiveRole, onOpenScanner }) {
  return (
    <header className="glass-card mb-6 p-4">
      {/* App Header Title */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            📦
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Ombor Paddon Tizimi</h1>
            <p className="text-xs text-gray-400">Paddonlar va Aktlarni real-vaqt rejimida kuzatish</p>
          </div>
        </div>

        <button
          onClick={onOpenScanner}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Skaner</span>
        </button>
      </div>

      {/* 3 Clear Step Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveRole('sanash')}
          className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 border transition ${
            activeRole === 'sanash'
              ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>1. Sanash</span>
        </button>

        <button
          onClick={() => setActiveRole('yuklovchi')}
          className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 border transition ${
            activeRole === 'yuklovchi'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>2. Yuklovchi</span>
        </button>

        <button
          onClick={() => setActiveRole('analitik')}
          className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 border transition ${
            activeRole === 'analitik'
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>3. Analitik Qidiruvi</span>
        </button>
      </div>
    </header>
  );
}
