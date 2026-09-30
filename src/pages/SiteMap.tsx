import React, { useState } from 'react';
import { FieldRecord } from '../types/archaeology';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { Map, Layers, Eye, Crosshair, ArrowRight, Filter } from 'lucide-react';

interface SiteMapProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
}

export const SiteMap: React.FC<SiteMapProps> = ({ records, onSelectRecord }) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');
  const [selectedGrid, setSelectedGrid] = useState<string>('B12');

  const rows = ['B', 'C', 'D'];
  const columns = ['10', '11', '12', '13', '14'];

  const filteredRecords = records.filter(r => {
    if (selectedLayer !== 'ALL' && r.layer !== selectedLayer) return false;
    return true;
  });

  const getCellRecords = (gridCode: string) => {
    return filteredRecords.filter(r => r.grid.toUpperCase() === gridCode.toUpperCase());
  };

  const selectedCellRecords = getCellRecords(selectedGrid);
  const primaryRecord = selectedCellRecords.length > 0 ? selectedCellRecords[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Cartographic Datum · Spatial Index
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            SITE MAP: EXCAVATION GRID
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Demo Excavation Site · Sector B Master Stratigraphic Grid
          </p>
        </div>

        {/* Stratum Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-[#EAE2D0] p-1 border border-[#D8CEBD]">
          <span className="text-[10px] text-[#7A7062] px-2 font-bold flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#8B5E3C]" />
            LAYER:
          </span>
          {['ALL', 'L1', 'L2', 'L3', 'L4', 'L5'].map(layer => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`px-2 py-0.5 transition-colors ${
                selectedLayer === layer
                  ? 'bg-[#8B5E3C] text-white font-bold'
                  : 'text-[#554C41] hover:bg-[#DCD2BE]'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large SVG / Grid View */}
        <div className="lg:col-span-8 bg-[#FAF7F0] border-2 border-[#D8CEBD] p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#EAE2D0] pb-2 text-xs font-mono text-[#6B6256]">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#8B5E3C]" />
              <span className="font-bold text-[#332E27]">SECTOR B TRENCH COMPASS</span>
              <span>(Scale 10m × 10m quadrats)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="inline-block w-3 h-3 rounded-full border border-[#A65E3B] bg-[#FAF7F0] text-center text-[9px] leading-none text-[#A65E3B] font-bold">◉</span>
                Artifact
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#5C6E41]"></span>
                Feature / Deposit
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Columns Header */}
              <div className="grid grid-cols-6 gap-2 mb-2 text-center font-mono text-xs font-bold text-[#8B5E3C]">
                <div className="p-2 text-[10px] text-[#A69B88]">SECTOR B</div>
                {columns.map(col => (
                  <div key={col} className="p-2 bg-[#EFE9DB] border border-[#D5CABB]">
                    COL {col}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rows.map(row => (
                <div key={row} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="flex items-center justify-center font-mono font-bold text-sm text-[#8B5E3C] bg-[#EFE9DB] border border-[#D5CABB] h-28">
                    ROW {row}
                  </div>

                  {columns.map(col => {
                    const gridCode = `${row}${col}`;
                    const cellRecords = getCellRecords(gridCode);
                    const isSelected = selectedGrid === gridCode;

                    return (
                      <div
                        key={gridCode}
                        onClick={() => setSelectedGrid(gridCode)}
                        className={`h-28 border-2 p-2 flex flex-col justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#8B5E3C] bg-[#F2ECE0] shadow-md'
                            : 'border-[#D5CABB] bg-[#FAF8F3] hover:bg-[#F4EFE4]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-[#332E27]">{gridCode}</span>
                          {cellRecords.length > 0 && (
                            <span className="bg-[#E2D7C3] px-1.5 py-0.2 rounded-xs font-semibold text-[#8B5E3C] text-[10px]">
                              {cellRecords.length}
                            </span>
                          )}
                        </div>

                        {/* Visual markers representation */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
                          {cellRecords.slice(0, 4).map(rec => (
                            <span
                              key={rec.id}
                              title={`${rec.id} · ${rec.title}`}
                              className={`cursor-pointer ${
                                rec.importance === 'High'
                                  ? 'text-[#A65E3B]'
                                  : rec.material === 'Organic'
                                  ? 'text-[#5C6E41]'
                                  : 'text-[#8B5E3C]'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRecord(rec);
                              }}
                            >
                              {rec.importance === 'High' ? (
                                <span className="inline-block w-4 h-4 rounded-full border border-current bg-white text-center text-[10px] leading-tight font-bold">
                                  ◉
                                </span>
                              ) : (
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-current"></span>
                              )}
                            </span>
                          ))}
                          {cellRecords.length === 0 && (
                            <span className="text-[10px] font-mono text-[#C4B9A3] italic">
                              sterile
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-[#827768]">
                          <span>Sec B</span>
                          <span>{cellRecords.length > 0 ? `${cellRecords[0].layer}` : '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EAE2D0] flex items-center justify-between text-xs font-mono text-[#7A7062]">
            <span>Active Sector: B (Excavation Trenches B10 – D14)</span>
            <span>Spatial datum: Arbitrary Trench Grid 0,0 Benchmark</span>
          </div>
        </div>

        {/* Grid Inspector Panel */}
        <div className="lg:col-span-4 bg-[#FAF7F0] border-2 border-[#D8CEBD] p-5 space-y-4">
          <div className="border-b border-[#D8CEBD] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B5E3C] font-bold">
              Excavation Quadrat Inspector
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#332E27]">
              GRID {selectedGrid}
            </h3>
            <div className="text-xs font-mono text-[#6B6256] mt-1">
              Sector B · Demo Excavation Site · {selectedCellRecords.length} Observations
            </div>
          </div>

          {primaryRecord ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider block mb-1">
                  Representative Field Specimen
                </span>
                <ArtifactIllustration
                  type={primaryRecord.illustrationType}
                  size="sm"
                  className="w-full h-32"
                />
              </div>

              <div className="bg-[#F2ECE0] border border-[#D5CABB] p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
                  <span className="text-[#7A7062]">Recent Finding:</span>
                  <span className="font-bold text-[#8B5E3C]">{primaryRecord.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
                  <span className="text-[#7A7062]">Classification:</span>
                  <span className="font-semibold text-[#332E27]">{primaryRecord.title}</span>
                </div>
                <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
                  <span className="text-[#7A7062]">Active Layer:</span>
                  <span className="text-[#332E27]">{primaryRecord.layer} ({primaryRecord.depth}m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7062]">Material:</span>
                  <span className="text-[#332E27]">{primaryRecord.material}</span>
                </div>
              </div>

              {/* List of all records in this grid */}
              <div>
                <span className="text-xs font-mono font-bold text-[#332E27] uppercase tracking-wider block mb-2">
                  All Records in Grid {selectedGrid} ({selectedCellRecords.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCellRecords.map(rec => (
                    <div
                      key={rec.id}
                      onClick={() => onSelectRecord(rec)}
                      className="p-2 bg-[#F6F1E6] hover:bg-[#EAE2D0] border border-[#D8CEBD] cursor-pointer transition-colors text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#8B5E3C]">{rec.id} · {rec.title}</div>
                        <div className="text-[10px] text-[#7A7062]">{rec.material} · Layer {rec.layer}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#9C8F7C]" />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectRecord(primaryRecord)}
                className="w-full py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Record Details</span>
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-[#827768] space-y-2">
              <div>NO RECORDED FINDS IN GRID {selectedGrid}</div>
              <p className="text-[11px] text-[#A69B88]">
                This 10m × 10m quadrat currently contains no logged catalog entries for the selected filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
