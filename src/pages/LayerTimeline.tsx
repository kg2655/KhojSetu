import React, { useState } from 'react';
import { FieldRecord, ExcavationLayer } from '../types/archaeology';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { Layers, ArrowDown, Eye, Calendar, Sparkles, Filter } from 'lucide-react';

interface LayerTimelineProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
}

interface StratumDefinition {
  layer: ExcavationLayer;
  depthRange: string;
  geologicalTitle: string;
  sedimentDescription: string;
  chronology: string;
  colorSwatch: string;
  sampleFinds: string[];
}

const STRATA: StratumDefinition[] = [
  {
    layer: 'L1',
    depthRange: '0.00 – 0.60 m',
    geologicalTitle: 'Humic Topsoil & Post-Abandonment Aeolian Silt',
    sedimentDescription: 'Loose, friable dark grey-brown humic matrix with root bioturbation. Residual microlithic flakes and intrusive historical ceramic bits.',
    chronology: 'Epipalaeolithic to Recent Colluvium',
    colorSwatch: '#8A7E6C',
    sampleFinds: ['Flint Micro-blade Core', 'Microlithic Arrowhead', 'Obsidian Flake']
  },
  {
    layer: 'L2',
    depthRange: '0.60 – 1.20 m',
    geologicalTitle: 'Light Brown Silt Loam & Compact Hearth Fill',
    sedimentDescription: 'Moderately compact reddish-brown silty loam containing dispersed ash lenses, fire-cracked stones, and grinding implements.',
    chronology: 'Early Bronze Age III (ca. 2400–2000 BCE)',
    colorSwatch: '#9C8567',
    sampleFinds: ['Polished Stone Adze', 'Red Slip Bowl Rim', 'Basalt Grinding Slab']
  },
  {
    layer: 'L3',
    depthRange: '1.20 – 2.00 m',
    geologicalTitle: 'Dense Anthropic Midden & Architectural Floor Surface',
    sedimentDescription: 'Active occupation horizon. Packed mud-brick decay, dense charcoal deposits, fine decorated ceramic concentrations, and faunal refuse.',
    chronology: 'Middle Bronze Age II (ca. 1800–1600 BCE)',
    colorSwatch: '#7F5E44',
    sampleFinds: ['Painted Ceramic Fragment', 'Decorated Pottery', 'Bone Awl', 'Charcoal Hearth']
  },
  {
    layer: 'L4',
    depthRange: '2.00 – 2.80 m',
    geologicalTitle: 'Foundational Masonry Fill & Rubble Horizon',
    sedimentDescription: 'Heavy compact clay with crushed limestone architectural debris, large storage pithoi shards, and bronze metalwork.',
    chronology: 'Late Bronze Age I (ca. 1550–1400 BCE)',
    colorSwatch: '#684E39',
    sampleFinds: ['Bronze Knife Blade', 'Limestone Plinth', 'Storage Pithos', 'Clay Sealing']
  },
  {
    layer: 'L5',
    depthRange: '2.80 – 4.00 m',
    geologicalTitle: 'Basal Virgin Clay & Fluvial Bedrock Interface',
    sedimentDescription: 'Dense sterile yellowish-red alluvial clay overlying limestone bedrock shelf. Sterile of anthropic cultural remains.',
    chronology: 'Pre-Settlement Geologic Substratum',
    colorSwatch: '#543F2E',
    sampleFinds: ['Sterile geological samples', 'Sediment core']
  }
];

export const LayerTimeline: React.FC<LayerTimelineProps> = ({ records, onSelectRecord }) => {
  const [activeLayer, setActiveLayer] = useState<ExcavationLayer>('L3');

  const layerRecords = records.filter(r => r.layer === activeLayer);
  const activeStratum = STRATA.find(s => s.layer === activeLayer) || STRATA[2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Stratigraphic Column · Chronological Section
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            LAYER TIMELINE
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Read the site's memory through excavation depth and geological strata.
          </p>
        </div>

        <div className="bg-[#FAF7F0] border border-[#D8CEBD] px-3 py-1 font-mono text-xs text-[#7A7062]">
          ACTIVE DATUM: <strong className="text-[#8B5E3C]">LAYER {activeLayer}</strong> ({layerRecords.length} records)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vertical Stratigraphic Column */}
        <div className="lg:col-span-5 bg-[#FAF7F0] border-2 border-[#D8CEBD] p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#EAE2D0] pb-2 text-xs text-[#7A7062]">
            <span className="font-bold text-[#332E27] uppercase">Stratigraphic Profile (Trench B)</span>
            <span className="text-[10px]">Excavation Depth ↓</span>
          </div>

          <div className="space-y-2">
            {STRATA.map(stratum => {
              const isSelected = activeLayer === stratum.layer;
              const countInLayer = records.filter(r => r.layer === stratum.layer).length;

              return (
                <div
                  key={stratum.layer}
                  onClick={() => setActiveLayer(stratum.layer)}
                  className={`border-2 p-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-[#8B5E3C] bg-[#F2ECE0] shadow-md -translate-x-1'
                      : 'border-[#D5CABB] bg-[#FAF8F3] hover:bg-[#F4EFE4]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-10 border border-[#332E27]/30 shrink-0"
                        style={{ backgroundColor: stratum.colorSwatch }}
                      ></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-black text-lg text-[#332E27]">
                            {stratum.layer}
                          </span>
                          <span className="text-[11px] text-[#8B5E3C] font-bold">
                            {stratum.depthRange}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#554C41] truncate max-w-[200px]">
                          {stratum.geologicalTitle}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 font-bold ${
                      isSelected ? 'bg-[#8B5E3C] text-white' : 'bg-[#EAE2D0] text-[#554C41]'
                    }`}>
                      {countInLayer} finds
                    </span>
                  </div>

                  <div className="text-[10px] text-[#7A7062] mt-2 pt-1 border-t border-[#EAE2D0] flex items-center justify-between">
                    <span>{stratum.chronology}</span>
                    <span className="text-[#8B5E3C] font-semibold">{isSelected ? 'Active Focus' : 'Select'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-[#827768] text-center border-t border-[#EAE2D0]">
            Harris Matrix Stratigraphic Law: Superposition Principle Active
          </div>
        </div>

        {/* Stratum Details & Associated Discoveries */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stratum Profile Header */}
          <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE2D0] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B5E3C] font-bold">
                  Stratum Details · Trench Sector B
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#332E27]">
                  LAYER {activeStratum.layer}: {activeStratum.depthRange}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#554C41] bg-[#EFE9DB] px-2.5 py-1 border border-[#D5CABB]">
                {activeStratum.chronology}
              </span>
            </div>

            <p className="text-xs font-sans text-[#554C41] leading-relaxed bg-[#FAF8F3] p-3 border border-[#EFE9DB]">
              {activeStratum.sedimentDescription}
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-[#7A7062]">
              <span className="font-bold text-[#8B5E3C]">Stratum Index Finds:</span>
              <span>{activeStratum.sampleFinds.join(' · ')}</span>
            </div>
          </div>

          {/* Associated Discoveries in this Layer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D8CEBD] pb-2 text-xs font-mono">
              <span className="font-bold text-[#332E27] uppercase tracking-wider">
                Discoveries Recovered in Layer {activeLayer} ({layerRecords.length})
              </span>
              <span className="text-[#7A7062]">
                Ranked by in-situ excavation depth
              </span>
            </div>

            {layerRecords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {layerRecords.map(record => (
                  <div
                    key={record.id}
                    onClick={() => onSelectRecord(record)}
                    className="bg-[#FAF7F0] border border-[#D8CEBD] hover:border-[#8B5E3C] p-3 cursor-pointer transition-colors flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#EAE2D0] pb-1.5 mb-2">
                        <span className="font-bold text-[#8B5E3C] group-hover:underline">
                          {record.id}
                        </span>
                        <span className="bg-[#EFE9DB] px-1.5 py-0.2 text-[#554C41]">
                          Grid {record.grid} · {record.depth}m
                        </span>
                      </div>

                      <div className="flex gap-2.5 mb-2">
                        <div className="w-14 h-14 shrink-0">
                          <ArtifactIllustration
                            type={record.illustrationType}
                            size="sm"
                            className="w-full h-full p-0.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-xs text-[#332E27] leading-snug line-clamp-2">
                            {record.title}
                          </h4>
                          <div className="text-[10px] font-mono text-[#7A7062] mt-0.5">
                            {record.material} · {record.condition}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] font-sans text-[#6B6256] line-clamp-2 leading-relaxed">
                        {record.fieldNotes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#EAE2D0] mt-2 flex items-center justify-between text-[10px] font-mono text-[#7A7062]">
                      <span>{record.memoryStatus}</span>
                      <span className="text-[#8B5E3C] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open <Eye className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FAF7F0] border-2 border-dashed border-[#D5CABB] p-8 text-center text-xs font-mono text-[#7A7062]">
                NO LOGGED SPECIMENS IN LAYER {activeLayer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
