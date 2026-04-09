import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Code2, Copy, Check, FileCode, Loader2, Sparkles, Database } from "lucide-react";
import { CodebaseChunk } from "../app/apiService";

/**
 * 프로젝트 코드베이스를 시맨틱 검색하고 탐색하는 모달
 */
export const CodebaseExplorer = ({ 
  isOpen, 
  onClose, 
  results, 
  onSearch, 
  onIndex,
  isLoading,
  isIndexing
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  results: CodebaseChunk[]; 
  onSearch: (q: string) => void;
  onIndex: () => void;
  isLoading: boolean;
  isIndexing: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            className="bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col w-full max-w-5xl h-[85vh] border border-white/40"
          >
            <div className="px-8 py-6 bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Code2 size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">시맨틱 코드 브라우저</h3>
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-[0.2em] opacity-80">프로젝트 코드베이스의 의미론적 조각 탐색 및 분석</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={onIndex}
                  disabled={isIndexing}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
                >
                  {isIndexing ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                  {isIndexing ? '인덱싱 진행 중' : '전체 코드 인덱싱'}
                </button>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="구현 방식을 검색해 보세요 (예: '로그인 검증 로직', '데이터베이스 커넥션 설정'...)"
                  className="w-full bg-white border border-slate-200 rounded-3xl pl-16 pr-8 py-5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
                />
                {isLoading && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-100/30">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 text-slate-400">
                  <div className="p-10 rounded-[3rem] bg-white border-2 border-dashed border-slate-200 shadow-inner">
                    <Sparkles size={64} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500">코드 조각이 없습니다</p>
                    <p className="text-xs font-bold mt-2">검색어를 입력하여 코드베이스를 분석해 보세요.</p>
                  </div>
                </div>
              ) : (
                results.map((chunk, i) => (
                  <motion.div 
                    key={chunk.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-[2rem] bg-white border border-slate-100 shadow-lg overflow-hidden flex flex-col group"
                  >
                    <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileCode size={18} className="text-indigo-500" />
                        <span className="text-xs font-mono font-bold text-slate-600">{chunk.filePath}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase">Rank #{i+1}</span>
                      </div>
                      <button 
                        onClick={() => handleCopy(chunk.id, chunk.content)}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-slate-100"
                      >
                        {copiedId === chunk.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === chunk.id ? '복사됨' : '복사'}
                      </button>
                    </div>
                    <div className="p-8 bg-slate-900 group-hover:bg-slate-950 transition-colors">
                      <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto custom-scrollbar-dark p-2">
                        <code>{chunk.content}</code>
                      </pre>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
