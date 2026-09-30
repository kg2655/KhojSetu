import React, { useState } from 'react';
import { FieldRecord, MaterialType, ConditionType, MemoryStatus, ExcavationLayer } from '../types/archaeology';
import { memoryService } from '../services/memoryService';
import { useToast } from '../components/layout/Toast';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { FieldCameraModal } from '../components/camera/FieldCameraModal';
import { PenTool, Camera, ShieldCheck, Share2, Layers, MapPin, Compass, CheckCircle2, Upload, Trash2, RefreshCw } from 'lucide-react';
import { NavPage } from '../components/layout/Sidebar';

interface RecordFindingProps {
  onRecordCreated: (record: FieldRecord) => void;
  onNavigate: (page: NavPage) => void;
  initialPhoto?: string | null;
}

export const RecordFinding: React.FC<RecordFindingProps> = ({ onRecordCreated, onNavigate, initialPhoto }) => {
  const { showToast } = useToast();

  // Form states
  const [title, setTitle] = useState('');
  const [artifactType, setArtifactType] = useState('');
  const [material, setMaterial] = useState<MaterialType>('Ceramic');
  const [condition, setCondition] = useState<ConditionType>('Fragmented');
  const [site] = useState('Demo Excavation Site');
  const [sector, setSector] = useState('B');
  const [grid, setGrid] = useState('B12');
  const [layer, setLayer] = useState<ExcavationLayer>('L3');
  const [depth, setDepth] = useState<number>(1.8);
  const [fieldNotes, setFieldNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus>('SHARED');
  const [illustrationType, setIllustrationType] = useState<FieldRecord['illustrationType']>('ceramic_painted');
  const [hasSketch, setHasSketch] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string | null>(initialPhoto || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Suggested next ID for preview
  const currentRecords = memoryService.getRecords();
  const highestNum = currentRecords.reduce((max, r) => {
    const match = r.id.match(/ARC-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 128);
  const previewId = `ARC-${String(highestNum + 1).padStart(5, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('VALIDATION ERROR', 'Please enter an object title or descriptive finding name.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    if (!tags.includes(material.toLowerCase())) {
      tags.push(material.toLowerCase());
    }
    if (!tags.includes(layer.toLowerCase())) {
      tags.push(layer.toLowerCase());
    }

    const newRecord = memoryService.addRecord({
      title: title.trim(),
      fieldNotes: fieldNotes.trim() || 'Observed in-situ. Awaiting detailed microscopic fabric analysis.',
      artifactType: artifactType.trim() || `${material} Specimen`,
      material,
      condition,
      period: 'Mid Bronze Age II',
      site,
      sector,
      grid,
      layer,
      depth,
      recordedBy: 'Team Alpha',
      recordedAt: '30 SEP 2026',
      memoryStatus,
      syncStatus: memoryStatus === 'SHARED' ? 'PENDING' : 'LOCAL_ONLY',
      importance: 'High',
      illustrationType,
      hasSketch,
      imageUrl: imageUrl || undefined,
      relatedRecordIds: ['ARC-00124', 'ARC-00087'],
      tags
    });

    setIsSubmitting(false);

    // Archival toast notification
    if (memoryStatus === 'SHARED') {
      showToast(
        'FIELD RECORD SAVED',
        `${newRecord.id} added to local memory with ${imageUrl ? 'real photograph' : 'specimen sketch'}. Queued for knowledge exchange when connectivity returns.`,
        'success'
      );
    } else {
      showToast(
        'FIELD RECORD SAVED (LOCAL)',
        `${newRecord.id} recorded in device memory only. Will not be synchronized.`,
        'info'
      );
    }

    onRecordCreated(newRecord);
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Field Survey Recording Sheet
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            RECORD A NEW FINDING
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Capture the observation before the site moves on.
          </p>
        </div>

        <div className="text-right font-mono text-xs text-[#7A7062] bg-[#FAF7F0] border border-[#D8CEBD] px-3 py-1.5">
          <div>FIELD UNIT: <strong className="text-[#332E27]">UNIT 07</strong></div>
          <div>DATE: <strong className="text-[#332E27]">30 SEP 2026</strong></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Archival Sheet Header */}
        <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DDCB] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#8B5E3C] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                Field Sheet
              </span>
              <span className="font-mono text-sm font-bold text-[#332E27]">
                RECORD NO. {previewId}
              </span>
            </div>

            <div className="text-xs font-mono text-[#6B6256] flex items-center gap-4">
              <span>RESEARCHER: <strong className="text-[#332E27]">Team Alpha</strong></span>
              <span>DATUM: <strong className="text-[#332E27]">Sector B · 142.4m</strong></span>
            </div>
          </div>

          {/* Section 1: SITE CONTEXT */}
          <div className="space-y-4 mb-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>1. Stratigraphic & Spatial Context</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] uppercase text-[#7A7062] mb-1">Site</label>
                <input
                  type="text"
                  value={site}
                  disabled
                  className="w-full bg-[#EFE9DB] border border-[#D5CABB] px-2.5 py-1.5 text-[#554C41]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#7A7062] mb-1">Sector</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-2 py-1.5 text-[#332E27] outline-none"
                >
                  <option value="A">Sector A</option>
                  <option value="B">Sector B</option>
                  <option value="C">Sector C</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#7A7062] mb-1">Excavation Grid</label>
                <select
                  value={grid}
                  onChange={(e) => setGrid(e.target.value)}
                  className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-2 py-1.5 text-[#332E27] font-bold outline-none"
                >
                  <option value="B10">Grid B10</option>
                  <option value="B11">Grid B11</option>
                  <option value="B12">Grid B12</option>
                  <option value="B13">Grid B13</option>
                  <option value="B14">Grid B14</option>
                  <option value="C11">Grid C11</option>
                  <option value="C12">Grid C12</option>
                  <option value="C13">Grid C13</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#7A7062] mb-1">Stratum / Layer</label>
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value as ExcavationLayer)}
                  className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-2 py-1.5 text-[#332E27] font-bold outline-none"
                >
                  <option value="L1">Layer L1 (0.0–0.6m)</option>
                  <option value="L2">Layer L2 (0.6–1.2m)</option>
                  <option value="L3">Layer L3 (1.2–2.0m)</option>
                  <option value="L4">Layer L4 (2.0–2.8m)</option>
                  <option value="L5">Layer L5 (2.8–4.0m)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#7A7062] mb-1">Depth (m)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5.0"
                  value={depth}
                  onChange={(e) => setDepth(parseFloat(e.target.value) || 1.8)}
                  className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-2.5 py-1.5 text-[#332E27] font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: FINDING */}
          <div className="space-y-4 mb-6 pt-4 border-t border-[#EAE2D0]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" />
              <span>2. Artifact Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#332E27] uppercase mb-1">
                  Object Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Painted Ceramic Fragment with Geometric Band"
                  className="w-full bg-[#FFFDF9] border border-[#D8CEBD] focus:border-[#8B5E3C] text-sm font-sans px-3 py-2 text-[#332E27] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#332E27] uppercase mb-1">
                  Artifact Morphology / Subtype
                </label>
                <input
                  type="text"
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                  placeholder="e.g. Painted Ceramic Shard, Lithic Scraper, Vessel Rim"
                  className="w-full bg-[#FFFDF9] border border-[#D8CEBD] focus:border-[#8B5E3C] text-sm font-sans px-3 py-2 text-[#332E27] outline-none"
                />
              </div>
            </div>

            {/* Material Radios */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#7A7062] uppercase mb-1.5">
                Material Classification:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono">
                {(['Ceramic', 'Stone', 'Metal', 'Bone', 'Organic', 'Other'] as MaterialType[]).map(mat => (
                  <label
                    key={mat}
                    className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                      material === mat
                        ? 'border-[#8B5E3C] bg-[#F4EFE4] text-[#332E27] font-bold'
                        : 'border-[#D8CEBD] bg-[#FAF8F3] text-[#6B6256] hover:bg-[#F2EDE2]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="material"
                      checked={material === mat}
                      onChange={() => {
                        setMaterial(mat);
                        if (mat === 'Ceramic') setIllustrationType('ceramic_painted');
                        else if (mat === 'Stone') setIllustrationType('stone_biface');
                        else if (mat === 'Metal') setIllustrationType('bronze_blade');
                        else if (mat === 'Bone') setIllustrationType('bone_awl');
                        else if (mat === 'Organic') setIllustrationType('charcoal');
                      }}
                      className="accent-[#8B5E3C]"
                    />
                    <span>{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition Radios */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#7A7062] uppercase mb-1.5">
                Specimen Condition:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {(['Fragmented', 'Complete', 'Damaged', 'Unknown'] as ConditionType[]).map(c => (
                  <label
                    key={c}
                    className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                      condition === c
                        ? 'border-[#8B5E3C] bg-[#F4EFE4] text-[#332E27] font-bold'
                        : 'border-[#D8CEBD] bg-[#FAF8F3] text-[#6B6256] hover:bg-[#F2EDE2]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === c}
                      onChange={() => setCondition(c)}
                      className="accent-[#8B5E3C]"
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: FIELD NOTES */}
          <div className="space-y-4 mb-6 pt-4 border-t border-[#EAE2D0]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center justify-between">
              <span>3. Field Notes & Stratigraphic Observation</span>
              <span className="text-[10px] text-[#7A7062]">Primary Field Observation</span>
            </div>

            <div>
              <textarea
                rows={4}
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                placeholder="Describe the artifact or observation in detail (fabric inclusions, surface treatment, decoration motifs, relation to surrounding soil or hearth features)..."
                className="w-full bg-[#FFFDF9] border border-[#D8CEBD] focus:border-[#8B5E3C] p-3 text-sm font-sans text-[#332E27] outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#7A7062] mb-1">
                Field Descriptors (Comma separated for semantic indexing)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. geometric, painted, triangular, burnished, red-slip, layer-3"
                className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-3 py-1.5 text-xs font-mono text-[#332E27] outline-none"
              />
            </div>
          </div>

          {/* Section 4: PHOTOGRAPH / FIELD SKETCH */}
          <div className="space-y-4 mb-6 pt-4 border-t border-[#EAE2D0]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#8B5E3C]" />
                <span>4. Real In-Situ Photograph & Field Sketch</span>
              </span>
              <span className="text-[10px] text-[#7A7062]">Optical Sensor & Scale Bar</span>
            </div>

            {/* Camera Action Banner */}
            <div className="bg-[#FAF8F3] border-2 border-[#D8CEBD] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#8B5E3C] text-white">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#332E27] uppercase">
                    Field Camera & Optical Capture
                  </div>
                  <div className="text-[11px] font-sans text-[#6B6256]">
                    Capture real artifact photos in-situ with automatic 5cm scale bar and stratigraphic watermarking.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Field Camera</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Image / Sketch Preview */}
              <div className="sm:col-span-1">
                {imageUrl ? (
                  <div className="relative bg-[#FAF7F0] border-2 border-[#5C6E41] p-1.5 shadow-xs">
                    <img
                      src={imageUrl}
                      alt="Captured archaeological specimen"
                      className="w-full h-36 object-contain bg-black/90"
                    />
                    <div className="mt-1 flex items-center justify-between px-1 text-[10px] font-mono">
                      <span className="text-[#5C6E41] font-bold">✓ REAL PHOTO ATTACHED</span>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="text-[#B34F3F] hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : hasSketch ? (
                  <ArtifactIllustration
                    type={illustrationType}
                    size="sm"
                    className="w-full h-36"
                    caption="Attached Specimen Sketch"
                  />
                ) : (
                  <div className="w-full h-36 bg-[#EFE9DB] border border-[#D5CABB] flex flex-col items-center justify-center p-3 text-center text-xs font-mono text-[#827768]">
                    <span>NO PHOTOGRAPH ATTACHED</span>
                    <span className="text-[9px] text-[#A69B88] mt-1">Click "Open Field Camera" above</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="sm:col-span-2 space-y-3 text-xs font-mono">
                {imageUrl ? (
                  <div className="bg-[#EFF4E7] border border-[#5C6E41] p-3 text-xs font-mono space-y-2">
                    <div className="font-bold text-[#42502B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#5C6E41]" />
                      <span>In-Situ Optical Record Stored</span>
                    </div>
                    <p className="text-[11px] font-sans text-[#55653C] leading-normal">
                      The high-resolution photograph with embedded stratigraphic coordinates and scale bar is attached to this finding.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-3 py-1 bg-[#FAF7F0] border border-[#5C6E41] hover:bg-[#E2ECD6] text-[#42502B] text-[11px] font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="px-2.5 py-1 text-[#B34F3F] hover:underline text-[11px]"
                      >
                        Revert to Sketch
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setHasSketch(!hasSketch)}
                        className="px-3 py-1.5 border border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white transition-colors"
                      >
                        {hasSketch ? 'Remove Sketch' : 'Attach Technical Sketch'}
                      </button>
                      <span className="text-[10px] text-[#7A7062]">
                        Or select technical drawing template:
                      </span>
                    </div>

                    {hasSketch && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          { id: 'ceramic_painted', label: 'Painted Ceramic' },
                          { id: 'stone_biface', label: 'Worked Stone' },
                          { id: 'pottery_rim', label: 'Vessel Rim' },
                          { id: 'bronze_blade', label: 'Bronze Blade' },
                          { id: 'bone_awl', label: 'Bone Awl' },
                          { id: 'bead_necklace', label: 'Bead Ornament' },
                          { id: 'terracotta_figurine', label: 'Clay Figurine' }
                        ].map(tpl => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setIllustrationType(tpl.id as FieldRecord['illustrationType'])}
                            className={`text-[10px] px-2 py-1 border transition-colors ${
                              illustrationType === tpl.id
                                ? 'bg-[#8B5E3C] text-white border-[#724B2E]'
                                : 'bg-[#FAF8F3] text-[#554C41] border-[#D8CEBD] hover:bg-[#EAE2D0]'
                            }`}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: MEMORY POLICY (CRITICAL PRODUCT CONCEPT) */}
          <div className="pt-4 border-t-2 border-[#8B5E3C] bg-[#F2ECE0] p-4 space-y-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E3C] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8B5E3C]" />
                <span>5. Field Memory Policy</span>
              </div>
              <div className="text-xs text-[#6B6256] mt-0.5">
                Where should this field record live?
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <label
                onClick={() => setMemoryStatus('LOCAL')}
                className={`p-3 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  memoryStatus === 'LOCAL'
                    ? 'border-[#8B5E3C] bg-[#FAF7F0] shadow-sm'
                    : 'border-[#D5CABB] bg-[#FAF8F3] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="memoryPolicy"
                    checked={memoryStatus === 'LOCAL'}
                    onChange={() => setMemoryStatus('LOCAL')}
                    className="accent-[#8B5E3C]"
                  />
                  <span className="font-bold text-[#332E27] uppercase tracking-wide">
                    [ LOCAL ONLY ]
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6256] mt-2 leading-relaxed font-sans">
                  Keep this observation on the field device. Will not be sent to central archive during synchronization.
                </p>
              </label>

              <label
                onClick={() => setMemoryStatus('SHARED')}
                className={`p-3 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  memoryStatus === 'SHARED'
                    ? 'border-[#5C6E41] bg-[#EFF4E7] shadow-sm'
                    : 'border-[#D5CABB] bg-[#FAF8F3] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="memoryPolicy"
                    checked={memoryStatus === 'SHARED'}
                    onChange={() => setMemoryStatus('SHARED')}
                    className="accent-[#5C6E41]"
                  />
                  <span className="font-bold text-[#42502B] uppercase tracking-wide">
                    [ SHARE WITH RESEARCH TEAM ]
                  </span>
                </div>
                <p className="text-[11px] text-[#55653C] mt-2 leading-relaxed font-sans">
                  Allow this record to be synchronized into the shared knowledge archive when field connectivity returns.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onNavigate('field-station')}
            className="px-4 py-2 border border-[#D5CABB] hover:bg-[#EAE2D0] text-[#554C41] text-xs font-mono transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Record Discovery</span>
          </button>
        </div>
      </form>

      {/* Real In-Situ Camera Modal */}
      <FieldCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        gridContext={grid}
        layerContext={layer}
        onCapture={(img) => {
          setImageUrl(img);
          setHasSketch(true);
        }}
      />
    </div>
  );
};
