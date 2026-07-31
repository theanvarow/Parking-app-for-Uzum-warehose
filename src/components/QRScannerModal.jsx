import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose, onScanResult, pallets, zones }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'demo'
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const html5QrCode = new Html5Qrcode('qr-reader-region');
      html5QrcodeRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScanResult(decodedText);
          handleClose();
        },
        (errorMessage) => {
          // ignore scan errors until success
        }
      ).catch((err) => {
        console.warn('Camera error:', err);
        setCameraError('Kameraga ulanish imkoni bo\'lmadi. Brauzer ruxsatini tekshiring yoki Demodan foydalaning.');
      });

      return () => {
        if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(e => console.error(e));
        }
      };
    }
  }, [isOpen, activeTab]);

  const handleClose = () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().then(() => onClose()).catch(() => onClose());
    } else {
      onClose();
    }
  };

  const handleSimulateScan = (code) => {
    onScanResult(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md p-5 space-y-4 relative border-purple-500/40">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">QR / Shtrix Skaner</h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Camera vs Demo */}
        <div className="flex rounded-lg bg-gray-900 p-1 border border-gray-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera (Real)</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 transition ${
              activeTab === 'demo' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Test Skaner</span>
          </button>
        </div>

        {/* Camera View */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div
              id="qr-reader-region"
              className="w-full min-h-[260px] rounded-xl overflow-hidden bg-black border border-gray-800"
            ></div>

            {cameraError && (
              <p className="text-xs text-amber-400 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 text-center">
                {cameraError}
              </p>
            )}
            <p className="text-xs text-gray-400 text-center">
              Paddon yoki Zona QR kodi ustiga kamerani tuting
            </p>
          </div>
        )}

        {/* Demo Test Scan View */}
        {activeTab === 'demo' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-300 block mb-2">
                🪵 Paddon QR Kodlari (Skanerlashni simulyatsiya qiling):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {pallets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSimulateScan(p.id)}
                    className="p-2.5 rounded-xl bg-gray-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-mono font-bold text-xs flex items-center justify-between transition"
                  >
                    <span>🪵 {p.id}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-300 block mb-2">
                📍 Ombor Zonasi QR Kodlari (Skanerlashni simulyatsiya qiling):
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {zones.map(z => (
                  <button
                    key={z.id}
                    onClick={() => handleSimulateScan(z.id)}
                    className="p-2 rounded-lg bg-gray-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-mono text-xs text-left truncate transition"
                  >
                    📍 {z.id} ({z.name})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
