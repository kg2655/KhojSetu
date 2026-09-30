import React, { useState } from 'react';
import { FieldRecord } from '../types/archaeology';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { Network, Eye, ArrowRight, Share2, Layers, Compass, Sparkles } from 'lucide-react';

interface RelationshipsProps {
  records: FieldRecord[];
  onSelectRecord: (record: FieldRecord) => void;
}

interface GraphNode {
  record: FieldRecord;
  relationshipLabel: string;
  connectionType: 'similar' | 'layer' | 'material' | 'grid';
  x: number;
  y: number;
}

export const Relationships: React.FC<RelationshipsProps> = ({ records, onSelectRecord }) => {
  // Center focal record, defaults to ARC-00124
  const [centerId, setCenterId] = useState<string>('ARC-00124');

  const centerRecord = records.find(r => r.id === centerId) || records[0];

  // Derive connected nodes based on relationships, layer, material, grid
  const connectedNodes: GraphNode[] = React.useMemo(() => {
    if (!centerRecord) return [];

    const candidates = records.filter(r => r.id !== centerRecord.id);

    // Score and label connections
    const scored = candidates.map(cand => {
      let label = 'SIMILAR';
      let type: GraphNode['connectionType'] = 'similar';
      let score = 0;

      const isRelatedExplicit = centerRecord.relatedRecordIds.includes(cand.id);
      const isSameLayer = centerRecord.layer === cand.layer;
      const isSameMaterial = centerRecord.material === cand.material;
      const isNearbyGrid = centerRecord.grid.charAt(0) === cand.grid.charAt(0);

      if (isRelatedExplicit) {
        label = 'SEMANTIC PROXIMITY';
        type = 'similar';
        score += 50;
      }
      if (isSameLayer) {
        if (!isRelatedExplicit) {
          label = 'SAME LAYER';
          type = 'layer';
        }
        score += 25;
      }
      if (isSameMaterial) {
        if (!isRelatedExplicit && !isSameLayer) {
          label = 'SAME MATERIAL';
          type = 'material';
        }
        score += 20;
      }
      if (isNearbyGrid) {
        if (!isRelatedExplicit && !isSameLayer && !isSameMaterial) {
          label = 'NEARBY GRID';
          type = 'grid';
        }
        score += 15;
      }

      return {
        record: cand,
        score,
        relationshipLabel: label,
        connectionType: type
      };
    });

    // Pick top 6 connected nodes
    const top6 = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // Arrange in circle around center (350, 250 in a 700x500 svg space)
    const centerX = 350;
    const centerY = 250;
    const radius = 175;

    return top6.map((item, index) => {
      const angle = (index / top6.length) * 2 * Math.PI - Math.PI / 2;
      return {
        record: item.record,
        relationshipLabel: item.relationshipLabel,
        connectionType: item.connectionType,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }, [centerRecord, records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Semantic Graph Projection
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            MEMORY RELATIONSHIPS
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Explore connections between field discoveries across strata, materials, and spatial coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#7A7062]">Focus Specimen:</span>
          <select
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            className="bg-[#FAF7F0] border border-[#D8CEBD] p-1 text-[#332E27] font-bold outline-none"
          >
            {records.map(r => (
              <option key={r.id} value={r.id}>
                {r.id} · {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Graph View */}
        <div className="lg:col-span-8 bg-[#FAF7F0] border-2 border-[#D8CEBD] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 text-xs font-mono text-[#7A7062] border-b border-[#EAE2D0] pb-2">
            <div className="flex items-center gap-1.5">
              <Network className="w-4 h-4 text-[#8B5E3C]" />
              <span className="font-bold text-[#332E27]">ARCHIVAL ASSOCIATION GRAPH</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#8B5E3C]"></span>
                Similar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#5C6E41]"></span>
                Same Layer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-[#A65E3B]"></span>
                Material / Grid
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="w-full h-[480px] relative bg-[#FAF8F3] border border-[#EAE2D0] flex items-center justify-center">
            <svg viewBox="0 0 700 500" className="w-full h-full">
              {/* Grid Background */}
              <defs>
                <pattern id="archaeoGraphGrid" width="35" height="35" patternUnits="userSpaceOnUse">
                  <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#E5DDCB" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="700" height="500" fill="url(#archaeoGraphGrid)" />

              {/* Edge lines */}
              {connectedNodes.map((node, i) => {
                const strokeColor =
                  node.connectionType === 'similar' ? '#8B5E3C' :
                  node.connectionType === 'layer' ? '#5C6E41' :
                  node.connectionType === 'material' ? '#A65E3B' : '#7A7062';

                return (
                  <g key={`edge-${i}`}>
                    <line
                      x1={350}
                      y1={250}
                      x2={node.x}
                      y2={node.y}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray={node.connectionType === 'grid' ? '4 3' : undefined}
                    />
                    {/* Relationship badge in midpoint */}
                    <g transform={`translate(${(350 + node.x) / 2}, ${(250 + node.y) / 2})`}>
                      <rect
                        x="-48"
                        y="-9"
                        width="96"
                        height="18"
                        fill="#FAF7F0"
                        stroke={strokeColor}
                        strokeWidth="1"
                        rx="2"
                      />
                      <text
                        textAnchor="middle"
                        y="3"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono"
                        fontWeight="bold"
                        fill="#332E27"
                      >
                        {node.relationshipLabel}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Central Focal Node */}
              <g transform="translate(350, 250)">
                <circle r="46" fill="#F4EFE4" stroke="#8B5E3C" strokeWidth="3" />
                <circle r="40" fill="#FAF7F0" stroke="#8B5E3C" strokeWidth="1" strokeDasharray="3 2" />
                <text textAnchor="middle" y="-12" fontSize="10" fontFamily="IBM Plex Mono" fontWeight="bold" fill="#8B5E3C">
                  {centerRecord.id}
                </text>
                <text textAnchor="middle" y="2" fontSize="9.5" fontFamily="Source Serif 4" fontWeight="bold" fill="#332E27">
                  {centerRecord.title.substring(0, 16)}...
                </text>
                <text textAnchor="middle" y="16" fontSize="8.5" fontFamily="IBM Plex Mono" fill="#7A7062">
                  {centerRecord.grid} · {centerRecord.layer}
                </text>
              </g>

              {/* Satellite Connected Nodes */}
              {connectedNodes.map((node, idx) => (
                <g
                  key={`node-${node.record.id}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => setCenterId(node.record.id)}
                >
                  <circle r="36" fill="#FAF7F0" stroke="#BDB29F" strokeWidth="2" />
                  <text textAnchor="middle" y="-10" fontSize="9.5" fontFamily="IBM Plex Mono" fontWeight="bold" fill="#8B5E3C">
                    {node.record.id}
                  </text>
                  <text textAnchor="middle" y="3" fontSize="8.5" fontFamily="Source Serif 4" fontWeight="600" fill="#332E27">
                    {node.record.title.substring(0, 14)}..
                  </text>
                  <text textAnchor="middle" y="16" fontSize="8" fontFamily="IBM Plex Mono" fill="#7A7062">
                    {node.record.layer} · {node.record.material}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#7A7062]">
            <span>Click any peripheral node to re-center the semantic graph.</span>
            <span>Cluster affinity: Weighted Euclidean vector projection</span>
          </div>
        </div>

        {/* Selected Record Information & Actions */}
        <div className="lg:col-span-4 bg-[#FAF7F0] border-2 border-[#D8CEBD] p-5 space-y-4">
          <div className="border-b border-[#D8CEBD] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B5E3C] font-bold">
              Active Graph Center
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="font-serif text-xl font-bold text-[#332E27]">
                {centerRecord.title}
              </h3>
            </div>
            <div className="text-xs font-mono text-[#8B5E3C] font-semibold mt-0.5">
              {centerRecord.id} · {centerRecord.material}
            </div>
          </div>

          <div>
            <ArtifactIllustration
              type={centerRecord.illustrationType}
              size="sm"
              className="w-full h-32"
            />
          </div>

          <div className="bg-[#F2ECE0] p-3 border border-[#D5CABB] text-xs font-mono space-y-1.5">
            <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
              <span className="text-[#7A7062]">Spatial Grid:</span>
              <span className="font-bold text-[#332E27]">Grid {centerRecord.grid}</span>
            </div>
            <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
              <span className="text-[#7A7062]">Excavation Layer:</span>
              <span className="font-bold text-[#332E27]">Layer {centerRecord.layer} ({centerRecord.depth}m)</span>
            </div>
            <div className="flex justify-between border-b border-[#E0D5C3] pb-1">
              <span className="text-[#7A7062]">Period:</span>
              <span className="text-[#332E27]">{centerRecord.period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A7062]">Memory Visibility:</span>
              <span className="font-semibold text-[#8B5E3C]">{centerRecord.memoryStatus}</span>
            </div>
          </div>

          <p className="text-xs font-sans text-[#554C41] bg-[#FAF8F3] p-3 border border-[#EAE2D0] leading-relaxed line-clamp-3">
            {centerRecord.fieldNotes}
          </p>

          <button
            onClick={() => onSelectRecord(centerRecord)}
            className="w-full py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Field Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
