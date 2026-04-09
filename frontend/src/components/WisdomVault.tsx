import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Brain, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { AgentLesson } from "../app/apiService";

/**
 * 프로젝트 수행 중 획득한 자동화된 교훈과 해결 지혜를 보여주는 모달
 */
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
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-violet-700 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">자율 지혜 보관소 (Wisdom Vault)</h3>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-[0.2em] opacity-80">과거의 실패와 성공에서 추출한 기술적 교훈</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/50">
              {lessons.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                  <Brain size={64} strokeWidth={1} className="mb-4" />
                  <p className="text-lg font-black uppercase tracking-widest text-slate-500">데이터가 아직 수집되지 않았습니다</p>
                  <p className="text-xs font-bold mt-2">에이전트들이 작업을 완료하면 여기에 지혜가 공유됩니다.</p>
                </div>
              ) : (
                lessons.map((lesson, i) => (
                  <motion.div 
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                  >
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${getAgentColor(lesson.agentName).bg} text-white flex items-center justify-center shadow-lg`}>
                             <Brain size={24} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{lesson.agentName}의 교훈</h4>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(lesson.timestamp).toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <span className={`px-3 py-1.5 rounded-xl ${lesson.outcome === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'} text-[10px] font-black uppercase tracking-widest`}>
                             {lesson.outcome === 'SUCCESS' ? '성공 사례' : '실패 극복'}
                          </span>
                       </div>
                    </div>
                    
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <div className="flex items-center gap-2 text-rose-500">
                             <AlertTriangle size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">실패/문제 패턴</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed bg-rose-50/30 p-6 rounded-2xl border border-rose-100/30 shadow-inner">
                             {lesson.failurePattern}
                          </p>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-2 text-emerald-500">
                             <ShieldCheck size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">추출된 기술적 지혜</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/30 shadow-inner">
                             {lesson.wisdom}
                          </p>
                       </div>
                    </div>
                    
                    <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Zap size={14} className="text-indigo-500" />
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">다음 단계 가이드:</span>
                          <span className="text-[11px] font-bold text-indigo-600">{lesson.actionableStep}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-slate-400 uppercase">신뢰도 점수</span>
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-indigo-500" />
                          </div>
                       </div>
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
