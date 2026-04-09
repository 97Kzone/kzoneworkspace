import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Search, Terminal, Loader2, Sparkles, Brain, Clock } from "lucide-react";
import { Memory } from "../app/apiService";

/**
 * 에이전트들의 지식(에피소드 기억)을 탐색하고 검색하는 모달 컴포넌트
 */
export const KnowledgeExplorer = ({ 
  isOpen, 
  onClose, 
  memories, 
  onSearch, 
  isLoading,
  getAgentColor
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  memories: Memory[]; 
  onSearch: (q: string) => void;
  isLoading: boolean;
  getAgentColor: (name: string) => any;
}) => {
  const [query, setQuery] = useState("");

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
            className="bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col w-full max-w-4xl h-[85vh] border border-white/40"
          >
            <div className="px-8 py-6 bg-gradient-to-r from-slate-900 to-indigo-900 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Database size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">전역 지식 탐색기</h3>
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-[0.2em] opacity-80">분산된 에이전트의 에피소드 기억 및 교훈 조회</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="의미론적 지식 검색 (예: '기술 부채', '최적화 사례'...)"
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

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-white">
              {memories.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 text-slate-400">
                  <div className="p-10 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
                    <Sparkles size={64} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500">검색 결과가 없습니다</p>
                    <p className="text-xs font-bold mt-2">지식 베이스에서 에피소드를 조회해 보세요.</p>
                  </div>
                </div>
              ) : (
                memories.map((memory, i) => (
                  <motion.div 
                    key={memory.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <span className={`px-3 py-1 rounded-full ${getAgentColor(memory.agentName).soft} text-[9px] font-black tracking-widest uppercase`}>
                        발견자: {memory.agentName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">•</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1.5 leading-none">
                        <Clock size={10} /> {new Date(memory.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors uppercase leading-tight relative z-10">{memory.content}</h4>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Brain size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(memory.importance || 5) * 10}%` }} className="h-full bg-indigo-500" />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">중요도 {memory.importance || 5}/10</span>
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
