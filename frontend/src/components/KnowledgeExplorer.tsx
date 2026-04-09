import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Loader2, Search, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Memory } from "../apiService";

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
  onSearch: (query: string) => void;
  isLoading: boolean;
  getAgentColor: (name: string) => any;
}) => {
  const [query, setQuery] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 w-[450px] h-full bg-white/80 backdrop-blur-2xl border-l border-indigo-100/50 z-[150] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] flex flex-col"
        >
          <div className="h-20 border-b border-slate-100/50 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">지식 탐색기</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">에이전트 메모리 탐색</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 border-b border-slate-100/50 bg-white/50">
            <div className="relative">
              <input
                type="text"
                placeholder="어떤 지식을 찾으시나요? (예: 코드 리뷰 결과)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
              />
              <button 
                onClick={() => onSearch(query)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
            {memories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                <Database size={40} className="mb-2" />
                <p className="text-sm font-bold text-center">검색 결과가 없거나<br/>아직 지식이 축적되지 않았습니다.</p>
              </div>
            ) : (
              memories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${getAgentColor(memory.agentName).light} flex items-center justify-center border border-indigo-50`}>
                        <Bot size={14} className={getAgentColor(memory.agentName).text} />
                      </div>
                      <span className={`text-[11px] font-black ${getAgentColor(memory.agentName).soft}`}>{memory.agentName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-3">
                    <ReactMarkdown>{memory.content}</ReactMarkdown>
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
