import { SyncLogEntry, ConflictRecord } from '../types/archaeology';
import { memoryService } from './memoryService';
import { INITIAL_SYNC_LOGS, INITIAL_CONFLICT_DEMO } from '../data/demoRecords';

const SYNC_LOGS_KEY = 'khojsetu_sync_logs_v1';
const LEGACY_SYNC_LOGS_KEY = 'archaeoedge_sync_logs_v1';
const SYNC_TIME_KEY = 'khojsetu_last_sync_time';
const LEGACY_SYNC_TIME_KEY = 'archaeoedge_last_sync_time';

export type SyncStep = 
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTION_RESTORED'
  | 'CHECKING_PENDING'
  | 'UPLOADING'
  | 'DOWNLOADING'
  | 'COMPLETED'
  | 'ERROR';

export interface SyncProgressState {
  step: SyncStep;
  message: string;
  uploadedCount: number;
  downloadedCount: number;
  conflictCount: number;
  percentage: number;
}

export interface SyncService {
  isConnected(): boolean;
  setConnected(connected: boolean): void;
  getLastSyncTime(): string;
  getLogs(): SyncLogEntry[];
  addLog(action: string, detail: string, type: SyncLogEntry['type']): void;
  getConflictDemo(): ConflictRecord;
  resolveConflict(resolution: 'LOCAL' | 'SHARED' | 'MERGED'): void;
  runSimulatedSync(onProgress: (state: SyncProgressState) => void): Promise<void>;
  resetSync(): void;
}

class PrototypeSyncService implements SyncService {
  private connected: boolean = false;
  private logs: SyncLogEntry[] = [];
  private conflict: ConflictRecord = { ...INITIAL_CONFLICT_DEMO };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedLogs = localStorage.getItem(SYNC_LOGS_KEY) || localStorage.getItem(LEGACY_SYNC_LOGS_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      } else {
        this.logs = [...INITIAL_SYNC_LOGS];
        this.saveLogs();
      }
    } catch {
      this.logs = [...INITIAL_SYNC_LOGS];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to save sync logs', e);
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public setConnected(connected: boolean): void {
    this.connected = connected;
  }

  public getLastSyncTime(): string {
    return localStorage.getItem(SYNC_TIME_KEY) || localStorage.getItem(LEGACY_SYNC_TIME_KEY) || 'Today · 08:42';
  }

  public getLogs(): SyncLogEntry[] {
    return [...this.logs];
  }

  public addLog(action: string, detail: string, type: SyncLogEntry['type']): void {
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${now.getFullYear()} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedDate,
      action,
      detail,
      type
    };
    this.logs.unshift(newLog);
    this.saveLogs();
  }

  public getConflictDemo(): ConflictRecord {
    return { ...this.conflict };
  }

  public resolveConflict(resolution: 'LOCAL' | 'SHARED' | 'MERGED'): void {
    const record = memoryService.getRecordById(this.conflict.recordId);
    let chosenText = this.conflict.mergedNotes;
    let label = 'Notes merged';

    if (resolution === 'LOCAL') {
      chosenText = this.conflict.localNotes;
      label = 'Local observation preserved';
    } else if (resolution === 'SHARED') {
      chosenText = this.conflict.sharedNotes;
      label = 'Shared archive record adopted';
    }

    if (record) {
      record.fieldNotes = chosenText;
      record.syncStatus = 'SYNCED';
      memoryService.updateRecord(record);
    }

    this.addLog(
      `1 record conflict resolved (${this.conflict.recordId})`,
      `${label}: Reconciled differing stratigraphic notes between field unit and central archive.`,
      'conflict'
    );
  }

  public async runSimulatedSync(onProgress: (state: SyncProgressState) => void): Promise<void> {
    const pendingList = memoryService.getPendingRecords();
    const pendingCount = pendingList.length > 0 ? pendingList.length : 7;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // 1. CONNECTING
    onProgress({
      step: 'CONNECTING',
      message: 'Establishing encrypted field radio handshake with base relay...',
      uploadedCount: 0,
      downloadedCount: 0,
      conflictCount: 0,
      percentage: 15
    });
    await delay(700);

    // 2. CONNECTION RESTORED
    this.connected = true;
    onProgress({
      step: 'CONNECTION_RESTORED',
      message: 'Base relay connected. Carrier link stable (2.4 GHz LoRa / Field Starlink).',
      uploadedCount: 0,
      downloadedCount: 0,
      conflictCount: 0,
      percentage: 30
    });
    this.addLog('Connection restored', 'Base station relay connected. Bandwidth nominal for vector delta exchange.', 'connect');
    await delay(700);

    // 3. CHECKING PENDING
    onProgress({
      step: 'CHECKING_PENDING',
      message: `Analyzing local memory delta: ${pendingCount} pending discoveries found.`,
      uploadedCount: 0,
      downloadedCount: 0,
      conflictCount: 0,
      percentage: 45
    });
    await delay(700);

    // 4. UPLOADING
    onProgress({
      step: 'UPLOADING',
      message: `Uploading ${pendingCount} field records and vector embeddings to shared archive...`,
      uploadedCount: pendingCount,
      downloadedCount: 0,
      conflictCount: 0,
      percentage: 65
    });
    this.addLog(`${pendingCount} local records uploaded`, 'Field discoveries serialized and transmitted to central knowledge repository.', 'upload');
    await delay(800);

    // 5. DOWNLOADING
    onProgress({
      step: 'DOWNLOADING',
      message: 'Downloading 3 updated shared records & site-wide classification vectors...',
      uploadedCount: pendingCount,
      downloadedCount: 3,
      conflictCount: 1,
      percentage: 85
    });
    this.addLog('3 shared records received', 'Stratigraphic revisions from Trench Team Beta incorporated into local vector index.', 'download');
    await delay(800);

    // Update records in local memory: mark pending records as SYNCED
    pendingList.forEach(r => {
      r.syncStatus = 'SYNCED';
      memoryService.updateRecord(r);
    });

    const now = new Date();
    const formattedTime = `Today · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    localStorage.setItem(SYNC_TIME_KEY, formattedTime);

    // 6. COMPLETED
    onProgress({
      step: 'COMPLETED',
      message: 'Knowledge exchange complete. All shared records synchronized.',
      uploadedCount: pendingCount,
      downloadedCount: 3,
      conflictCount: 1,
      percentage: 100
    });
    this.addLog('Knowledge exchange complete', 'Local field memory and shared archive are fully in parity.', 'connect');
  }

  public resetSync(): void {
    this.connected = false;
    this.logs = [...INITIAL_SYNC_LOGS];
    this.saveLogs();
    localStorage.setItem(SYNC_TIME_KEY, 'Today · 08:42');
  }
}

export const syncService: SyncService = new PrototypeSyncService();
