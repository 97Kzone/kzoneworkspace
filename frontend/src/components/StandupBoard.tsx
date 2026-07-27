import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, CheckCircle2, Target, AlertTriangle, Users, Loader2, Clock, RefreshCw } from "lucide-react";
import { AgentStandup, standupService } from "../app/apiService";

interface StandupBoardProps {
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
}

const AUTO_REFRESH_OPTIONS = [
  { label: "OFF", value: 0 },
  { label: "5분", value: 5 * 60 * 1000 },
  { label: "15분", value: 15 * 60 * 1000 },
  { label: "30분", value: 30 * 60 * 1000 },
];

export const StandupBoard: React.FC<StandupBoardProps> = ({ getAgentColor }) => {
  const [standups, setStandups] = useState<AgentStandup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStandups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await standupService.getDailyStandup();
      setStandups(res.data);
      setLastFetchedAt(new Date());
    } catch (e) {
      console.error("Failed to fetch standups:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandups();
  }, [fetchStandups]);

  // 자동 갱신 타이머 관리
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoRefreshMs > 0) {
      timerRef.current = setInterval(() => {
        fetchStandups();
      }, autoRefreshMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefreshMs, fetchStandups]);

  const formatLastFetched = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const blockerCount = standups.filter(s => s.blocker).length;
  const clearCount = standups.filter(s => !s.blocker).length;

  return (
    <div className="flex-1 overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 bg-black/20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg">
            <Sun size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">군집 일일 스탠드업 보드</h3>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">에이전트별 업무 현황 및 블로커 공유</p>
              {lastFetchedAt && (
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <Clock size={10} />
                  최종 갱신: {formatLastFetched(lastFetchedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 자동 갱신 주기 선택 */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2 pr-1">자동</span>
            {AUTO_REFRESH_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAutoRefreshMs(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  autoRefreshMs === opt.value
                    ? "bg-amber-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStandups}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />
            }
            스탠드업 소집
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {standups.length > 0 && (
        <div className="shrink-0 px-8 py-4 border-b border-slate-800/60 bg-black/10 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이슈 없음</span>
            <span className="text-sm font-black text-white">{clearCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">블로커 감지</span>
            <span className="text-sm font-black text-rose-400">{blockerCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={12} className="text-slate-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">참여 에이전트</span>
            <span className="text-sm font-black text-white">{standups.length}</span>
          </div>
        </div>
      )}

      {/* Cards */}
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
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${color.bg} text-white flex items-center justify-center text-xl font-black shadow-lg`}>
                        {standup.agentName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">{standup.agentName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{standup.agentRole}</p>
                      </div>
                    </div>
                    {/* 타임스탬프 */}
                    <span className="text-[9px] font-mono text-slate-500 self-start mt-1">
                      {new Date(standup.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
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

        {isLoading && standups.length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 pt-20">
            <Loader2 size={36} className="animate-spin text-amber-400" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">스탠드업 데이터 수집 중...</p>
          </div>
        )}
      </div>
    </div>
  );
};
