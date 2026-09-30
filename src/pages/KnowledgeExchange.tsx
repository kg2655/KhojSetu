import React, { useState, useEffect } from 'react';
import { FieldRecord, SyncLogEntry, ConflictRecord } from '../types/archaeology';
import { syncService, SyncProgressState } from '../services/syncService';
import { memoryService } from '../services/memoryService';
import { useToast } from '../components/layout/Toast';
import { 
  RefreshCw, 
  Radio, 
  ArrowDown, 
  ArrowUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Clock, 
  FileText, 
  Database,
  HardDrive
} from 'lucide-react';

interface KnowledgeExchangeProps {
  stats: {
    totalRecords: number;
    pendingExchange: number;
  };
  isConnected: boolean;
  onRefreshStats: () => void;
  onSelectRecord: (record: FieldRecord) => void;
}

export const KnowledgeExchange: React.FC<KnowledgeExchangeProps> = ({
  stats,
  isConnected,
  onRefreshStats,
  onSelectRecord
}) => {
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState | null>(null);
  const [logs, setLogs] = useState<SyncLogEntry[]>(() => syncService.getLogs());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => syncService.getLastSyncTime());
  const [conflictDemo, setConflictDemo] = useState<ConflictRecord>(() => syncService.getConflictDemo());
  const [selectedResolution, setSelectedResolution] = useState<'LOCAL' | 'SHARED' | 'MERGED'>('MERGED');
  const [conflictResolved, setConflictResolved] = useState(false);

  const pendingRecords = memoryService.getPendingRecords();

  const handleStartSimulatedSync = async () => {
    setIsSyncing(true);
    setSyncProgress(null);

    await syncService.runSimulatedSync((progressState) => {
      setSyncProgress({ ...progressState });
      if (progressState.step === 'COMPLETED') {
        setIsSyncing(false);
        setLogs(syncService.getLogs());
        setLastSyncTime(syncService.getLastSyncTime());
        onRefreshStats();
        showToast(
          'KNOWLEDGE EXCHANGE COMPLETE',
          'Field discoveries uploaded and local vector memory synchronized.',
          'success'
        );
      }
    });
  };

  const handleResolveConflict = (res: 'LOCAL' | 'SHARED' | 'MERGED') => {
    setSelectedResolution(res);
    syncService.resolveConflict(res);
    setConflictResolved(true);
    setLogs(syncService.getLogs());
    onRefreshStats();

    showToast(
      'CONFLICT RECONCILED',
      `Stratigraphic notes for ${conflictDemo.recordId} updated in local memory.`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Edge-to-Central Uplink Protocol
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            KNOWLEDGE EXCHANGE
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Move selected field memory to shared knowledge when connectivity returns.
          </p>
        </div>

        {/* Top Status Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono bg-[#FAF7F0] border border-[#D8CEBD] p-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#8B5E3C]" />
            <span className="font-bold text-[#332E27]">FIELD UNIT 07</span>
          </div>
          <span className="text-[#D8CEBD]">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#5C6E41]' : 'bg-[#B34F3F]'}`}></span>
            <span className="font-bold">{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3">
          <span className="text-[10px] font-mono uppercase text-[#7A7062] block">Local Memory</span>
          <div className="text-2xl font-serif font-black text-[#332E27] mt-1">
            {stats.totalRecords}
          </div>
          <span className="text-[10px] font-mono text-[#9C8F7C]">records stored on unit</span>
        </div>

        <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3">
          <span className="text-[10px] font-mono uppercase text-[#7A7062] block">Pending Exchange</span>
          <div className={`text-2xl font-serif font-black mt-1 ${stats.pendingExchange > 0 ? 'text-[#B34F3F]' : 'text-[#5C6E41]'}`}>
            {stats.pendingExchange}
          </div>
          <span className="text-[10px] font-mono text-[#9C8F7C]">queued for central uplink</span>
        </div>

        <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3">
          <span className="text-[10px] font-mono uppercase text-[#7A7062] block">Last Exchange</span>
          <div className="text-base font-serif font-bold text-[#332E27] mt-2">
            {lastSyncTime}
          </div>
          <span className="text-[10px] font-mono text-[#9C8F7C]">Base station link</span>
        </div>

        <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-[#7A7062] block">Channel Protocol</span>
          <div className="text-xs font-mono font-bold text-[#8B5E3C]">
            PROTOTYPE SYNC
          </div>
          <span className="text-[9px] font-mono text-[#A69B88]">
            Simulated vector delta exchange
          </span>
        </div>
      </div>

      {/* Section 20 & 21: SYNC VISUALIZATION & SIMULATE BUTTON */}
      <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE2D0] pb-4 mb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B5E3C] font-bold">
              Exchange Pipeline
            </span>
            <h2 className="text-xl font-serif font-bold text-[#332E27]">
              SYNCHRONIZATION TOPOLOGY
            </h2>
          </div>

          <button
            onClick={handleStartSimulatedSync}
            disabled={isSyncing}
            className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
              isSyncing
                ? 'bg-[#BDB29F] text-[#FAF7F0] cursor-not-allowed'
                : 'bg-[#8B5E3C] hover:bg-[#724B2E] text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'SIMULATE CONNECTION & EXCHANGE'}</span>
          </button>
        </div>

        {/* Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-mono text-xs mb-6">
          {/* Node 1 */}
          <div className="bg-[#F2ECE0] border-2 border-[#8B5E3C] p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold text-[#8B5E3C]">
              <HardDrive className="w-4 h-4" />
              FIELD UNIT 07
            </div>
            <div className="text-[11px] text-[#332E27] font-semibold">Local Memory Store</div>
            <div className="text-[10px] text-[#7A7062]">{stats.totalRecords} Active Records</div>
          </div>

          {/* Node 2: Pending queue */}
          <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3 text-center space-y-1">
            <span className="text-[10px] uppercase text-[#7A7062] block">Outbox Delta</span>
            <div className={`font-bold text-base ${stats.pendingExchange > 0 ? 'text-[#B34F3F]' : 'text-[#5C6E41]'}`}>
              {stats.pendingExchange} Pending Records
            </div>
            <span className="text-[9px] text-[#9C8F7C]">Policy: SHARED</span>
          </div>

          {/* Node 3: Protocol */}
          <div className="bg-[#EFE9DB] border border-[#D5CABB] p-3 text-center space-y-1">
            <span className="text-[10px] uppercase text-[#8B5E3C] font-bold block">
              Knowledge Exchange
            </span>
            <div className="text-[11px] font-semibold text-[#332E27]">
              Selective Vector Uplink
            </div>
            <span className="text-[9px] text-[#7A7062]">Cryptographic Hashing</span>
          </div>

          {/* Node 4: Central */}
          <div className="bg-[#EFF4E7] border-2 border-[#5C6E41] p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold text-[#5C6E41]">
              <Database className="w-4 h-4" />
              SHARED ARCHIVE
            </div>
            <div className="text-[11px] text-[#332E27] font-semibold">Institutional Repository</div>
            <div className="text-[10px] text-[#7A7062]">Central Vector Memory</div>
          </div>
        </div>

        {/* Real-time Progress Animation Bar */}
        {syncProgress && (
          <div className="bg-[#F2ECE0] border border-[#D8CEBD] p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-pulse"></span>
                <span>{syncProgress.step.replace('_', ' ')}</span>
              </span>
              <span className="font-bold text-[#332E27]">{syncProgress.percentage}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-[#DCD2C0] h-2 overflow-hidden">
              <div
                className="bg-[#8B5E3C] h-full transition-all duration-300"
                style={{ width: `${syncProgress.percentage}%` }}
              ></div>
            </div>

            <div className="text-xs text-[#554C41]">
              {syncProgress.message}
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E0D5C3] text-[11px]">
              <div className="flex items-center gap-1.5 text-[#5C6E41] font-semibold">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>↑ {syncProgress.uploadedCount} uploaded</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8B5E3C] font-semibold">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>↓ {syncProgress.downloadedCount} received</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B34F3F] font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>! {syncProgress.conflictCount} conflict detected</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#EAE2D0] text-[11px] font-mono text-[#7A7062] flex items-center justify-between">
          <span>PROTOTYPE NOTICE: Live Qdrant Edge ↔ Qdrant Server synchronization is planned for the full implementation.</span>
          <span className="text-[#8B5E3C]">Simulated Local State Engine</span>
        </div>
      </div>

      {/* Section 22: CONFLICT HANDLING DEMO */}
      <div className="bg-[#FAF7F0] border-2 border-[#D8CEBD] p-5 space-y-4">
        <div className="border-b border-[#EAE2D0] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B34F3F]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#332E27]">
                MEMORY UPDATE CONFLICT DEMO
              </h3>
              <div className="text-[10px] font-mono text-[#7A7062]">
                Evolving archaeological interpretation between field observation and institutional catalog
              </div>
            </div>
          </div>

          <span className="font-mono text-xs font-bold text-[#8B5E3C] bg-[#EFE9DB] px-2 py-0.5 border border-[#D5CABB]">
            RECORD {conflictDemo.recordId}
          </span>
        </div>

        <p className="text-xs font-sans text-[#6B6256] leading-relaxed">
          Two conflicting stratigraphic observations were detected for specimen <strong>{conflictDemo.recordId} ({conflictDemo.title})</strong> discovered in Grid {conflictDemo.grid}, Layer {conflictDemo.layer}. Reconcile before committing to the shared vector index:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Local observation */}
          <div className={`p-3.5 border-2 transition-all ${selectedResolution === 'LOCAL' ? 'border-[#8B5E3C] bg-[#F2ECE0]' : 'border-[#D5CABB] bg-[#FAF8F3]'}`}>
            <div className="text-[10px] font-bold text-[#8B5E3C] uppercase mb-1">
              [ LOCAL TRENCH NOTE ] (Field Unit 07)
            </div>
            <p className="font-sans text-xs text-[#332E27] leading-relaxed">
              "{conflictDemo.localNotes}"
            </p>
          </div>

          {/* Shared observation */}
          <div className={`p-3.5 border-2 transition-all ${selectedResolution === 'SHARED' ? 'border-[#5C6E41] bg-[#EFF4E7]' : 'border-[#D5CABB] bg-[#FAF8F3]'}`}>
            <div className="text-[10px] font-bold text-[#5C6E41] uppercase mb-1">
              [ SHARED ARCHIVE NOTE ] (Central Team Beta)
            </div>
            <p className="font-sans text-xs text-[#332E27] leading-relaxed">
              "{conflictDemo.sharedNotes}"
            </p>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="bg-[#F2ECE0] p-4 border border-[#D8CEBD] space-y-3 font-mono text-xs">
          <div className="font-bold text-[#332E27] uppercase tracking-wider">
            Reconciliation Policy:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleResolveConflict('LOCAL')}
              className={`p-2 border text-left transition-colors ${
                selectedResolution === 'LOCAL'
                  ? 'bg-[#8B5E3C] text-white border-[#724B2E] font-bold'
                  : 'bg-[#FAF7F0] text-[#554C41] border-[#D8CEBD] hover:bg-[#EAE2D0]'
              }`}
            >
              KEEP LOCAL
              <span className="block text-[10px] font-normal opacity-85 mt-0.5">Retain Unit 07 note</span>
            </button>

            <button
              onClick={() => handleResolveConflict('SHARED')}
              className={`p-2 border text-left transition-colors ${
                selectedResolution === 'SHARED'
                  ? 'bg-[#5C6E41] text-white border-[#42502B] font-bold'
                  : 'bg-[#FAF7F0] text-[#554C41] border-[#D8CEBD] hover:bg-[#EAE2D0]'
              }`}
            >
              KEEP SHARED
              <span className="block text-[10px] font-normal opacity-85 mt-0.5">Adopt central archive note</span>
            </button>

            <button
              onClick={() => handleResolveConflict('MERGED')}
              className={`p-2 border text-left transition-colors ${
                selectedResolution === 'MERGED'
                  ? 'bg-[#8B5E3C] text-white border-[#724B2E] font-bold'
                  : 'bg-[#FAF7F0] text-[#554C41] border-[#D8CEBD] hover:bg-[#EAE2D0]'
              }`}
            >
              MERGE NOTES (Default)
              <span className="block text-[10px] font-normal opacity-85 mt-0.5">Synthesize both observations</span>
            </button>
          </div>

          {/* Result preview */}
          <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3">
            <span className="text-[10px] font-bold text-[#7A7062] uppercase block mb-1">
              Active Resolved Text:
            </span>
            <p className="text-xs font-sans text-[#332E27] leading-relaxed">
              {selectedResolution === 'LOCAL'
                ? conflictDemo.localNotes
                : selectedResolution === 'SHARED'
                ? conflictDemo.sharedNotes
                : conflictDemo.mergedNotes}
            </p>
          </div>
        </div>
      </div>

      {/* Section 23: SYNC ACTIVITY LOG */}
      <div className="bg-[#FAF7F0] border-2 border-[#D8CEBD] p-5 space-y-3 font-mono text-xs">
        <div className="border-b border-[#EAE2D0] pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B5E3C]" />
            <h3 className="font-serif font-bold text-base text-[#332E27]">
              KNOWLEDGE EXCHANGE LOG
            </h3>
          </div>
          <span className="text-[10px] text-[#7A7062]">
            Auditable Transaction Ledger
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {logs.map(log => (
            <div
              key={log.id}
              className="p-2.5 bg-[#FAF8F3] border border-[#D8CEBD] flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-[#332E27] flex items-center gap-2">
                  <span className="text-[#8B5E3C]">{log.timestamp}</span>
                  <span>·</span>
                  <span>{log.action}</span>
                </div>
                <div className="text-[11px] text-[#6B6256] mt-0.5 font-sans leading-normal">
                  {log.detail}
                </div>
              </div>

              <span className={`text-[9px] uppercase px-1.5 py-0.5 font-bold shrink-0 ${
                log.type === 'upload' ? 'bg-[#EFF4E7] text-[#42502B]' :
                log.type === 'conflict' ? 'bg-[#FFF2E0] text-[#8B5E3C]' :
                log.type === 'download' ? 'bg-[#EAE2D0] text-[#554C41]' :
                'bg-[#EFE9DB] text-[#7A7062]'
              }`}>
                {log.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
