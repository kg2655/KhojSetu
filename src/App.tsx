import React, { useState, useEffect, useCallback } from 'react';
import { FieldRecord } from './types/archaeology';
import { memoryService } from './services/memoryService';
import { syncService } from './services/syncService';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastProvider, useToast } from './components/layout/Toast';
import { RecordDetailModal } from './components/records/RecordDetailModal';
import { FieldModeModal } from './components/common/FieldModeModal';
import { ArchitectureModal } from './components/common/ArchitectureModal';
import { FieldCameraModal } from './components/camera/FieldCameraModal';

// Pages
import { FieldStation } from './pages/FieldStation';
import { SiteMap } from './pages/SiteMap';
import { RecordFinding } from './pages/RecordFinding';
import { MemoryArchive } from './pages/MemoryArchive';
import { AskFieldArchive } from './pages/AskFieldArchive';
import { Relationships } from './pages/Relationships';
import { LayerTimeline } from './pages/LayerTimeline';
import { KnowledgeExchange } from './pages/KnowledgeExchange';

const AppContent: React.FC = () => {
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState<NavPage>('field-station');
  const [records, setRecords] = useState<FieldRecord[]>(() => memoryService.getRecords());
  const [stats, setStats] = useState(() => memoryService.getStats());
  const [isConnected, setIsConnected] = useState<boolean>(() => syncService.isConnected());
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);

  // Modals & Panels
  const [isFieldModeOpen, setIsFieldModeOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isGlobalCameraOpen, setIsGlobalCameraOpen] = useState(false);
  const [initialCameraPhoto, setInitialCameraPhoto] = useState<string | null>(null);

  // Global search input
  const [globalSearch, setGlobalSearch] = useState('');

  // Refresh records and stats from local memory
  const refreshMemoryState = useCallback(() => {
    const updated = memoryService.getRecords();
    setRecords(updated);
    setStats(memoryService.getStats());
    setIsConnected(syncService.isConnected());
  }, []);

  const handleToggleConnection = () => {
    const nextState = !isConnected;
    syncService.setConnected(nextState);
    setIsConnected(nextState);

    if (nextState) {
      syncService.addLog(
        'Simulated link activated',
        'Carrier signal detected. Base relay handshake available for knowledge exchange.',
        'connect'
      );
      showToast('CONNECTION RESTORED', 'Base relay link detected. Knowledge exchange ready.', 'success');
    } else {
      syncService.addLog(
        'Offline Mode active',
        'Radio link offline. Local memory storage and vector search continue autonomously.',
        'connect'
      );
      showToast('FIELD MODE: OFFLINE', 'Working in disconnected autonomous mode.', 'warning');
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setCurrentPage('memory-archive');
    }
  };

  const handleRecordCreated = (newRecord: FieldRecord) => {
    refreshMemoryState();
    setSelectedRecord(newRecord);
  };

  const handleToggleMemoryPolicy = (recordId: string) => {
    const rec = memoryService.getRecordById(recordId);
    if (!rec) return;

    const nextPolicy = rec.memoryStatus === 'LOCAL' ? 'SHARED' : 'LOCAL';
    rec.memoryStatus = nextPolicy;
    rec.syncStatus = nextPolicy === 'SHARED' ? 'PENDING' : 'LOCAL_ONLY';
    memoryService.updateRecord(rec);
    refreshMemoryState();
    setSelectedRecord({ ...rec });

    showToast(
      'MEMORY POLICY UPDATED',
      `${rec.id} is now ${nextPolicy === 'SHARED' ? 'QUEUED FOR EXCHANGE (SHARED)' : 'STORED LOCAL ONLY'}.`,
      'info'
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F0E6] text-[#332E27] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'architecture') {
            setIsArchitectureOpen(true);
          } else {
            setCurrentPage(page);
          }
        }}
        stats={stats}
        isConnected={isConnected}
        onToggleConnection={handleToggleConnection}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isConnected={isConnected}
          onToggleConnection={handleToggleConnection}
          onOpenFieldMode={() => setIsFieldModeOpen(true)}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
          onOpenFieldCamera={() => setIsGlobalCameraOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={handleGlobalSearchSubmit}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'field-station' && (
            <FieldStation
              records={records}
              onSelectRecord={setSelectedRecord}
              onNavigate={(page) => setCurrentPage(page)}
              stats={stats}
            />
          )}

          {currentPage === 'site-map' && (
            <SiteMap
              records={records}
              onSelectRecord={setSelectedRecord}
            />
          )}

          {currentPage === 'record-finding' && (
            <RecordFinding
              onRecordCreated={(rec) => {
                handleRecordCreated(rec);
                setInitialCameraPhoto(null);
              }}
              onNavigate={(page) => setCurrentPage(page)}
              initialPhoto={initialCameraPhoto}
            />
          )}

          {currentPage === 'memory-archive' && (
            <MemoryArchive
              records={records}
              onSelectRecord={setSelectedRecord}
              initialQuery={globalSearch}
            />
          )}

          {currentPage === 'ask-field-archive' && (
            <AskFieldArchive
              onSelectRecord={setSelectedRecord}
            />
          )}

          {currentPage === 'relationships' && (
            <Relationships
              records={records}
              onSelectRecord={setSelectedRecord}
            />
          )}

          {currentPage === 'layer-timeline' && (
            <LayerTimeline
              records={records}
              onSelectRecord={setSelectedRecord}
            />
          )}

          {currentPage === 'knowledge-exchange' && (
            <KnowledgeExchange
              stats={stats}
              isConnected={isConnected}
              onRefreshStats={refreshMemoryState}
              onSelectRecord={setSelectedRecord}
            />
          )}
        </main>

        {/* Persistent Archival Footer Strip */}
        <footer className="bg-[#EFE9DB] border-t-2 border-[#D8CEBD] px-4 sm:px-8 py-3 text-[11px] font-mono text-[#7A7062] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#332E27]">KHOJSETU</span>
            <span>·</span>
            <span>DEMO EXCAVATION SITE (SECTOR B)</span>
            <span>·</span>
            <span>FIELD UNIT 07</span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[#A65E3B] font-bold">SYNTHETIC FIELD DATASET</span>
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-[#8B5E3C] hover:underline"
            >
              Qdrant Edge Target Architecture
            </button>
          </div>
        </footer>
      </div>

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onSelectRelated={(relatedId) => {
          const target = records.find(r => r.id === relatedId);
          if (target) setSelectedRecord(target);
        }}
        onToggleMemoryPolicy={handleToggleMemoryPolicy}
        allRecords={records}
        onRecordUpdated={() => refreshMemoryState()}
      />

      {/* Tactile Field Mode Overlay */}
      <FieldModeModal
        isOpen={isFieldModeOpen}
        onClose={() => setIsFieldModeOpen(false)}
        onNavigate={(page) => setCurrentPage(page)}
        stats={stats}
        isConnected={isConnected}
        onSimulateSync={() => {
          setIsFieldModeOpen(false);
          setCurrentPage('knowledge-exchange');
        }}
        onOpenFieldCamera={() => {
          setIsFieldModeOpen(false);
          setIsGlobalCameraOpen(true);
        }}
      />

      {/* Standalone Field Camera Trigger Modal */}
      <FieldCameraModal
        isOpen={isGlobalCameraOpen}
        onClose={() => setIsGlobalCameraOpen(false)}
        gridContext="B12"
        layerContext="L3"
        onCapture={(photo) => {
          setInitialCameraPhoto(photo);
          setCurrentPage('record-finding');
          showToast('PHOTOGRAPH CAPTURED', 'Real in-situ photo ready. Complete the field sheet to log finding.', 'success');
        }}
      />

      {/* System Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
