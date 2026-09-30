import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Upload, Check, AlertCircle, Sparkles, Compass } from 'lucide-react';

interface FieldCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  gridContext?: string;
  layerContext?: string;
}

export const FieldCameraModal: React.FC<FieldCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  gridContext = 'B12',
  layerContext = 'L3'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start device camera
  const startCamera = useCallback(async () => {
    stopStream();
    setIsInitializing(true);
    setCameraError(null);

    try {
      // Check available devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera stream could not be started:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access permission denied. You can select an image file from storage below.'
          : 'Direct video device not accessible in this environment. You can upload an artifact photograph or use our trench sample photo.'
      );
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Shutter action
  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay archaeological scale bar & watermarked metadata strip
    const pad = 20;
    const barHeight = 44;
    ctx.fillStyle = 'rgba(38, 33, 27, 0.75)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    // Archaeological metadata text
    ctx.fillStyle = '#FAF7F0';
    ctx.font = '14px monospace';
    ctx.fillText(
      `KHOJSETU · SECTOR B · GRID ${gridContext} · LAYER ${layerContext} · 30 SEP 2026`,
      pad,
      canvas.height - 18
    );

    // Scale bar in bottom right
    const scaleWidth = 120;
    const scaleX = canvas.width - scaleWidth - pad;
    const scaleY = canvas.height - 24;

    ctx.strokeStyle = '#FAF7F0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleWidth, scaleY);
    ctx.moveTo(scaleX, scaleY - 6);
    ctx.lineTo(scaleX, scaleY + 6);
    ctx.moveTo(scaleX + scaleWidth, scaleY - 6);
    ctx.lineTo(scaleX + scaleWidth, scaleY + 6);
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('5 cm', scaleX + scaleWidth / 2, scaleY - 8);
    ctx.textAlign = 'left';

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImage(result);
        stopStream();
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate authentic in-situ sample photo if camera unavailable
  const handleUseTrenchSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trench sediment background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#7A5C43');
    grad.addColorStop(0.5, '#684E39');
    grad.addColorStop(1, '#533C29');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Sediment texture speckles
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(216, 206, 189, 0.25)' : 'rgba(30, 24, 18, 0.35)';
      ctx.beginPath();
      ctx.arc(Math.random() * 800, Math.random() * 600, Math.random() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Excavated terracotta artifact in-situ
    ctx.save();
    ctx.translate(400, 300);
    ctx.rotate(-0.15);

    // Drop shadow in sediment
    ctx.fillStyle = 'rgba(20, 15, 10, 0.6)';
    ctx.beginPath();
    ctx.ellipse(8, 12, 110, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Terracotta ceramic body
    ctx.fillStyle = '#A65E3B';
    ctx.strokeStyle = '#5E2F18';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-90, -40);
    ctx.quadraticCurveTo(0, -70, 95, -30);
    ctx.lineTo(85, 55);
    ctx.quadraticCurveTo(0, 85, -80, 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Geometric black painted bands
    ctx.strokeStyle = '#2B2118';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-75, -10);
    ctx.quadraticCurveTo(0, -30, 80, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-70, 15);
    ctx.quadraticCurveTo(0, -5, 75, 25);
    ctx.stroke();

    // Incised zigzags
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-60, 2);
    ctx.lineTo(-45, -15);
    ctx.lineTo(-30, 2);
    ctx.lineTo(-15, -15);
    ctx.lineTo(0, 2);
    ctx.lineTo(15, -15);
    ctx.lineTo(30, 2);
    ctx.lineTo(45, -15);
    ctx.lineTo(60, 2);
    ctx.stroke();

    ctx.restore();

    // Archaeological metadata strip
    ctx.fillStyle = 'rgba(38, 33, 27, 0.85)';
    ctx.fillRect(0, 550, 800, 50);

    ctx.fillStyle = '#FAF7F0';
    ctx.font = '13px monospace';
    ctx.fillText(`KHOJSETU IN-SITU PHOTOGRAMMETRY · GRID ${gridContext} · LAYER ${layerContext}`, 20, 580);

    // Scale bar
    ctx.strokeStyle = '#FAF7F0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(660, 574);
    ctx.lineTo(760, 574);
    ctx.moveTo(660, 568);
    ctx.lineTo(660, 580);
    ctx.moveTo(760, 568);
    ctx.lineTo(760, 580);
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('5 cm', 710, 566);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopStream();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#26211B]/85 backdrop-blur-[3px]">
      <div className="bg-[#FAF7F0] border-3 border-[#8B5E3C] max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Strip */}
        <div className="bg-[#EAE2D0] border-b border-[#D8CEBD] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#8B5E3C] text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B5E3C]">
                In-Situ Optical Record
              </div>
              <h3 className="font-serif font-bold text-base text-[#332E27] leading-none">
                FIELD SPECIMEN CAMERA
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono bg-[#E0D5C3] px-2 py-0.5 text-[#332E27]">
              Grid {gridContext} · Layer {layerContext}
            </span>
            <button
              onClick={onClose}
              className="p-1 border border-[#D5CABB] hover:bg-[#DCD2BE] text-[#554C41]"
              title="Close Camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-[#1A1815] flex-1 min-h-[340px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Review captured photo */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured archaeological specimen"
                className="max-h-[60vh] max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-[#5C6E41] text-white text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-wider shadow-sm">
                PHOTOGRAPH CAPTURED & SCALED
              </div>
            </div>
          ) : cameraError ? (
            /* Error / Permission fallback screen */
            <div className="p-6 text-center text-xs font-mono text-[#D8CEBD] max-w-md space-y-4">
              <AlertCircle className="w-8 h-8 text-[#A65E3B] mx-auto" />
              <div className="font-bold text-sm text-[#FAF7F0] uppercase tracking-wider">
                Field Camera Offline
              </div>
              <p className="text-[#BDB29F] font-sans text-xs leading-relaxed">
                {cameraError}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select File from Storage
                </button>
                <button
                  onClick={handleUseTrenchSample}
                  className="w-full sm:w-auto px-4 py-2 bg-[#FAF7F0] hover:bg-[#EAE2D0] text-[#332E27] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5E3C]" />
                  Simulate Trench Photo
                </button>
              </div>
            </div>
          ) : (
            /* Live Stream Video Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[60vh]"
              />

              {/* Archaeological Reticle / HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                {/* Top HUD */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#FAF7F0] bg-black/40 backdrop-blur-xs p-2 rounded-xs border border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B34F3F] animate-ping"></span>
                    <span>LIVE VIEW · OPTICAL SPECS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-[#FAF7F0]" />
                    <span>N BEARING 012°</span>
                  </div>
                </div>

                {/* Center Crosshairs */}
                <div className="self-center relative w-48 h-48 border border-white/40 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-white/70"></div>
                  <div className="h-6 w-0.5 bg-white/70 absolute"></div>
                  <div className="absolute w-20 h-20 rounded-full border border-white/30 border-dashed"></div>
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono text-white/60">
                    ALIGN SPECIMEN
                  </span>
                </div>

                {/* Bottom Metric Scale Preview */}
                <div className="flex items-end justify-between text-white/80 font-mono text-[10px] bg-black/40 backdrop-blur-xs p-2 border border-white/20">
                  <div>
                    <span>TRENCH DATUM: 142.4m</span>
                    <span className="block text-[9px] text-white/60">SECTOR B · GRID {gridContext}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-1 border-x border-b border-white bg-white/20"></div>
                    <span className="text-[9px] text-white mt-0.5 font-bold">5 cm scale</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas & File Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Controls Footer */}
        <div className="bg-[#EFE9DB] border-t border-[#D8CEBD] p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {capturedImage ? (
            /* Actions after photo captured */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                onClick={handleRetake}
                className="px-4 py-2 border border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#EAE2D0] font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Photo
              </button>

              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-[#5C6E41] hover:bg-[#485733] text-white font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Attach Photo to Record
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 border border-[#D5CABB] hover:bg-[#E2D8C5] text-[#554C41] flex items-center gap-1.5"
                  title="Upload photograph from field storage"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload Image</span>
                </button>

                {hasMultipleCameras && (
                  <button
                    onClick={() => {
                      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                    }}
                    className="px-3 py-1.5 border border-[#D5CABB] hover:bg-[#E2D8C5] text-[#554C41] flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Flip Camera</span>
                  </button>
                )}

                <button
                  onClick={handleUseTrenchSample}
                  className="px-2.5 py-1.5 border border-[#D5CABB] hover:bg-[#E2D8C5] text-[#7A7062] text-[11px]"
                  title="Simulate realistic in-situ artifact photo"
                >
                  Sample Specimen
                </button>
              </div>

              <button
                onClick={handleSnap}
                disabled={Boolean(cameraError) || isInitializing}
                className={`px-6 py-2.5 font-bold uppercase tracking-wider flex items-center gap-2 text-white shadow-md transition-all active:scale-[0.98] ${
                  cameraError || isInitializing
                    ? 'bg-[#BDB29F] cursor-not-allowed'
                    : 'bg-[#8B5E3C] hover:bg-[#724B2E]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>SNAP ARTIFACT PHOTOGRAPH</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
