import React from 'react';
import { X, Cpu, ArrowDown, ArrowUpDown, ShieldCheck, Database, HardDrive, Sparkles, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332E27]/75 backdrop-blur-[2px]">
      <div className="bg-[#FAF7F0] border-3 border-[#8B5E3C] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="bg-[#EAE2D0] border-b border-[#D8CEBD] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#8B5E3C] text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B5E3C]">
                System Architecture
              </div>
              <h2 className="text-xl font-serif font-black text-[#332E27]">
                FROM FIELD MEMORY TO SHARED KNOWLEDGE
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#D5CABB] hover:bg-[#DCD2BE] text-[#554C41]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Honesty Notice */}
          <div className="bg-[#FFF8E7] border-l-4 border-[#8B5E3C] p-3.5 text-xs font-mono">
            <div className="font-bold text-[#8B5E3C] uppercase tracking-wide">
              TARGET ARCHITECTURE NOTICE
            </div>
            <p className="text-[#6B6256] mt-1 leading-relaxed">
              This working prototype demonstrates the user experience and service boundary using browser storage and simulated semantic ranking. In production, local storage is fulfilled by <strong>Qdrant Edge</strong> running on ruggedized field hardware, synchronizing vector indexes with <strong>Qdrant Server</strong> at the institutional repository.
            </p>
          </div>

          {/* Architectural Diagram */}
          <div className="bg-[#F2ECE0] border border-[#D8CEBD] p-5">
            <div className="text-xs font-mono uppercase font-bold text-[#8B5E3C] mb-4 text-center tracking-wider">
              Edge-to-Cloud Topological Flow
            </div>

            <div className="max-w-md mx-auto space-y-3 font-mono text-xs">
              {/* Box 1 */}
              <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-3 text-center shadow-xs">
                <div className="font-bold text-[#332E27]">ARCHAEOLOGIST FIELD WORKSTATION</div>
                <div className="text-[10px] text-[#7A7062]">Rugged Tablet / Field Laptop (Trench Datum)</div>
              </div>

              <div className="flex justify-center text-[#8B5E3C]">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Box 2 */}
              <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-3 text-center shadow-xs">
                <div className="font-bold text-[#332E27]">KHOJSETU APPLICATION</div>
                <div className="text-[10px] text-[#8B5E3C]">Memory Service · Search Service · Sync Service</div>
              </div>

              <div className="flex justify-center text-[#8B5E3C]">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Box 3 */}
              <div className="bg-[#EAE2D0] border-2 border-[#A65E3B] p-3.5 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 font-bold text-[#A65E3B]">
                  <HardDrive className="w-4 h-4" />
                  QDRANT EDGE
                </div>
                <div className="text-[11px] font-semibold text-[#332E27] mt-0.5">
                  Local Semantic Vector Memory (Embedded)
                </div>
                <div className="text-[10px] text-[#7A7062]">
                  Autonomous Offline HNSW Search & Cosine Proximity
                </div>
              </div>

              {/* Connection link */}
              <div className="flex flex-col items-center py-1 text-[#5C6E41]">
                <span className="text-[9px] font-mono tracking-widest uppercase bg-[#EFF4E7] border border-[#5C6E41] px-2 py-0.5 text-[#42502B]">
                  Intermittent Field Connectivity (LoRa / Starlink)
                </span>
                <ArrowUpDown className="w-4 h-4 mt-1" />
              </div>

              {/* Box 4 */}
              <div className="bg-[#FAF7F0] border-2 border-[#5C6E41] p-3.5 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 font-bold text-[#5C6E41]">
                  <Database className="w-4 h-4" />
                  QDRANT SERVER
                </div>
                <div className="text-[11px] font-semibold text-[#332E27] mt-0.5">
                  Central / Shared Knowledge Archive
                </div>
                <div className="text-[10px] text-[#7A7062]">
                  Institutional Multi-Trench Cross-Site Synthesis
                </div>
              </div>
            </div>
          </div>

          {/* Core Architectural Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8B5E3C] mb-1">
                <ShieldCheck className="w-4 h-4 text-[#5C6E41]" />
                LOCAL FIRST
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Field records remain fully queryable directly on the device with zero cloud latency and no dependency on continuous network connectivity.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8B5E3C] mb-1">
                <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
                SEMANTIC MEMORY
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Finds discoveries by meaning rather than rigid keywords. A query for "decorated pottery" retrieves "painted ceramic shards" and "incised burnished rims".
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8B5E3C] mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#8B5E3C]" />
                SELECTIVE SYNCHRONIZATION
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Archaeologists control visibility at creation: internal preliminary field observations remain local, while confirmed discoveries are queued for exchange.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-3.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8B5E3C] mb-1">
                <ArrowUpDown className="w-4 h-4 text-[#5C6E41]" />
                EVOLVING MEMORY
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Field knowledge evolves dynamically as layers deepen. Differing stratigraphic interpretations can be merged rather than blindly overwritten.
              </p>
            </div>
          </div>

          {/* Product Differentiation */}
          <div className="border border-[#D8CEBD] bg-[#F7F2E7] p-4 font-mono text-xs">
            <div className="font-bold text-[#332E27] uppercase tracking-wider mb-2">
              Product Differentiation: Memory vs Database
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#EAE2D0] p-3 border border-[#D5CABB]">
                <span className="text-[10px] text-[#7A7062] uppercase block font-bold">Traditional Field Database</span>
                <div className="text-sm font-bold text-[#7A7062] mt-1">
                  Record → Store → Upload
                </div>
                <p className="text-[11px] text-[#6B6256] mt-1 leading-normal font-sans">
                  Rigid relational tables, requires exact keyword matches, locks up when offline, assumes clean static observations.
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-3 border-2 border-[#8B5E3C]">
                <span className="text-[10px] text-[#8B5E3C] uppercase block font-bold">KhojSetu Semantic Workstation</span>
                <div className="text-sm font-bold text-[#8B5E3C] mt-1">
                  Observe → Remember Locally → Search by Meaning → Relate → Reconcile
                </div>
                <p className="text-[11px] text-[#332E27] mt-1 leading-normal font-sans">
                  Grounded field memory, natural language associative queries, spatial-layer integration, and multi-trench reconciliation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#EAE2D0] border-t border-[#D8CEBD] px-6 py-3 flex items-center justify-between font-mono text-xs">
          <span className="text-[#7A7062]">Planned Qdrant Edge Production Pipeline</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#8B5E3C] hover:bg-[#724B2E] text-white font-bold uppercase tracking-wider"
          >
            Close Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
