import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, CheckCircle2, Target, AlertTriangle, Users, Loader2 } from "lucide-react";
import { AgentStandup, standupService } from "../app/apiService";

interface StandupBoardProps {
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
}

export const StandupBoard: React.FC<StandupBoardProps> = ({ getAgentColor }) => {
  const [standups, setStandups] = useState<AgentStandup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStandups = async () => {
    setIsLoading(true);
    try {
      const res = await standupService.getDailyStandup();
      setStandups(res.data);
    } catch (e) {
      console.error("Failed to fetch standups:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStandups();
  }, []);

  return (
    <div className="flex-1 overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col">
      <div className="p-8 border-b border-slate-800 bg-black/20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg">
            <Sun size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">군집 일일 스탠드업 보드</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">에이전트별 업무 현황 및 블로커 공유</p>
          </div>
        </div>
        <button 
          onClick={fetchStandups}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          스탠드업 소집
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-10 custom-scrollbar-dark flex gap-8 items-start">
        <AnimatePresence>
          {standups.map((standup, index) => {
            const color = getAgentColor(standup.agentName);
            return (
              <motion.div
                key={standup.agentId}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4, type: "spring" }}
                className="w-[340px] shrink-0 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-[2rem] overflow-hidden flex flex-col shadow-xl"
              >
                <div className={`p-6 border-b border-slate-700/50 relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${color.bg}`}></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-full ${color.bg} text-white flex items-center justify-center text-xl font-black shadow-lg`}>
                      {standup.agentName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wide">{standup.agentName}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{standup.agentRole}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* Past Action */}
                  <div>
                    <h5 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      어제 완료한 일
                    </h5>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium bg-black/20 p-4 rounded-2xl border border-white/5">
                      {standup.pastAction}
                    </p>
                  </div>

                  {/* Today Focus */}
                  <div>
                    <h5 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      <Target size={14} className="text-indigo-400" />
                      오늘의 목표
                    </h5>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium bg-black/20 p-4 rounded-2xl border border-white/5">
                      {standup.todayFocus}
                    </p>
                  </div>

                  {/* Blocker */}
                  {standup.blocker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-auto"
                    >
                      <h5 className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">
                        <AlertTriangle size={14} />
                        현재 블로커
                      </h5>
                      <p className="text-sm text-rose-200 leading-relaxed font-medium bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                        {standup.blocker}
                      </p>
                    </motion.div>
                  )}
                  
                  {!standup.blocker && (
                    <div className="mt-auto bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">이슈 없음 (Clear)</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {standups.length === 0 && !isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50 pt-20">
            <Users size={48} />
            <p className="text-sm font-black uppercase tracking-widest">참여 가능한 에이전트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};
