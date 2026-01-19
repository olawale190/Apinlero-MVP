import { useState, useRef, useEffect } from 'react';
import { Camera, X, SwitchCamera, Barcode } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string, format: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);

      // Stop any existing stream
      stopCamera();

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const scanQRCode = () => {
    if (!scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use BarcodeDetector API if available (Chrome, Edge, Opera)
      // Supports QR codes AND standard barcodes (EAN, UPC, Code128, etc.)
      if ('BarcodeDetector' in window) {
        // @ts-ignore - BarcodeDetector is not in TypeScript types yet
        const barcodeDetector = new BarcodeDetector({
          formats: [
            'qr_code',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'code_93',
            'codabar',
            'itf'
          ]
        });
        barcodeDetector.detect(canvas)
          .then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              const barcode = barcodes[0];
              stopCamera();
              onScan(barcode.rawValue, barcode.format);
            } else if (scanning) {
              requestAnimationFrame(scanQRCode);
            }
          })
          .catch(() => {
            if (scanning) {
              requestAnimationFrame(scanQRCode);
            }
          });
      } else {
        // Fallback: just keep scanning frame by frame
        if (scanning) {
          requestAnimationFrame(scanQRCode);
        }
      }
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Barcode size={20} />
          Scan Product Barcode
        </h2>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-white text-center p-6">
            <div>
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Darkened corners */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Scanning window */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                {/* Clear center */}
                <div className="absolute inset-0 bg-transparent" style={{
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                }} />

                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400" />

                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-teal-400 animate-pulse"
                  style={{
                    animation: 'scan 2s ease-in-out infinite',
                    top: '50%'
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-24 left-0 right-0 text-center text-white">
              <p className="text-sm opacity-80">Position barcode or QR code within the frame</p>
              <p className="text-xs opacity-60 mt-1">Supports EAN, UPC, QR codes & more</p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={switchCamera}
            className="p-4 bg-white/20 rounded-full text-white hover:bg-white/30 transition"
            title="Switch Camera"
          >
            <SwitchCamera size={24} />
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); opacity: 0.5; }
          50% { transform: translateY(100px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
