import React, { useState } from 'react';
import { FieldRecord, SemanticSearchResult, AssistantAnswer } from '../types/archaeology';
import { searchService, SearchMode, SearchFilters } from '../services/searchService';
import { ArtifactIllustration } from '../components/records/ArtifactIllustration';
import { Search, Sparkles, Filter, CheckCircle2, BookOpen, AlertCircle, Eye, ArrowRight, CornerDownRight } from 'lucide-react';

interface AskFieldArchiveProps {
  onSelectRecord: (record: FieldRecord) => void;
}

export const AskFieldArchive: React.FC<AskFieldArchiveProps> = ({ onSelectRecord }) => {
  const [query, setQuery] = useState(
    'Find ceramic fragments with geometric patterns discovered around Layer 3'
  );
  const [searchMode, setSearchMode] = useState<SearchMode>('SEMANTIC');
  const [filters, setFilters] = useState<SearchFilters>({
    layer: 'ALL',
    material: 'ALL',
    sector: 'ALL'
  });

  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>(() => {
    return searchService.search(
      'Find ceramic fragments with geometric patterns discovered around Layer 3',
      'SEMANTIC'
    );
  });

  // Assistant query state
  const [assistantQuery, setAssistantQuery] = useState('Have we found similar artifacts in Layer L3?');
  const [assistantAnswer, setAssistantAnswer] = useState<AssistantAnswer | null>(() => {
    return searchService.queryAssistant('Have we found similar artifacts in Layer L3?');
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const results = searchService.search(query, searchMode, filters);
    setSearchResults(results);
  };

  const handleAskAssistant = (promptText: string) => {
    setAssistantQuery(promptText);
    const answer = searchService.queryAssistant(promptText);
    setAssistantAnswer(answer);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#D8CEBD] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#8B5E3C] uppercase font-bold">
            Local Vector Inquiries · Offline Natural Language Retrieval
          </div>
          <h1 className="font-serif text-3xl font-black text-[#332E27] tracking-tight">
            ASK THE FIELD ARCHIVE
          </h1>
          <p className="text-xs font-mono text-[#6B6256] mt-0.5">
            Search archaeological memory by meaning, not only by exact words.
          </p>
        </div>

        <div className="bg-[#FAF7F0] border border-[#D8CEBD] px-3 py-1 font-mono text-xs text-[#7A7062]">
          VECTOR INDEX: <strong className="text-[#5C6E41]">LOCAL HNSW READY</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Search Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Large Search Box */}
          <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-5 shadow-xs space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-xs font-mono font-bold text-[#8B5E3C] uppercase tracking-wider">
                Natural-Language Field Memory Inquiry
              </label>

              <div className="relative">
                <textarea
                  rows={2}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe what you are looking for (e.g. Find ceramic fragments with geometric patterns discovered around Layer 3)..."
                  className="w-full bg-[#FFFDF9] border border-[#D8CEBD] focus:border-[#8B5E3C] p-3 pl-9 text-sm font-sans text-[#332E27] outline-none leading-relaxed"
                />
                <Search className="w-4 h-4 text-[#8B5E3C] absolute left-3 top-3.5" />
              </div>

              {/* Mode Selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#7A7062] uppercase text-[10px] font-bold">Search Mode:</span>
                  <div className="flex bg-[#EAE2D0] p-0.5 border border-[#D5CABB]">
                    {(['SEMANTIC', 'EXACT', 'HYBRID'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSearchMode(mode);
                          const r = searchService.search(query, mode, filters);
                          setSearchResults(r);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          searchMode === mode
                            ? 'bg-[#8B5E3C] text-white shadow-xs'
                            : 'text-[#554C41] hover:bg-[#DCD2BE]'
                        }`}
                      >
                        {mode === 'SEMANTIC' ? 'SEMANTIC MEMORY' : mode === 'EXACT' ? 'EXACT TERMS' : 'HYBRID'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Search Field Memory
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EAE2D0] text-xs font-mono">
                <div>
                  <label className="text-[10px] text-[#7A7062] block mb-0.5">Filter Layer</label>
                  <select
                    value={filters.layer}
                    onChange={(e) => {
                      const f = { ...filters, layer: e.target.value };
                      setFilters(f);
                      setSearchResults(searchService.search(query, searchMode, f));
                    }}
                    className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1 text-[#332E27] outline-none"
                  >
                    <option value="ALL">All Layers</option>
                    <option value="L1">Layer L1</option>
                    <option value="L2">Layer L2</option>
                    <option value="L3">Layer L3</option>
                    <option value="L4">Layer L4</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7A7062] block mb-0.5">Filter Material</label>
                  <select
                    value={filters.material}
                    onChange={(e) => {
                      const f = { ...filters, material: e.target.value };
                      setFilters(f);
                      setSearchResults(searchService.search(query, searchMode, f));
                    }}
                    className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1 text-[#332E27] outline-none"
                  >
                    <option value="ALL">All Materials</option>
                    <option value="Ceramic">Ceramic</option>
                    <option value="Stone">Stone</option>
                    <option value="Metal">Metal</option>
                    <option value="Bone">Bone</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#7A7062] block mb-0.5">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={(e) => {
                      const f = { ...filters, sector: e.target.value };
                      setFilters(f);
                      setSearchResults(searchService.search(query, searchMode, f));
                    }}
                    className="w-full bg-[#FAF8F3] border border-[#D8CEBD] p-1 text-[#332E27] outline-none"
                  >
                    <option value="ALL">All Sectors</option>
                    <option value="A">Sector A</option>
                    <option value="B">Sector B</option>
                    <option value="C">Sector C</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Search Results List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D8CEBD] pb-2 text-xs font-mono">
              <span className="font-bold text-[#332E27] uppercase tracking-wider">
                Retrieved Discoveries ({searchResults.length})
              </span>
              <span className="text-[#7A7062]">
                Ranked by cosine vector proximity
              </span>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((res, index) => {
                  const { record, similarityScore, retrievalReasons } = res;
                  return (
                    <div
                      key={record.id}
                      className="bg-[#FAF7F0] border-2 border-[#D8CEBD] hover:border-[#8B5E3C] p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[#EAE2D0] pb-2.5 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#8B5E3C] bg-[#EFE9DB] px-2 py-0.5">
                            RESULT {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="font-mono font-bold text-sm text-[#332E27]">
                            {record.id} · {record.title}
                          </span>
                        </div>

                        {/* Similarity Score Pill */}
                        <div className="flex items-center gap-1.5 bg-[#EFF4E7] border border-[#5C6E41] px-2.5 py-0.5 text-xs font-mono font-bold text-[#42502B]">
                          <span>SIMILARITY</span>
                          <span className="text-sm">{similarityScore}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-3 w-full">
                          <ArtifactIllustration
                            type={record.illustrationType}
                            size="sm"
                            className="w-full h-24"
                          />
                        </div>

                        <div className="md:col-span-9 space-y-2.5">
                          <div className="flex items-center gap-3 text-xs font-mono text-[#8B5E3C] font-semibold">
                            <span>GRID {record.grid}</span>
                            <span>·</span>
                            <span>LAYER {record.layer} ({record.depth}m)</span>
                            <span>·</span>
                            <span>{record.material.toUpperCase()}</span>
                          </div>

                          <p className="text-xs font-sans text-[#554C41] leading-relaxed bg-[#FAF8F3] p-2.5 border border-[#EFE9DB]">
                            "{record.fieldNotes}"
                          </p>

                          {/* WHY THIS WAS RETRIEVED */}
                          <div className="bg-[#F2ECE0] p-2.5 border border-[#D5CABB]">
                            <div className="text-[10px] font-mono uppercase font-bold text-[#8B5E3C] mb-1">
                              WHY THIS WAS RETRIEVED
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-[#554C41]">
                              {retrievalReasons.map((reason, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="text-[#5C6E41] font-bold">✓</span>
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => onSelectRecord(record)}
                              className="px-3 py-1 bg-[#8B5E3C] hover:bg-[#724B2E] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open Record</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#FAF7F0] border-2 border-dashed border-[#D5CABB] p-8 text-center text-xs font-mono text-[#827768] space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-[#8B5E3C]" />
                <div className="font-bold text-[#332E27]">NO MATCHING DISCOVERIES RETRIEVED</div>
                <p className="max-w-md mx-auto text-[#7A7062]">
                  Try describing the material type, general function, or stratum rather than strict terminology.
                </p>
              </div>
            )}
          </div>

          {/* Section 17: AI FIELD RESEARCH ASSISTANT */}
          <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-5 shadow-sm space-y-4">
            <div className="border-b border-[#EAE2D0] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#8B5E3C] text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#332E27]">
                    FIELD RESEARCH ASSISTANT
                  </h3>
                  <div className="text-[10px] font-mono text-[#7A7062]">
                    Synthesizes strictly from retrieved local records (no external fabrication)
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-mono uppercase bg-[#EFE9DB] px-2 py-0.5 border border-[#D5CABB] text-[#554C41]">
                Grounded Memory Engine
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#7A7062] uppercase tracking-wider block">
                Sample Field Questions:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                {[
                  'Have we found similar artifacts in Layer L3?',
                  'What lithic tools have been discovered in Sector B?',
                  'Are there metal weapons or blades in Layer 4?',
                  'Any hearth or combustion features near Grid B12?'
                ].map(promptText => (
                  <button
                    key={promptText}
                    onClick={() => handleAskAssistant(promptText)}
                    className={`px-2.5 py-1 border transition-colors text-left ${
                      assistantQuery === promptText
                        ? 'bg-[#8B5E3C] text-white border-[#724B2E]'
                        : 'bg-[#FAF8F3] text-[#554C41] border-[#D8CEBD] hover:bg-[#EAE2D0]'
                    }`}
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            {/* Assistant Output Notebook */}
            {assistantAnswer && (
              <div className="bg-[#FFFDF9] border border-[#D8CEBD] p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#EAE2D0] pb-2">
                  <span className="font-bold text-[#8B5E3C] uppercase tracking-wider">
                    {assistantAnswer.reviewTitle}
                  </span>
                  <span className="text-[10px] text-[#7A7062]">
                    SOURCES: <strong className="text-[#332E27]">{assistantAnswer.sourceCount} LOCAL FIELD RECORDS</strong>
                  </span>
                </div>

                {/* Retrieved record citations */}
                {assistantAnswer.relatedRecords.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {assistantAnswer.relatedRecords.slice(0, 3).map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className="bg-[#F6F1E6] p-2 border border-[#D8CEBD] hover:border-[#8B5E3C] cursor-pointer transition-colors"
                      >
                        <div className="font-bold text-[#8B5E3C]">{rec.id}</div>
                        <div className="text-[11px] font-serif text-[#332E27] truncate">{rec.title}</div>
                        <div className="text-[10px] text-[#7A7062]">Grid {rec.grid} · Layer {rec.layer}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Synthesis Section */}
                <div className="bg-[#F4EFE4] p-3 border-l-3 border-[#8B5E3C]">
                  <div className="text-[10px] font-bold text-[#8B5E3C] uppercase mb-1">
                    SYNTHESIS
                  </div>
                  <p className="text-xs font-sans text-[#332E27] leading-relaxed">
                    {assistantAnswer.synthesis}
                  </p>
                </div>

                <div className="text-[10px] text-[#827768] flex items-center justify-between pt-1">
                  <span>Confidence: {assistantAnswer.evidenceConfidence.toUpperCase()}</span>
                  <span>Strict Local In-Situ Boundary Enforced</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 18: WHY THIS MATTERS Side Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FAF7F0] border-2 border-[#8B5E3C] p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-[#EAE2D0] pb-2">
              <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
              <h3 className="font-serif font-bold text-sm text-[#332E27]">
                WHY SEMANTIC MEMORY?
              </h3>
            </div>

            <div className="space-y-3 font-sans">
              <div className="bg-[#EFE9DB] p-3 border border-[#D5CABB]">
                <div className="font-mono text-[10px] uppercase font-bold text-[#7A7062] mb-1">
                  Traditional Search
                </div>
                <code className="text-xs font-mono text-[#B34F3F] block mb-1">"ceramic"</code>
                <p className="text-xs text-[#554C41] leading-relaxed">
                  Only finds records explicitly containing the word <em>ceramic</em>. Misses observations logged as <em>pottery</em>, <em>shards</em>, or <em>pithoi</em>.
                </p>
              </div>

              <div className="bg-[#FFFDF9] p-3 border-2 border-[#8B5E3C]">
                <div className="font-mono text-[10px] uppercase font-bold text-[#8B5E3C] mb-1">
                  KhojSetu Semantic Memory
                </div>
                <code className="text-xs font-mono text-[#5C6E41] block mb-1">"decorated pottery fragments"</code>
                <p className="text-xs text-[#332E27] leading-relaxed">
                  Understands archaeological equivalence and morphological meaning:
                </p>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-[#6B6256]">
                  <div>↔ ceramic shard</div>
                  <div>↔ painted pottery</div>
                  <div>↔ incised carinated rim</div>
                  <div>↔ geometric slip bands</div>
                </div>
              </div>

              <p className="text-xs text-[#6B6256] leading-relaxed italic border-t border-[#EAE2D0] pt-2">
                "An archaeologist shouldn't need to guess which specific word another field researcher used in their trench notebook three weeks ago."
              </p>
            </div>
          </div>

          {/* Stratigraphic Quick Look */}
          <div className="bg-[#F2ECE0] border border-[#D8CEBD] p-4 text-xs font-mono space-y-2">
            <div className="font-bold text-[#332E27] uppercase tracking-wider">
              Target Field Vocabulary
            </div>
            <p className="text-[11px] text-[#6B6256] font-sans leading-normal">
              Try searching with complex descriptive phrases:
            </p>
            <ul className="space-y-1 text-[11px] text-[#8B5E3C]">
              <li className="cursor-pointer hover:underline" onClick={() => setQuery('worked flint scrapers in upper stratum')}>
                • "worked flint scrapers in upper stratum"
              </li>
              <li className="cursor-pointer hover:underline" onClick={() => setQuery('bronze blades or copper pins in Layer 4')}>
                • "bronze blades or copper pins in Layer 4"
              </li>
              <li className="cursor-pointer hover:underline" onClick={() => setQuery('charcoal samples suitable for C14 dating')}>
                • "charcoal samples suitable for C14 dating"
              </li>
              <li className="cursor-pointer hover:underline" onClick={() => setQuery('bone tools with carved striations')}>
                • "bone tools with carved striations"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
