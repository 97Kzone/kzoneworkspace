import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ShieldAlert, Zap, TrendingUp, Target, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { ProjectHealth, ActionableStrategy } from "../../app/apiService";

/**
 * 인공지능 기반 프로젝트 건강진단 및 전략 분석 모달
 */
export const ProjectHealthModal = ({ 
  isOpen, 
  onClose, 
  report, 
  isLoading,
  onAdopt
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  report: ProjectHealth | null;
  isLoading: boolean;
  onAdopt: (strategy: ActionableStrategy) => void;
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
            className="bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col w-full max-w-5xl h-[85vh] border border-white/40"
          >
            <div className="px-8 py-6 bg-gradient-to-r from-rose-500 to-indigo-600 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Heart size={24} className="text-white fill-white/20" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">AI 프로젝트 전략 분석 및 진단</h3>
                  <p className="text-[10px] text-rose-100 font-bold uppercase tracking-[0.2em] opacity-80">전체 에이전트 활동 및 코드베이스 상태 기반 건강진단</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-slate-50/50">
              {isLoading || !report ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                   <div className="relative">
                      <Loader2 size={64} className="animate-spin text-rose-500 opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Heart size={32} className="text-rose-500 animate-pulse" />
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-black uppercase tracking-widest text-slate-500">심층 진단 보고서 생성 중...</p>
                      <p className="text-xs font-bold text-slate-400 mt-2 italic">에이전트들이 미션 로그와 코드 메트릭을 분석하고 있습니다.</p>
                   </div>
                </div>
              ) : (
                <>
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 건강 점수 */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-rose-100/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                       <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                       <div className="relative z-10 w-24 h-24 rounded-full border-4 border-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-100">
                          <span className="text-4xl font-black text-rose-500">{report.healthScore}</span>
                       </div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">종합 건강 점수</h4>
                       <div className="mt-4 px-4 py-1.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-black uppercase relative z-10">
                          {report.healthScore >= 80 ? '최상' : report.healthScore >= 50 ? '주의' : '위험'}
                       </div>
                    </div>

                    {/* 위험 요소 */}
                    <div className="md:col-span-2 bg-slate-900 p-8 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={120} className="text-rose-500" /></div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <ShieldAlert size={14} className="text-rose-500" /> 감지된 주요 리스트 요소
                       </h4>
                       <div className="space-y-3 relative z-10">
                          {report.risks.map((risk, i) => (
                             <motion.div 
                               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                               key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl"
                             >
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-200">{risk}</span>
                             </motion.div>
                          ))}
                       </div>
                    </div>
                  </section>

                  {/* 전략적 권장사항 */}
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div> AI 기반 실행 전략 (Actionable Strategies)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {report.strategies.map((strat, i) => (
                          <motion.div 
                             key={i} 
                             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                             className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative"
                          >
                             {strat.implemented && (
                                <div className="absolute top-0 right-0 px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg flex items-center gap-1.5">
                                   <CheckCircle2 size={12} /> 적용 완료
                                </div>
                             )}
                             <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${strat.impact === 'HIGH' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                   <Zap size={24} />
                                </div>
                                <div>
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Impact: {strat.impact}</label>
                                   <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{strat.title}</h5>
                                </div>
                             </div>
                             <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-8">{strat.description}</p>
                             <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">권장 행동: {strat.action}</span>
                                </div>
                                {!strat.implemented && (
                                    <button 
                                        onClick={() => onAdopt(strat)}
                                        className="px-6 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                    >
                                        전략 채택
                                    </button>
                                )}
                             </div>
                          </motion.div>
                       ))}
                    </div>
                  </section>

                  {/* 한 마디 요약 */}
                  <div className="bg-indigo-600 p-10 rounded-[3rem] flex items-center gap-8 shadow-2xl relative overflow-hidden group">
                     <div className="absolute -left-10 -bottom-10 opacity-20 group-hover:rotate-12 transition-transform duration-1000 rotate-0">
                        <Sparkles size={200} className="text-white" />
                     </div>
                     <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                        <TrendingUp size={40} className="text-white" />
                     </div>
                     <div className="relative z-10 flex-1">
                        <h4 className="text-white text-lg font-black italic tracking-tight uppercase mb-2">총동원 전략 요약</h4>
                        <p className="text-indigo-100 text-sm font-bold leading-relaxed opacity-90">{report.summary}</p>
                     </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
