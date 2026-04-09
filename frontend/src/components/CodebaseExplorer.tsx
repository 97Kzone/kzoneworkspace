import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Database, X, Loader2, Code2 } from "lucide-react";
import { CodebaseChunk } from "../apiService";

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
  onSearch: (query: string) => void;
  onIndex: () => void;
  isLoading: boolean;
  isIndexing: boolean;
}) => {
  const [query, setQuery] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 w-[550px] h-full bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700 z-[150] shadow-[-20px_0_60px_rgba(0,0,0,0.2)] flex flex-col text-slate-200"
        >
          <div className="h-20 border-b border-slate-700/50 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Search size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">시맨틱 코드 탐색</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">코드베이스 지능형 검색</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onIndex}
                disabled={isIndexing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${isIndexing ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
              >
                {isIndexing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                {isIndexing ? "인덱싱 중..." : "인덱싱 갱신"}
              </button>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div className="relative">
              <input
                type="text"
                placeholder="어떤 코드를 찾으시나요? (예: '로그인 검증 로직')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all shadow-inner"
              />
              <button 
                onClick={() => onSearch(query)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-60">
                <Code2 size={40} className="mb-2" />
                <p className="text-sm font-bold text-center">의미 기반 검색을 지원합니다.<br/>궁금한 코드 로직을 물어보세요.</p>
              </div>
            ) : (
              results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all group"
                >
                  <div className="bg-slate-800/60 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Code2 size={14} className="text-emerald-400" />
                       <span className="text-xs font-mono text-slate-300 truncate max-w-[300px]">{result.filePath}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      L{result.startLine} - L{result.endLine}
                    </span>
                  </div>
                  <div className="p-4 overflow-x-auto custom-scrollbar">
                    <pre className="text-[11px] font-mono text-emerald-50/80 leading-relaxed">
                      <code>{result.content}</code>
                    </pre>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
