import React, { useState } from 'react';
import { FieldRecord } from '../../types/archaeology';
import { ArtifactIllustration } from './ArtifactIllustration';
import { FieldCameraModal } from '../camera/FieldCameraModal';
import { memoryService } from '../../services/memoryService';
import { X, Layers, MapPin, Compass, ShieldCheck, Share2, Calendar, User, ArrowRight, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';

interface RecordDetailModalProps {
  record: FieldRecord | null;
  onClose: () => void;
  onSelectRelated?: (recordId: string) => void;
  onToggleMemoryPolicy?: (recordId: string) => void;
  allRecords?: FieldRecord[];
  onRecordUpdated?: (updated: FieldRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onSelectRelated,
  onToggleMemoryPolicy,
  allRecords = [],
  onRecordUpdated
}) => {
  const [viewMode, setViewMode] = useState<'photo' | 'sketch'>('photo');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  if (!record) return null;

  const currentHasPhoto = Boolean(record.imageUrl);

  const handleCapturePhoto = (dataUrl: string) => {
    record.imageUrl = dataUrl;
    memoryService.updateRecord(record);
    if (onRecordUpdated) onRecordUpdated({ ...record });
    setViewMode('photo');
  };

  const relatedRecords = record.relatedRecordIds
    .map(id => allRecords.find(r => r.id === id))
    .filter((r): r is FieldRecord => Boolean(r));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332E27]/50 backdrop-blur-[1px]">
      <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Archival header strip */}
        <div className="bg-[#EAE2D0] border-b border-[#D8CEBD] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#8B5E3C] text-[#FAF7F0] text-[10px] font-mono px-2 py-0.5 font-bold tracking-widest uppercase">
              Field Record
            </span>
            <span className="font-mono text-xs font-semibold text-[#332E27] tracking-wider">
              No. {record.id}
            </span>
            <span className="text-[11px] text-[#7A7062] font-mono">
              [ {record.period} ]
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6256] hover:text-[#332E27] hover:bg-[#DCD2BE] p-1 border border-transparent hover:border-[#BDB29F] transition-colors"
            title="Close record"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6">
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5DDCB] pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#332E27] leading-tight">
                {record.title}
              </h2>
              <div className="text-xs font-mono text-[#8B5E3C] mt-1 uppercase tracking-wider">
                {record.artifactType} · {record.material}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-mono px-2.5 py-1 border flex items-center gap-1.5 ${
                record.memoryStatus === 'LOCAL'
                  ? 'border-[#BDB29F] bg-[#F2EDE2] text-[#6B6256]'
                  : 'border-[#5C6E41] bg-[#EFF4E7] text-[#42502B]'
              }`}>
                {record.memoryStatus === 'LOCAL' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    LOCAL ONLY
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#5C6E41]" />
                    SHARED ({record.syncStatus})
                  </>
                )}
              </span>

              {onToggleMemoryPolicy && (
                <button
                  onClick={() => onToggleMemoryPolicy(record.id)}
                  className="text-[10px] font-mono border border-[#8B5E3C] px-2 py-1 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FAF7F0] transition-colors"
                >
                  Change Policy
                </button>
              )}
            </div>
          </div>

          {/* Specimen Visual & Technical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              {/* Visual Mode Selector (Real photo vs Sketch) */}
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#7A7062] mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {currentHasPhoto && (
                    <div className="flex bg-[#EAE2D0] p-0.5 border border-[#D5CABB]">
                      <button
                        onClick={() => setViewMode('photo')}
                        className={`px-1.5 py-0.5 text-[9px] font-bold ${
                          viewMode === 'photo' ? 'bg-[#8B5E3C] text-white' : 'text-[#554C41]'
                        }`}
                      >
                        REAL PHOTO
                      </button>
                      <button
                        onClick={() => setViewMode('sketch')}
                        className={`px-1.5 py-0.5 text-[9px] font-bold ${
                          viewMode === 'sketch' ? 'bg-[#8B5E3C] text-white' : 'text-[#554C41]'
                        }`}
                      >
                        SKETCH
                      </button>
                    </div>
                  )}
                  {!currentHasPhoto && <span>Field Specimen Drawing</span>}
                </div>

                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="text-[#8B5E3C] hover:underline flex items-center gap-1 text-[9px] font-bold font-mono"
                  title="Capture or update in-situ photograph"
                >
                  <Camera className="w-3 h-3" />
                  {currentHasPhoto ? 'Retake Photo' : 'Snap Photo'}
                </button>
              </div>

              {/* Visual Display */}
              {currentHasPhoto && viewMode === 'photo' ? (
                <div className="bg-[#FAF7F0] border-2 border-[#5C6E41] p-1.5 shadow-xs">
                  <div className="relative w-full h-56 bg-black flex items-center justify-center overflow-hidden">
                    <img
                      src={record.imageUrl}
                      alt={record.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-[#5C6E41] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider">
                      IN-SITU OPTICAL RECORD
                    </div>
                  </div>
                  <div className="pt-1.5 px-1 flex items-center justify-between text-[10px] font-mono text-[#6B6256] border-t border-[#EAE2D0] mt-1">
                    <span>Grid {record.grid} · Depth {record.depth}m</span>
                    <span className="text-[#5C6E41] font-bold">5 cm scale verified</span>
                  </div>
                </div>
              ) : (
                <ArtifactIllustration
                  type={record.illustrationType}
                  size="detail"
                  caption={`${record.title} · ${record.grid} L${record.layer.replace('L','')}`}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#7A7062] mb-1.5">
                Stratigraphic & Spatial Context
              </div>

              <div className="bg-[#F2ECE0] border border-[#D8CEBD] p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-1.5">
                  <span className="text-[#7A7062] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#8B5E3C]" />
                    Site / Sector
                  </span>
                  <span className="text-[#332E27] font-semibold">
                    {record.site} · Sec {record.sector}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-1.5">
                  <span className="text-[#7A7062] flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-[#8B5E3C]" />
                    Excavation Grid
                  </span>
                  <span className="text-[#A65E3B] font-bold">
                    Grid {record.grid}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-1.5">
                  <span className="text-[#7A7062] flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-[#8B5E3C]" />
                    Layer / Depth
                  </span>
                  <span className="text-[#332E27] font-semibold">
                    Layer {record.layer} · {record.depth} m
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-1.5">
                  <span className="text-[#7A7062]">Condition</span>
                  <span className="text-[#332E27]">
                    {record.condition}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E0D5C3] pb-1.5">
                  <span className="text-[#7A7062] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Recorded Date
                  </span>
                  <span className="text-[#332E27]">
                    {record.recordedAt}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A7062] flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Recorded By
                  </span>
                  <span className="text-[#332E27]">
                    {record.recordedBy}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#7A7062] tracking-wider block mb-1">
                  Field Descriptors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {record.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-mono bg-[#EAE2D0] text-[#554C41] px-2 py-0.5 border border-[#D5CABB]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Field Notes */}
          <div className="border border-[#D8CEBD] bg-[#FFFDF9] p-4 relative">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8B5E3C] mb-1 font-bold">
              Field Notes & Observations
            </div>
            <p className="text-sm font-sans text-[#332E27] leading-relaxed whitespace-pre-line">
              {record.fieldNotes}
            </p>
          </div>

          {/* Related Memory / Semantic Proximity */}
          {relatedRecords.length > 0 && (
            <div className="border-t border-[#E5DDCB] pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#332E27] font-bold">
                  Related Field Discoveries ({relatedRecords.length})
                </span>
                <span className="text-[10px] font-mono text-[#7A7062]">
                  Indexed in local semantic graph
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedRecords.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated && onSelectRelated(rel.id)}
                    className="p-2.5 bg-[#F4EFE4] border border-[#D8CEBD] hover:border-[#8B5E3C] cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[11px] font-mono font-bold text-[#8B5E3C] group-hover:underline">
                        {rel.id} · {rel.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#7A7062] mt-0.5">
                        Grid {rel.grid} · Layer {rel.layer} · {rel.material}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9C8F7C] group-hover:text-[#8B5E3C] transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#EAE2D0] border-t border-[#D8CEBD] px-5 py-3 flex items-center justify-between">
          <div className="text-[10px] font-mono text-[#7A7062]">
            DEMO DATASET · SYNTHETIC FIELD RECORD
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#8B5E3C] hover:bg-[#724B2E] text-[#FAF7F0] text-xs font-mono uppercase tracking-wider font-semibold"
          >
            Close Record
          </button>
        </div>
      </div>

      {/* Field Camera Modal for In-Situ Snapping */}
      <FieldCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        gridContext={record.grid}
        layerContext={record.layer}
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};

