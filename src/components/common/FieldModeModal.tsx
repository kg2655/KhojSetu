import React from 'react';
import { X, PlusCircle, Camera, Search, RefreshCw, ShieldCheck, Radio, Compass } from 'lucide-react';
import { NavPage } from '../layout/Sidebar';

interface FieldModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavPage) => void;
  stats: {
    totalRecords: number;
    pendingExchange: number;
    activeLayer: string;
  };
  isConnected: boolean;
  onSimulateSync: () => void;
  onOpenFieldCamera?: () => void;
}

export const FieldModeModal: React.FC<FieldModeModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  stats,
  isConnected,
  onSimulateSync,
  onOpenFieldCamera
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332E27]/75 backdrop-blur-[2px]">
      <div className="bg-[#FAF7F0] border-4 border-[#8B5E3C] max-w-xl w-full shadow-2xl relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#D8CEBD] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B5E3C] text-[#FAF7F0]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#8B5E3C]">
                Field Station Mode
              </div>
              <h2 className="text-xl font-serif font-black text-[#332E27]">
                HIGH-TACTILE FIELD INTERFACE
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#D5CABB] hover:bg-[#EAE2D0] text-[#554C41]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline notification banner */}
        <div className="bg-[#EFE9DB] border border-[#D8CEBD] p-3.5 mb-6 flex items-start gap-3">
          <div className="mt-0.5">
            <ShieldCheck className="w-5 h-5 text-[#5C6E41]" />
          </div>
          <div className="flex-1 text-xs font-mono">
            <div className="font-bold text-[#332E27] uppercase tracking-wide flex items-center gap-2">
              <span>OFFLINE MODE ACTIVE</span>
              <span className={`px-1.5 py-0.2 text-[9px] ${isConnected ? 'bg-[#5C6E41] text-white' : 'bg-[#B34F3F] text-white'}`}>
                {isConnected ? '● CONNECTED' : '● AIR-GAPPED'}
              </span>
            </div>
            <p className="text-[#6B6256] mt-1 leading-relaxed">
              All core field operations remain fully operational without connectivity. Vector indexes and record store run directly on device storage.
            </p>
          </div>
        </div>

        {/* Four Large Tactile Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 font-mono">
          <button
            onClick={() => {
              onClose();
              onNavigate('record-finding');
            }}
            className="p-5 bg-[#8B5E3C] hover:bg-[#724B2E] text-[#FAF7F0] border-2 border-[#5A381E] flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md group"
          >
            <PlusCircle className="w-7 h-7 text-[#FAF7F0] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm tracking-wider uppercase text-center">
              + RECORD FINDING
            </span>
            <span className="text-[10px] text-[#E0D5C3]">New specimen field sheet</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenFieldCamera) {
                onOpenFieldCamera();
              } else {
                onNavigate('record-finding');
              }
            }}
            className="p-5 bg-[#FAF7F0] hover:bg-[#F2ECE0] text-[#332E27] border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98] group"
          >
            <Camera className="w-7 h-7 text-[#8B5E3C] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm tracking-wider uppercase text-center">
              📷 FIELD PHOTOGRAPH
            </span>
            <span className="text-[10px] text-[#7A7062]">Snap in-situ artifact photo</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('ask-field-archive');
            }}
            className="p-5 bg-[#FAF7F0] hover:bg-[#F2ECE0] text-[#332E27] border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98] group"
          >
            <Search className="w-7 h-7 text-[#8B5E3C] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm tracking-wider uppercase text-center">
              ⌕ SEARCH LOCAL MEMORY
            </span>
            <span className="text-[10px] text-[#7A7062]">Natural language inquiry</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('knowledge-exchange');
            }}
            className="p-5 bg-[#FAF7F0] hover:bg-[#F2ECE0] text-[#332E27] border-2 border-[#8B5E3C] flex flex-col items-center justify-center gap-2 transition-transform active:scale-[0.98] group"
          >
            <RefreshCw className="w-7 h-7 text-[#5C6E41] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm tracking-wider uppercase text-center">
              ⇅ SYNC MEMORY
            </span>
            <span className="text-[10px] text-[#7A7062]">
              {stats.pendingExchange} pending records queued
            </span>
          </button>
        </div>

        {/* Status Strip */}
        <div className="bg-[#EFE9DB] border-t border-[#D8CEBD] -mx-6 -mb-6 p-4 flex items-center justify-between text-xs font-mono text-[#6B6256]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#8B5E3C]" />
            <span>Unit 07 · Sector B · Layer {stats.activeLayer}</span>
          </div>
          <div>
            <span>{stats.totalRecords} records in local memory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
