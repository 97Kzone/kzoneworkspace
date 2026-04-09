import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, ShieldAlert, Zap } from "lucide-react";
import { AgentLesson } from "../apiService";

export const WisdomVault = ({ 
  isOpen, 
  onClose, 
  lessons,
  getAgentColor
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  lessons: AgentLesson[];
  getAgentColor: (name: string) => any;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[140]"
          />
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-0 right-0 w-[500px] h-full bg-slate-900/90 backdrop-blur-3xl border-l border-amber-500/30 z-[150] shadow-[-20px_0_60px_rgba(0,0,0,0.3)] flex flex-col"
          >
            <div className="h-20 border-b border-amber-500/20 flex items-center justify-between px-8 shrink-0 bg-gradient-to-r from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-900/40">
                  <Brain size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-50 tracking-tight">지혜의 전당 (Wisdom Vault)</h3>
                  <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">에이전트 자율 기술 회고</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {lessons.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-60">
                  <Brain size={40} className="mb-2" />
                  <p className="text-sm font-bold text-center text-slate-400">아직 에이전트가 터득한<br/>교훈이 없습니다.</p>
                </div>
              ) : (
                lessons.map((lesson) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-black tracking-wider uppercase">
                          {lesson.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">Priority {lesson.importance}</span>
                      </div>
                      <span className={`text-[10px] font-black ${getAgentColor(lesson.agentName).text}`}>{lesson.agentName}</span>
                    </div>
                    
                    <div className="space-y-3">
                      {lesson.failPattern && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                          <p className="text-[10px] text-rose-400 font-black mb-1 flex items-center gap-1">
                            <ShieldAlert size={12} /> FAILURE PATTERN
                          </p>
                          <p className="text-xs text-rose-100/80 leading-relaxed font-mono">{lesson.failPattern}</p>
                        </div>
                      )}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <p className="text-[10px] text-emerald-400 font-black mb-1 flex items-center gap-1">
                            <Zap size={12} /> TECHNICAL WISDOM
                          </p>
                          <p className="text-xs text-emerald-50/90 leading-relaxed italic">{lesson.wisdom}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                      <span>Learned at {new Date(lesson.createdAt).toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
