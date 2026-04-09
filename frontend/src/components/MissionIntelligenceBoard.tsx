import { motion } from "framer-motion";
import { Brain, Loader2, Target, History } from "lucide-react";
import { MissionContext } from "../app/apiService";

/**
 * 에이전트 간 공유되는 미션 지식과 맥락(Context)을 표시하는 보드
 */
export const MissionIntelligenceBoard = ({ 
  intelligence, 
  isLoading 
}: { 
  intelligence: MissionContext[]; 
  isLoading: boolean;
}) => {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-900/40 animate-pulse">
            <Brain size={20} />
          </div>
          <div>
             <h4 className="text-[12px] font-black text-white tracking-widest uppercase">집단 미션 인텔리전스</h4>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">실시간 상호 정보 공유 및 미션 동기화 보드</p>
          </div>
        </div>
        <div className="flex gap-2">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              동기화 완료
            </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
        {isLoading && intelligence.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50 py-20">
             <Loader2 size={40} className="animate-spin text-slate-500" />
             <p className="text-[11px] font-black uppercase tracking-widest text-center">지능을 수집하는 중입니다...</p>
          </div>
        ) : intelligence.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50 py-20">
              <div className="p-4 rounded-full bg-slate-800/50">
                <Target size={40} className="text-slate-500" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-center leading-relaxed">아직 수집된 지능이 없습니다.<br/>에이전트들이 작업을 완료하면 여기에 전역 지식이 공유됩니다.</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intelligence.map((intel) => (
              <motion.div 
                key={intel.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-slate-800/60 border ${intel.importance >= 4 ? 'border-amber-500/40 shadow-amber-500/5' : 'border-slate-700/50'} rounded-2xl p-4 hover:bg-slate-800/80 transition-all relative overflow-hidden group`}
              >
                {intel.importance >= 4 && (
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                        중요 정보
                    </div>
                )}
                <div className="flex items-center gap-2 mb-3 text-left">
                  <span className={`px-2 py-0.5 rounded-lg ${intel.importance >= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'} text-[9px] font-black tracking-widest uppercase`}>
                    {intel.intelKey}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">•</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{intel.agentName} 발견</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200 leading-relaxed mb-4 text-left">{intel.intelValue}</p>
                <div className="flex items-center justify-between text-[8px] text-slate-500 font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <History size={10} />
                    {new Date(intel.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-0.5 rounded-full ${i < intel.importance ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
