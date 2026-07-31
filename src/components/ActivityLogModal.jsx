import React from 'react';
import { X, Activity, Clock, User, FileText } from 'lucide-react';

export default function ActivityLogModal({ isOpen, onClose, logs }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-xl p-5 space-y-4 relative border-blue-500/30 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Ombor Harakatlari Tarixi (Audit Log)</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {logs.map((log, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-gray-400 font-mono">
                <span className="flex items-center gap-1 text-blue-400">
                  <User className="w-3.5 h-3.5" /> {log.user}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3.5 h-3.5" /> {log.time}
                </span>
              </div>
              <p className="text-gray-200 font-medium">{log.action}</p>
            </div>
          ))}

          {logs.length === 0 && (
            <p className="text-gray-500 text-center py-6 text-sm">Hali hech qanday harakatlar bajarilmadi.</p>
          )}
        </div>

      </div>
    </div>
  );
}
