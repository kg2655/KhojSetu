import React from 'react';
import { Search, Radio, Compass, Menu, User, ShieldAlert, Cpu, Camera } from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  isConnected: boolean;
  onToggleConnection: () => void;
  onOpenFieldMode: () => void;
  onOpenArchitecture: () => void;
  onOpenFieldCamera?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  isConnected,
  onToggleConnection,
  onOpenFieldMode,
  onOpenArchitecture,
  onOpenFieldCamera,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F0] border-b-2 border-[#D8CEBD] px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Site metadata */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 border border-[#D5CABB] text-[#554C41] hover:bg-[#EAE2D0]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block w-2.5 h-2.5 bg-[#8B5E3C]"></div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#7A7062] uppercase leading-none">
              CURRENT SITE
            </div>
            <div className="text-xs font-mono font-bold text-[#332E27] tracking-wider mt-0.5">
              DEMO EXCAVATION SITE · <span className="text-[#8B5E3C]">SECTOR B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={onSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search field memory (IDs, keywords, grids, materials)..."
            className="w-full bg-[#F4EFE4] border border-[#D8CEBD] focus:border-[#8B5E3C] focus:bg-[#FFFDF9] text-xs font-mono px-3 py-1.5 pl-8 text-[#332E27] placeholder:text-[#9C8F7C] outline-none transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-[#8B5E3C] absolute left-2.5 top-2.5 pointer-events-none" />
        </form>
      </div>

      {/* Right: Field Camera, Field Mode, Architecture, Status & Researcher */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
        {/* Field Camera Quick Trigger */}
        {onOpenFieldCamera && (
          <button
            onClick={onOpenFieldCamera}
            className="px-2.5 py-1 bg-[#5C6E41] hover:bg-[#485733] text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-[#3E4B2B] shadow-xs"
            title="Snap artifact photo with scale bar and trench watermark"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        )}

        {/* Field Mode Quick Action */}
        <button
          onClick={onOpenFieldMode}
          className="px-2.5 py-1 bg-[#8B5E3C] hover:bg-[#724B2E] text-[#FAF7F0] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-[#724B2E]"
          title="Open large-format Field Mode for tablet / harsh field conditions"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Field Mode</span>
        </button>

        {/* Architecture Button */}
        <button
          onClick={onOpenArchitecture}
          className="p-1 sm:px-2 sm:py-1 border border-[#D5CABB] hover:border-[#8B5E3C] bg-[#F2EDE2] text-[#554C41] text-[11px] flex items-center gap-1"
          title="View Edge-to-Cloud Qdrant architecture"
        >
          <Cpu className="w-3.5 h-3.5 text-[#8B5E3C]" />
          <span className="hidden md:inline">Architecture</span>
        </button>

        {/* Connectivity status toggle */}
        <button
          onClick={onToggleConnection}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-bold transition-colors ${
            isConnected
              ? 'bg-[#EFF4E7] border-[#5C6E41] text-[#42502B]'
              : 'bg-[#F9ECE9] border-[#B34F3F] text-[#933729]'
          }`}
          title="Toggle simulated connection to central repository"
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#5C6E41]' : 'bg-[#B34F3F]'}`}></span>
          <span>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
        </button>

        {/* Researcher tag */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#D8CEBD] text-[#6B6256]">
          <User className="w-3.5 h-3.5 text-[#8B5E3C]" />
          <div className="text-right leading-tight">
            <span className="block text-[9px] uppercase tracking-widest text-[#9C8F7C]">Researcher</span>
            <span className="font-bold text-[#332E27] text-[11px]">Team Alpha</span>
          </div>
        </div>
      </div>
    </header>
  );
};
