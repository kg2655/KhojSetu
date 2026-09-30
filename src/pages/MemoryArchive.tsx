import React, { useState, useMemo } from 'react';
import { FieldRecord, MaterialType, ExcavationLayer } from '../types/archaeology';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { Search, Filter, ShieldCheck, Share2, Eye, Calendar, Layers, MapPin, X } from 'lucide-react';

interface MemoryArchiveProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
  initialQuery?: string;
}

export const MemoryArchive: React.FC<MemoryArchiveProps> = ({
  records,
  onSelectRecord,
  initialQuery = ''
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'LOCAL' | 'SHARED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filter tab
      if (filterTab === 'LOCAL' && record.memoryStatus !== 'LOCAL') return false;
      if (filterTab === 'SHARED' && record.memoryStatus !== 'SHARED') return false;
      if (filterTab === 'PENDING' && record.syncStatus !== 'PENDING') return false;

      // Dropdown filters
      if (selectedLayer !== 'ALL' && record.layer !== selectedLayer) return false;
      if (selectedMaterial !== 'ALL' && record.material !== selectedMaterial) return false;
      if (selectedSector !== 'ALL' && record.sector !== selectedSector) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = record.id.toLowerCase().includes(q);
        const matchesTitle = record.title.toLowerCase().includes(q);
        const matchesNotes = record.fieldNotes.toLowerCase().includes(q);
        const matchesGrid = record.grid.toLowerCase().includes(q);
        const matchesMaterial = record.material.toLowerCase().includes(q);
        const matchesTags = record.tags.some(t => t.toLowerCase().includes(q));
        return matchesId || matchesTitle || matchesNotes || matchesGrid || matchesMaterial || matchesTags;
      }

      return true;
    });
  }, [records, filterTab, searchQuery, selectedLayer, selectedMaterial, selectedSector]);

  const clearFilters = () => {
    setFilterTab('ALL');
    setSearchQuery('');
    setSelectedLayer('ALL');
    setSelectedMaterial('ALL');
    setSelectedSector('ALL');
  };

  const hasActiveFilters = filterTab !== 'ALL' || searchQuery !== '' || selectedLayer !== 'ALL' || selectedMaterial !== 'ALL' || selectedSector !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Field Unit Catalog & Repository
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            MEMORY ARCHIVE
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Everything this field unit remembers ({records.length} total entries stored locally).
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono bg-[#EAE2D0] p-1 border border-[#D8CEBD]">
          {(['ALL', 'LOCAL', 'SHARED', 'PENDING'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 font-semibold transition-colors ${
                filterTab === tab
                  ? 'bg-[#8B5E3C] text-white shadow-xs'
                  : 'text-[#554C41] hover:bg-[#DCD2BE]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#FAF7F0] border-2 border-[#D8CEBD] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search field records by ID, title, description, grid, or tags..."
              className="w-full bg-[#FAF8F3] border border-[#D8CEBD] focus:border-[#8B5E3C] px-3 py-2 pl-9 text-xs font-mono text-[#332E27] outline-none"
            />
            <Search className="w-4 h-4 text-[#8B5E3C] absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#9C8F7C] hover:text-[#332E27]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-mono text-[#B34F3F] hover:underline px-2 py-1 shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Granular Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono pt-1 border-t border-[#EAE2D0]">
          <div>
            <label className="text-[10px] uppercase text-[#7A7062] block mb-1">Layer / Stratum</label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1.5 text-[#332E27] outline-none"
            >
              <option value="ALL">All Layers</option>
              <option value="L1">Layer L1 (0.0–0.6m)</option>
              <option value="L2">Layer L2 (0.6–1.2m)</option>
              <option value="L3">Layer L3 (1.2–2.0m)</option>
              <option value="L4">Layer L4 (2.0–2.8m)</option>
              <option value="L5">Layer L5 (2.8–4.0m)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#7A7062] block mb-1">Material</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1.5 text-[#332E27] outline-none"
            >
              <option value="ALL">All Materials</option>
              <option value="Ceramic">Ceramic</option>
              <option value="Stone">Stone / Lithic</option>
              <option value="Metal">Metal</option>
              <option value="Bone">Bone / Faunal</option>
              <option value="Organic">Organic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#7A7062] block mb-1">Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1.5 text-[#332E27] outline-none"
            >
              <option value="ALL">All Sectors</option>
              <option value="A">Sector A</option>
              <option value="B">Sector B</option>
              <option value="C">Sector C</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="bg-[#EFE9DB] border border-[#D5CABB] w-full p-1.5 text-center text-[11px] font-semibold text-[#8B5E3C]">
              {filteredRecords.length} Records Shown
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              className="bg-[#FAF7F0] border-2 border-[#D8CEBD] hover:border-[#8B5E3C] p-4 flex flex-col justify-between transition-colors shadow-xs"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-center justify-between text-xs font-mono border-b border-[#EAE2D0] pb-2 mb-3">
                  <span className="font-bold text-[#8B5E3C] tracking-wider">
                    {record.id}
                  </span>
                  <span className="bg-[#EFE9DB] px-1.5 py-0.5 text-[#554C41] text-[11px]">
                    Grid {record.grid} · Layer {record.layer}
                  </span>
                </div>

                <div className="flex gap-3 mb-3">
                  <div className="w-20 h-20 shrink-0">
                    <ArtifactIllustration
                      type={record.illustrationType}
                      size="sm"
                      className="w-full h-full p-1"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-sm text-[#332E27] leading-snug line-clamp-2">
                      {record.title}
                    </h3>
                    <div className="text-[10px] font-mono text-[#8B5E3C] uppercase mt-1">
                      {record.artifactType}
                    </div>
                    <div className="text-[10px] font-mono text-[#7A7062] mt-0.5">
                      {record.material} · {record.condition}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-sans text-[#554C41] line-clamp-3 leading-relaxed bg-[#FAF8F3] p-2 border border-[#EFE9DB] mb-3">
                  {record.fieldNotes}
                </p>

                {/* Spatial datum tag */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#7A7062] border-t border-[#EAE2D0] pt-2 mb-2">
                  <span>Depth: {record.depth} m</span>
                  <span>Recorded: {record.recordedAt}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-[#EAE2D0] flex items-center justify-between text-xs font-mono">
                <span className={`text-[10px] px-2 py-0.5 border flex items-center gap-1 ${
                  record.memoryStatus === 'LOCAL'
                    ? 'border-[#D5CABB] bg-[#F2EDE2] text-[#6B6256]'
                    : 'border-[#5C6E41] bg-[#EFF4E7] text-[#42502B]'
                }`}>
                  {record.memoryStatus === 'LOCAL' ? (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      LOCAL
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 text-[#5C6E41]" />
                      SHARED ({record.syncStatus})
                    </>
                  )}
                </span>

                <button
                  onClick={() => onSelectRecord(record)}
                  className="px-2.5 py-1 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white border border-[#8B5E3C] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Open Record</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#FAF7F0] border-2 border-dashed border-[#D5CABB] p-12 text-center space-y-3 font-mono">
          <div className="text-sm font-bold text-[#8B5E3C] uppercase tracking-wider">
            NO RECORDS FOUND
          </div>
          <p className="text-xs text-[#7A7062] max-w-sm mx-auto font-sans leading-relaxed">
            No matching observations in local memory for the active filters. Adjust your query or clear the active stratum selection.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-1.5 bg-[#8B5E3C] text-white text-xs font-mono uppercase tracking-wider font-bold"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
