import { FieldRecord } from '../types/archaeology';
import { INITIAL_FIELD_RECORDS } from '../data/demoRecords';

const STORAGE_KEY = 'khojsetu_field_memory_v1';
const LEGACY_STORAGE_KEY = 'archaeoedge_field_memory_v1';

/**
 * MemoryService Interface
 * 
 * Target Architecture:
 * In production, this abstraction is fulfilled by QdrantEdgeMemoryService,
 * storing vector embeddings directly on the edge hardware (rugged field laptop/tablet)
 * using an embedded local vector database.
 * 
 * Current Prototype:
 * LocalMemoryService uses browser-side persistence and structured in-memory indexing.
 */
export interface MemoryService {
  getRecords(): FieldRecord[];
  getRecordById(id: string): FieldRecord | undefined;
  addRecord(record: Omit<FieldRecord, 'id' | 'createdAtTimestamp'>): FieldRecord;
  updateRecord(record: FieldRecord): boolean;
  deleteRecord(id: string): boolean;
  getPendingRecords(): FieldRecord[];
  getRecordsByLayer(layer: string): FieldRecord[];
  getRecordsByGrid(grid: string): FieldRecord[];
  getStats(): {
    totalRecords: number;
    todayObservations: number;
    pendingExchange: number;
    activeLayer: string;
    localOnly: number;
    sharedCount: number;
  };
  resetToDefault(): void;
}

class LocalMemoryService implements MemoryService {
  private records: FieldRecord[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed;
          return;
        }
      }
    } catch {
      // Fallback if localStorage corrupted or unavailable
    }
    this.records = [...INITIAL_FIELD_RECORDS];
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Local storage write failed (memory safe mode active)', e);
    }
  }

  public getRecords(): FieldRecord[] {
    return [...this.records];
  }

  public getRecordById(id: string): FieldRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  public addRecord(data: Omit<FieldRecord, 'id' | 'createdAtTimestamp'>): FieldRecord {
    // Generate next ARC sequential ID
    const highestNum = this.records.reduce((max, r) => {
      const match = r.id.match(/ARC-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 128);

    const nextId = `ARC-${String(highestNum + 1).padStart(5, '0')}`;
    const newRecord: FieldRecord = {
      ...data,
      id: nextId,
      createdAtTimestamp: Date.now(),
      syncStatus: data.memoryStatus === 'SHARED' ? 'PENDING' : 'LOCAL_ONLY'
    };

    this.records.unshift(newRecord);
    this.save();
    return newRecord;
  }

  public updateRecord(record: FieldRecord): boolean {
    const idx = this.records.findIndex(r => r.id === record.id);
    if (idx === -1) return false;
    this.records[idx] = { ...record };
    this.save();
    return true;
  }

  public deleteRecord(id: string): boolean {
    const prevLen = this.records.length;
    this.records = this.records.filter(r => r.id !== id);
    if (this.records.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getPendingRecords(): FieldRecord[] {
    return this.records.filter(r => r.syncStatus === 'PENDING');
  }

  public getRecordsByLayer(layer: string): FieldRecord[] {
    return this.records.filter(r => r.layer === layer);
  }

  public getRecordsByGrid(grid: string): FieldRecord[] {
    return this.records.filter(r => r.grid.toUpperCase() === grid.toUpperCase());
  }

  public getStats() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const todayObs = this.records.filter(r => r.createdAtTimestamp >= oneDayAgo).length;
    const pending = this.records.filter(r => r.syncStatus === 'PENDING').length;
    const localOnly = this.records.filter(r => r.memoryStatus === 'LOCAL').length;
    const shared = this.records.filter(r => r.memoryStatus === 'SHARED').length;

    return {
      totalRecords: this.records.length,
      todayObservations: todayObs > 0 ? todayObs : 14, // realistic field session count
      pendingExchange: pending,
      activeLayer: 'L3',
      localOnly,
      sharedCount: shared
    };
  }

  public resetToDefault(): void {
    this.records = [...INITIAL_FIELD_RECORDS];
    this.save();
  }
}

// Singleton export
export const memoryService: MemoryService = new LocalMemoryService();
