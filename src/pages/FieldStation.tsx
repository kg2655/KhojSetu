import React from 'react';
import { FieldRecord } from '../types/archaeology';
import { ExcavationGrid } from '../components/excavation/ExcavationGrid';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { ArrowUpRight, Eye, ShieldCheck, Share2, Layers, BookOpen, AlertCircle } from 'lucide-react';
import { NavPage } from '../components/layout/Sidebar';

interface FieldStationProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
  onNavigate: (page: NavPage) => void;
  stats: {
    totalRecords: number;
    todayObservations: number;
    pendingExchange: number;
    activeLayer: string;
  };
}

export const FieldStation: React.FC<FieldStationProps> = ({
  records,
  onSelectRecord,
  onNavigate,
  stats
}) => {
  // 6 most recent records
  const recentRecords = records.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Sector B · Demo Excavation Site · Field Unit 07
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            FIELD STATION
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Local archaeological memory for field research.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('record-finding')}
            className="px-3 py-1.5 bg-[#8B5E3C] hover:bg-[#724B2E] text-[#FAF7F0] text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            + Record Finding
          </button>
          <button
            onClick={() => onNavigate('ask-field-archive')}
            className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#F2ECE0] text-[#332E27] border border-[#D8CEBD] text-xs font-mono font-semibold transition-colors"
          >
            Ask Field Archive
          </button>
        </div>
      </div>

      {/* Subtle Product Concept Statement */}
      <div className="bg-[#FAF7F0] border-l-3 border-[#8B5E3C] p-3 text-xs font-mono text-[#6B6256] flex items-center justify-between gap-4">
        <p className="leading-relaxed">
          <strong className="text-[#332E27]">KHOJSETU PRINCIPLE:</strong> Connecting discoveries across the field. Local memory stays close to the trench, remaining semantically searchable without connectivity, and selected observations are exchanged with the shared archive when a connection returns.
        </p>
        <span className="hidden md:inline-block text-[10px] text-[#A65E3B] font-bold shrink-0 uppercase tracking-widest">
          Autonomous Node
        </span>
      </div>

      {/* Main Excavation Area: Grid Visualization */}
      <ExcavationGrid
        records={records}
        onSelectRecord={onSelectRecord}
        activeLayer="L3"
      />

      {/* Archival Field Station Summary Blocks */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#7A7062] mb-2 font-bold">
          Field Ledger Summary
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider">
              Local Memory
            </span>
            <div className="my-1.5">
              <span className="text-3xl font-serif font-black text-[#332E27]">
                {stats.totalRecords}
              </span>
              <span className="text-[11px] font-mono text-[#8B5E3C] ml-1.5">records</span>
            </div>
            <span className="text-[10px] font-mono text-[#9C8F7C]">
              Indexed on device
            </span>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider">
              Today's Session
            </span>
            <div className="my-1.5">
              <span className="text-3xl font-serif font-black text-[#332E27]">
                {stats.todayObservations}
              </span>
              <span className="text-[11px] font-mono text-[#8B5E3C] ml-1.5">observations</span>
            </div>
            <span className="text-[10px] font-mono text-[#9C8F7C]">
              Logged by Team Alpha
            </span>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider">
                Pending Exchange
              </span>
              {stats.pendingExchange > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#B34F3F]"></span>
              )}
            </div>
            <div className="my-1.5">
              <span className={`text-3xl font-serif font-black ${stats.pendingExchange > 0 ? 'text-[#B34F3F]' : 'text-[#5C6E41]'}`}>
                {stats.pendingExchange}
              </span>
              <span className="text-[11px] font-mono text-[#8B5E3C] ml-1.5">records</span>
            </div>
            <span className="text-[10px] font-mono text-[#9C8F7C]">
              Waiting for uplink
            </span>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CEBD] p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider">
              Current Stratum
            </span>
            <div className="my-1.5">
              <span className="text-3xl font-serif font-black text-[#8B5E3C]">
                {stats.activeLayer}
              </span>
              <span className="text-[11px] font-mono text-[#332E27] ml-1.5">active horizon</span>
            </div>
            <span className="text-[10px] font-mono text-[#9C8F7C]">
              Depth: 1.6m – 2.0m
            </span>
          </div>
        </div>
      </div>

      {/* Recent Field Records Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#D8CEBD] pb-2">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#332E27]">
              RECENT FIELD RECORDS
            </h3>
            <span className="text-[11px] font-mono text-[#7A7062]">
              Latest observations recorded into local memory
            </span>
          </div>
          <button
            onClick={() => onNavigate('memory-archive')}
            className="text-xs font-mono text-[#8B5E3C] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View Full Archive ({records.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRecords.map(record => (
            <div
              key={record.id}
              className="bg-[#FAF7F0] border border-[#D8CEBD] hover:border-[#8B5E3C] p-4 flex flex-col justify-between transition-colors shadow-xs"
            >
              <div>
                {/* Catalog Index & Layer */}
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#EAE2D0] pb-2 mb-2.5">
                  <span className="font-bold text-[#8B5E3C] tracking-wider">
                    {record.id}
                  </span>
                  <span className="bg-[#EFE9DB] px-1.5 py-0.5 text-[#554C41]">
                    FIELD {record.layer} · GRID {record.grid}
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
                    <h4 className="font-serif font-bold text-sm text-[#332E27] leading-tight line-clamp-2">
                      {record.title}
                    </h4>
                    <div className="text-[10px] font-mono uppercase text-[#7A7062] mt-1">
                      {record.artifactType}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-sans text-[#554C41] line-clamp-2 leading-relaxed bg-[#FAF8F3] p-2 border border-[#EFE9DB] mb-3">
                  {record.fieldNotes}
                </p>

                {/* Metadata pills */}
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#7A7062] mb-3">
                  <div>
                    <span className="text-[#A69B88] block text-[9px] uppercase">MATERIAL</span>
                    <span className="text-[#332E27] font-semibold">{record.material}</span>
                  </div>
                  <div>
                    <span className="text-[#A69B88] block text-[9px] uppercase">LAYER</span>
                    <span className="text-[#332E27] font-semibold">{record.layer} ({record.depth}m)</span>
                  </div>
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
                      SHARED
                    </>
                  )}
                </span>

                <button
                  onClick={() => onSelectRecord(record)}
                  className="px-2.5 py-1 text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-[#FAF7F0] border border-[#8B5E3C] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Open Record</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
