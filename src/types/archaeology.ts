export type MaterialType = 
  | 'Ceramic' 
  | 'Stone' 
  | 'Metal' 
  | 'Bone' 
  | 'Organic' 
  | 'Glass'
  | 'Other';

export type ConditionType = 'Fragmented' | 'Complete' | 'Damaged' | 'Weathered' | 'Unknown';

export type MemoryStatus = 'LOCAL' | 'SHARED';
export type SyncStatus = 'SYNCED' | 'PENDING' | 'CONFLICT' | 'LOCAL_ONLY';

export type ExcavationLayer = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface FieldRecord {
  id: string; // e.g. "ARC-00124"
  title: string;
  fieldNotes: string;
  artifactType: string;
  material: MaterialType;
  condition: ConditionType;
  period: string;
  site: string;
  sector: string;
  grid: string; // e.g. "B12"
  layer: ExcavationLayer;
  depth: number; // in meters, e.g. 1.8
  recordedBy: string;
  recordedAt: string; // e.g. "30 SEP 2026"
  createdAtTimestamp: number;
  memoryStatus: MemoryStatus; // LOCAL vs SHARED
  syncStatus: SyncStatus;
  importance: 'High' | 'Medium' | 'Routine';
  illustrationType: 'ceramic_painted' | 'stone_biface' | 'pottery_rim' | 'bronze_blade' | 'bone_awl' | 'bead_necklace' | 'charcoal' | 'terracotta_figurine' | 'soil_profile' | 'inscription_stone';
  hasSketch: boolean;
  imageUrl?: string; // Captured real camera photograph data URL or uploaded field photo
  sharedVersionNotes?: string; // used for conflict demo
  relatedRecordIds: string[];
  tags: string[];
}

export interface SemanticSearchResult {
  record: FieldRecord;
  similarityScore: number; // 0 to 100
  retrievalReasons: string[];
}

export interface AssistantAnswer {
  query: string;
  reviewTitle: string;
  relatedRecords: FieldRecord[];
  synthesis: string;
  sourceCount: number;
  evidenceConfidence: 'high' | 'moderate' | 'insufficient';
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  type: 'upload' | 'download' | 'conflict' | 'connect' | 'queue';
}

export interface ConflictRecord {
  recordId: string;
  title: string;
  grid: string;
  layer: ExcavationLayer;
  localNotes: string;
  sharedNotes: string;
  mergedNotes: string;
}
