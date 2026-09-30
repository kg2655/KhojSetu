import React from 'react';
import { 
  Compass, 
  Map, 
  PenTool, 
  Archive, 
  Search, 
  Network, 
  Layers, 
  RefreshCw, 
  Cpu,
  Radio,
  BookOpen
} from 'lucide-react';

export type NavPage = 
  | 'field-station'
  | 'site-map'
  | 'record-finding'
  | 'memory-archive'
  | 'ask-field-archive'
  | 'relationships'
  | 'layer-timeline'
  | 'knowledge-exchange'
  | 'architecture';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  stats: {
    totalRecords: number;
    pendingExchange: number;
  };
  isConnected: boolean;
  onToggleConnection: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  stats,
  isConnected,
  onToggleConnection,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems: { id: NavPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'field-station', label: 'Field Station', icon: <Compass className="w-4 h-4" /> },
    { id: 'site-map', label: 'Site Map', icon: <Map className="w-4 h-4" /> },
    { id: 'record-finding', label: 'Record Finding', icon: <PenTool className="w-4 h-4" /> },
    { id: 'memory-archive', label: 'Memory Archive', icon: <Archive className="w-4 h-4" />, badge: stats.totalRecords },
    { id: 'ask-field-archive', label: 'Ask Field Archive', icon: <Search className="w-4 h-4" /> },
    { id: 'relationships', label: 'Relationships', icon: <Network className="w-4 h-4" /> },
    { id: 'layer-timeline', label: 'Layer Timeline', icon: <Layers className="w-4 h-4" /> },
    { id: 'knowledge-exchange', label: 'Knowledge Exchange', icon: <RefreshCw className="w-4 h-4" />, badge: stats.pendingExchange },
    { id: 'architecture', label: 'Target Architecture', icon: <Cpu className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#332E27]/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#EFE9DB] border-r-2 border-[#D8CEBD] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header / Field Log Title */}
        <div>
          <div className="p-4 border-b border-[#D8CEBD] bg-[#E8E0CF]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#A65E3B] border border-[#7A4225] shrink-0"></span>
              <h1 className="font-serif font-black text-lg tracking-wider text-[#332E27] uppercase">
                KhojSetu
              </h1>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[#7A7062] uppercase mt-0.5">
              Connecting Discoveries Across the Field
            </div>
            <div className="mt-2 text-[9px] font-mono bg-[#E0D5C3] px-2 py-0.5 text-[#554C41] border border-[#D5CABB]">
              DEMO EXCAVATION · SECTOR B
            </div>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-3">
            <div className="text-[9px] font-mono font-bold tracking-widest text-[#9C8F7C] uppercase px-2 mb-2">
              Field Log Index
            </div>

            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors text-left ${
                      isActive
                        ? 'bg-[#FAF7F0] text-[#8B5E3C] font-bold border-l-3 border-[#8B5E3C] shadow-xs'
                        : 'text-[#554C41] hover:bg-[#E5DDCB] hover:text-[#332E27]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[#8B5E3C]' : 'text-[#7A7062]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-semibold ${
                        item.id === 'knowledge-exchange' && stats.pendingExchange > 0
                          ? 'bg-[#B34F3F] text-[#FAF7F0]'
                          : 'bg-[#DCD2BE] text-[#554C41]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer / Field Unit Status */}
        <div className="p-3 border-t border-[#D8CEBD] bg-[#E5DDCB] space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-[#D5CABB] pb-2">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#7A7062]" />
              <span className="font-bold text-[#332E27]">FIELD UNIT 07</span>
            </div>

            {/* Connectivity toggle indicator */}
            <button
              onClick={onToggleConnection}
              title="Click to toggle simulated connectivity"
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 border cursor-pointer transition-colors ${
                isConnected
                  ? 'bg-[#EFF4E7] border-[#5C6E41] text-[#42502B]'
                  : 'bg-[#F9ECE9] border-[#B34F3F] text-[#933729]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#5C6E41]' : 'bg-[#B34F3F]'}`}></span>
              <span>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-[#FAF7F0] p-1.5 border border-[#D5CABB]">
              <span className="text-[#827768] block">LOCAL MEMORY</span>
              <span className="text-xs font-bold text-[#332E27]">{stats.totalRecords} RECORDS</span>
            </div>

            <div className="bg-[#FAF7F0] p-1.5 border border-[#D5CABB]">
              <span className="text-[#827768] block">PENDING</span>
              <span className={`text-xs font-bold ${stats.pendingExchange > 0 ? 'text-[#B34F3F]' : 'text-[#5C6E41]'}`}>
                {stats.pendingExchange} RECORDS
              </span>
            </div>
          </div>

          <div className="text-[9px] text-[#827768] flex items-center justify-between pt-1">
            <span>Autonomous Edge Node</span>
            <span className="text-[#A65E3B]">v0.9.4 Prototype</span>
          </div>
        </div>
      </aside>
    </>
  );
};
