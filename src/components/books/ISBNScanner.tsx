'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function ISBNScanner({ onDetected, onClose }: Props) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerId = 'isbn-scanner-container';

  useEffect(() => {
    let scanner: any;

    const startScanner = async () => {
      try {
        setScanning(true);
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            // ISBN barcodes are EAN-13 (starts with 978 or 979) or EAN-10
            const clean = decodedText.replace(/\D/g, '');
            if (clean.length === 13 && (clean.startsWith('978') || clean.startsWith('979'))) {
              scanner.stop().then(() => onDetected(clean)).catch(() => onDetected(clean));
            } else if (clean.length === 10) {
              scanner.stop().then(() => onDetected(clean)).catch(() => onDetected(clean));
            }
          },
          () => {} // ignore frequent scan errors
        );
      } catch (err) {
        setError('Camera access denied or not available. Please allow camera permissions and try again.');
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <span className="font-semibold">Scan ISBN Barcode</span>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-white/60 text-sm text-center mb-4">
          Point your camera at the barcode on the back of a book
        </p>

        {/* Scanner container */}
        <div className="bg-black rounded-2xl overflow-hidden relative">
          <div id={containerId} className="w-full" style={{ minHeight: '250px' }} />

          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Scan frame overlay */}
              <div className="border-2 border-brand-400 rounded-lg w-64 h-36 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-400 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-400 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-400 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-400 rounded-br-sm" />
                {/* Scan line animation */}
                <div className="absolute inset-x-2 h-0.5 bg-brand-400/80 animate-bounce" style={{ top: '50%' }} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-xl text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        <p className="text-white/40 text-xs text-center mt-4">
          Works with ISBN-10 and ISBN-13 barcodes (EAN)
        </p>
      </div>
    </div>
  );
}
