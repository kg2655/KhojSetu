import React, { useState } from 'react';
import { FieldRecord } from '../../types/archaeology';
import { ArtifactIllustration } from '../records/ArtifactIllustration';
import { Eye, ArrowUpRight, Crosshair } from 'lucide-react';

interface ExcavationGridProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
  activeLayer?: string;
  className?: string;
  detailedMode?: boolean; // for SiteMap page vs FieldStation hero
}

export const ExcavationGrid: React.FC<ExcavationGridProps> = ({
  records,
  onSelectRecord,
  activeLayer,
  className = '',
  detailedMode = false
}) => {
  const columns = ['B10', 'B11', 'B12', 'B13', 'B14'];
  const rows = detailedMode ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];

  const [selectedCell, setSelectedCell] = useState<string>('B12');
  const [hoveredRecord, setHoveredRecord] = useState<FieldRecord | null>(null);

  // Filter records by cell coordinate (e.g. "B12")
  const getRecordsInCell = (col: string, row: string) => {
    // A cell coordinate is typically something like "B12", where "B" is row and "12" is column,
    // or Sector B with grids B10-B14 and sub-squares.
    // In our records, grid is formatted as "B10", "B11", "B12", "B13", "B14", "C10", "C11", etc.
    const targetGrid = `${row}${col.replace('B', '')}`;
    return records.filter(r => {
      const matchGrid = r.grid.toUpperCase() === targetGrid.toUpperCase() || r.grid.toUpperCase() === col.toUpperCase();
      const matchLayer = activeLayer ? r.layer === activeLayer : true;
      return matchGrid && matchLayer;
    });
  };

  const selectedCellRecords = records.filter(r => {
    return r.grid.toUpperCase() === selectedCell.toUpperCase() || 
           (selectedCell.length > 2 && r.grid.toUpperCase().includes(selectedCell.substring(1)));
  });

  const previewRecord = hoveredRecord || (selectedCellRecords.length > 0 ? selectedCellRecords[0] : null);

  return (
    <div className={`bg-[#FAF7F0] border-2 border-[#D8CEBD] p-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DDCB] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#8B5E3C]" />
          <div>
            <h3 className="font-serif font-bold text-base text-[#332E27]">
              CURRENT EXCAVATION GRID
            </h3>
            <span className="text-[11px] font-mono text-[#7A7062]">
              Sector B Trench Master · North Bearing 012° · Scale 1:20
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#6B6256]">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#FAF7F0] border-2 border-[#A65E3B] text-[9px] text-[#A65E3B] font-bold">
              ◉
            </span>
            <span>Artifact Discovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5C6E41]"></span>
            <span>Observation / Stratum</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* The Spatial Grid */}
        <div className="lg:col-span-8 overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Column Headers */}
            <div className="grid grid-cols-6 gap-1 mb-1 text-center font-mono text-xs font-semibold text-[#8B5E3C]">
              <div className="p-1 text-[11px] text-[#A69B88]">ROW \ COL</div>
              {columns.map(col => (
                <div key={col} className="p-1 bg-[#EFE9DB] border border-[#DCD2C0]">
                  {col}
                </div>
              ))}
            </div>

            {/* Grid Rows */}
            {rows.map(row => (
              <div key={row} className="grid grid-cols-6 gap-1 mb-1">
                {/* Row Header */}
                <div className="flex items-center justify-center font-mono font-bold text-xs text-[#8B5E3C] bg-[#EFE9DB] border border-[#DCD2C0] w-full h-24">
                  {row}
                </div>

                {/* Grid Cells */}
                {columns.map(col => {
                  const cellId = `${row}${col.replace('B', '')}`;
                  const isSelected = selectedCell === cellId || (selectedCell === col && row === 'B');
                  const cellRecords = getRecordsInCell(col, row);
                  const hasDiscoveries = cellRecords.some(r => r.importance === 'High' || r.material === 'Ceramic' || r.material === 'Metal');
                  const hasObservations = cellRecords.some(r => r.material === 'Organic' || r.material === 'Other' || r.importance === 'Routine');

                  return (
                    <div
                      key={cellId}
                      onClick={() => {
                        setSelectedCell(cellId);
                        if (cellRecords.length > 0) {
                          setHoveredRecord(cellRecords[0]);
                        }
                      }}
                      className={`relative h-24 border cursor-pointer transition-all duration-150 p-1 flex flex-col justify-between ${
                        isSelected
                          ? 'border-2 border-[#8B5E3C] bg-[#F2ECE0] shadow-sm'
                          : 'border-[#DCD2C0] bg-[#FAF8F3] hover:bg-[#F5EFE3]'
                      }`}
                    >
                      {/* Cell Coordinate Tag */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#A69B88]">
                        <span>{row}-{col}</span>
                        {cellRecords.length > 0 && (
                          <span className="font-semibold text-[#8B5E3C] bg-[#E5DDCB] px-1 rounded-xs">
                            {cellRecords.length}
                          </span>
                        )}
                      </div>

                      {/* Markers within cell */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                        {cellRecords.slice(0, 3).map((rec, i) => (
                          <button
                            key={rec.id + i}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRecord(rec);
                            }}
                            onMouseEnter={() => setHoveredRecord(rec)}
                            title={`${rec.id} · ${rec.title}`}
                            className={`transition-transform hover:scale-125 ${
                              rec.importance === 'High'
                                ? 'text-[#A65E3B]'
                                : rec.material === 'Organic'
                                ? 'text-[#5C6E41]'
                                : 'text-[#8B5E3C]'
                            }`}
                          >
                            {rec.importance === 'High' ? (
                              <span className="inline-block w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold leading-none bg-[#FAF7F0]">
                                ◉
                              </span>
                            ) : (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-current"></span>
                            )}
                          </button>
                        ))}

                        {cellRecords.length > 3 && (
                          <span className="text-[9px] font-mono text-[#8B5E3C]">
                            +{cellRecords.length - 3}
                          </span>
                        )}

                        {cellRecords.length === 0 && (
                          <div className="text-[10px] font-mono text-[#C4B9A3] italic">
                            unexcavated
                          </div>
                        )}
                      </div>

                      {/* Stratum indicator */}
                      <div className="text-[9px] font-mono text-[#7A7062] flex items-center justify-between">
                        <span>L3 datum</span>
                        <span className="text-[8px] text-[#A69B88]">10×10m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#827768]">
            <span>Click any cell to inspect discoveries. Hover markers to preview field specimen.</span>
            <span>Spatial datum: WGS-84 / Trench B Datum Elevation 142.4m</span>
          </div>
        </div>

        {/* Selected Cell / Record Preview Panel */}
        <div className="lg:col-span-4 bg-[#F2ECE0] border border-[#D8CEBD] p-4 flex flex-col justify-between self-stretch">
          <div>
            <div className="flex items-center justify-between border-b border-[#D8CEBD] pb-2 mb-3">
              <span className="text-xs font-mono font-bold text-[#8B5E3C] uppercase tracking-wider">
                Cell Detail: {selectedCell}
              </span>
              <span className="text-[10px] font-mono bg-[#E0D5C3] px-2 py-0.5 text-[#332E27]">
                {selectedCellRecords.length} Records in Sector B
              </span>
            </div>

            {previewRecord ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#A65E3B]">
                      {previewRecord.id}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#332E27] leading-tight">
                      {previewRecord.title}
                    </h4>
                    <div className="text-[11px] font-mono text-[#6B6256] mt-0.5">
                      GRID {previewRecord.grid} · LAYER {previewRecord.layer} · {previewRecord.depth}m
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <ArtifactIllustration
                    type={previewRecord.illustrationType}
                    size="sm"
                    className="w-full h-28"
                  />
                </div>

                <p className="text-xs font-sans text-[#554C41] line-clamp-3 leading-relaxed bg-[#FAF7F0] p-2 border border-[#E0D5C3]">
                  {previewRecord.fieldNotes}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#7A7062] pt-1">
                  <span>Material: {previewRecord.material}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] uppercase ${
                    previewRecord.memoryStatus === 'LOCAL' ? 'bg-[#E5DDCB]' : 'bg-[#EFF4E7] text-[#42502B]'
                  }`}>
                    {previewRecord.memoryStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-[#827768] space-y-1">
                <div>NO ACTIVE OBSERVATION IN CELL</div>
                <div className="text-[10px] text-[#A69B88]">Select a square with markers above</div>
              </div>
            )}
          </div>

          {previewRecord && (
            <button
              onClick={() => onSelectRecord(previewRecord)}
              className="mt-4 w-full py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-[#FAF7F0] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Open Field Record
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
