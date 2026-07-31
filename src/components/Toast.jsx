import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 animate-bounceIn">
      <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-xl border flex items-start justify-between gap-3 ${
        isSuccess
          ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/50 shadow-emerald-900/40'
          : 'bg-rose-950/90 text-rose-100 border-rose-500/50 shadow-rose-900/40'
      }`}>
        <div className="flex items-start gap-2.5">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-0.5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
