import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2, TrendingUp, ShieldAlert, Zap, Activity, Users, ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { ProjectHealth, ActionableStrategy } from "../apiService";

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col w-full max-w-4xl h-[85vh] border border-white/20"
          >
            <div className="px-10 py-8 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 flex items-center justify-between shadow-lg shrink-0 relative overflow-hidden">
               {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center gap-5 text-white relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                  <Heart size={28} className="text-white fill-white/20" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">프로젝트 지능형 헬스 보드</h3>
                  <p className="text-[11px] text-rose-100 font-bold uppercase tracking-[0.25em] opacity-90">AI 에이전트 종합 상태 및 전략 분석</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 z-10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-24 h-24">
                    <Loader2 size={64} className="animate-spin text-rose-500" />
                    <motion.div 
                      className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-10"
                      animate={{ scale: [1, 2, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-slate-800 tracking-tight">전체 프로젝트 데이터 분석 중</p>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">업무 효율 및 팀 시너지를 측정하고 있습니다...</p>
                  </div>
                </div>
              ) : report && (
                <div className="space-y-10">
                  {/* Score & Core Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 relative z-10">Health Score</span>
                       <div className="relative w-40 h-40 flex items-center justify-center mb-4 z-10">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                            <motion.circle 
                              cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                              strokeDasharray={440} 
                              initial={{ strokeDashoffset: 440 }}
                              animate={{ strokeDashoffset: 440 - (440 * report.score / 100) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="text-rose-500" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-900">{report.score}</span>
                            <span className="text-xs font-bold text-rose-500 uppercase">Points</span>
                          </div>
                       </div>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         report.status === 'EXCELLENT' ? 'bg-emerald-500 text-white' : 
                         report.status === 'GOOD' ? 'bg-indigo-500 text-white' : 
                         report.status === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                       }`}>
                         {report.status}
                       </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                       <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-full">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <TrendingUp size={20} />
                            </div>
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">지능형 상태 요약</h4>
                          </div>
                          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-strong:text-indigo-600">
                             <ReactMarkdown>{report.analysisReasoning}</ReactMarkdown>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Risks & Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-8">
                       <div className="flex items-center gap-3 mb-6 font-black text-amber-700 uppercase tracking-tight">
                         <ShieldAlert size={20} />
                         감지된 잠재적 위험
                       </div>
                       <ul className="space-y-4">
                         {report.risks.map((risk, i) => (
                           <motion.li 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            key={i} className="flex items-start gap-3 text-sm text-amber-900/80 font-bold"
                           >
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                             {risk}
                           </motion.li>
                         ))}
                       </ul>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8">
                       <div className="flex items-center gap-3 mb-6 font-black text-indigo-700 uppercase tracking-tight">
                         <Zap size={20} />
                         AI 자율 전략 로드맵
                       </div>
                       <div className="space-y-4">
                         {report.recommendations.map((strategy, i) => (
                           <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            transition={{ delay: i * 0.1 }}
                            key={i} 
                            className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
                           >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                    strategy.priority === 'HIGH' ? 'bg-rose-500 text-white' : 
                                    strategy.priority === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                                  }`}>
                                    {strategy.priority}
                                  </span>
                                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border border-indigo-100">
                                    {strategy.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                                  <Activity size={10} /> {strategy.estimatedEffort} Effort
                                </div>
                              </div>
                              <h5 className="font-bold text-slate-800 text-sm mb-2 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{strategy.title}</h5>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{strategy.description}</p>
                              <div className="flex items-center justify-end pt-1">
                                <button
                                  onClick={() => {
                                    onAdopt(strategy);
                                    onClose();
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
                                >
                                  ADOPT STRATEGY <ChevronRight size={10} />
                                </button>
                              </div>
                           </motion.div>
                         ))}
                       </div>
                    </div>
                  </div>
                  
                  {report.synergyLevel && (
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                                <Users size={20} />
                             </div>
                             <h4 className="text-lg font-black text-slate-800 tracking-tight">팀 시너지 레벨</h4>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                            report.synergyLevel === 'HIGH' ? 'bg-emerald-500 text-white' : 
                            report.synergyLevel === 'MEDIUM' ? 'bg-indigo-500 text-white' : 'bg-rose-500 text-white'
                          }`}>{report.synergyLevel} SYNERGY</span>
                       </div>
                       <div className="flex items-center gap-2 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: report.synergyLevel === 'HIGH' ? '100%' : report.synergyLevel === 'MEDIUM' ? '60%' : '30%' }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${
                              report.synergyLevel === 'HIGH' ? 'from-emerald-400 to-teal-500' : 
                              report.synergyLevel === 'MEDIUM' ? 'from-indigo-400 to-violet-500' : 'from-rose-400 to-pink-500'
                            }`}
                          />
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-10 py-8 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                분석 일시: {report ? new Date(report.generatedAt).toLocaleString() : '대기 중'}
              </div>
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-rose-200"
              >
                대시보드 닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
