"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, Activity, Loader2, Play, Users, Bot, RefreshCw, Zap } from "lucide-react";
import { WorkloadMetric, workloadService } from "../app/apiService";

interface WorkloadBalancerDashboardProps {
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
}

export const WorkloadBalancerDashboard: React.FC<WorkloadBalancerDashboardProps> = ({ getAgentColor }) => {
  const [metrics, setMetrics] = useState<WorkloadMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceResult, setRebalanceResult] = useState<string[]>([]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await workloadService.getMetrics();
      setMetrics(res.data);
    } catch (error) {
      console.error("Failed to fetch workload metrics", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRebalance = async () => {
    setIsRebalancing(true);
    setRebalanceResult([]);
    try {
      const res = await workloadService.rebalance();
      setRebalanceResult(res.data.messages);
      await fetchMetrics();
    } catch (error) {
      console.error("Failed to rebalance workload", error);
      setRebalanceResult(["재분배 중 오류가 발생했습니다."]);
    } finally {
      setIsRebalancing(false);
    }
  };

  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-xs font-black uppercase tracking-widest">워크로드 데이터 로드 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Network size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
              군집 워크로드 분산기
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              AI 에이전트 간 태스크 병목 예측 및 자동 부하 분산 시스템
            </p>
          </div>
        </div>
        <button
          onClick={handleRebalance}
          disabled={isRebalancing}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            isRebalancing
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-100 active:scale-95"
          }`}
        >
          {isRebalancing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {isRebalancing ? "자동 분산 중..." : "자동 부하 분산 실행"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-10">
        
        {/* Rebalance Result Messages */}
        {rebalanceResult.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-2xl"
          >
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">분산 처리 결과 로그</h4>
            <div className="space-y-2">
              {rebalanceResult.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-300">
                  <Play size={10} className="text-emerald-500" />
                  {msg}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {metrics.map((metric, i) => {
            const color = getAgentColor(metric.agentName);
            const isOverloaded = metric.utilizationScore > 50;
            const isIdle = metric.utilizationScore < 10;
            
            return (
              <motion.div
                key={metric.agentId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-[2.5rem] border ${isOverloaded ? 'border-rose-200 shadow-rose-100' : 'border-slate-100'} shadow-xl p-8 relative overflow-hidden group`}
              >
                {/* Background Pulse for Overloaded Agents */}
                {isOverloaded && (
                  <div className="absolute inset-0 bg-rose-50/30 animate-pulse pointer-events-none" />
                )}

                <div className="flex items-start justify-between relative z-10 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${color.bg} text-white flex items-center justify-center shadow-lg shrink-0`}>
                      <Bot size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
                        {metric.agentName}
                      </h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-1 inline-block ${color.soft} ${color.text}`}>
                        {metric.agentRole}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col items-end`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOverloaded ? 'text-rose-500' : isIdle ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isOverloaded ? '과부하' : isIdle ? '유휴 상태' : '안정적'}
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {metric.utilizationScore}
                      <span className="text-xs text-slate-400"> / 100</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span>활성 태스크 (진행 중)</span>
                      <span>{metric.activeTasks}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(metric.activeTasks * 20, 100)}%` }} 
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        대기 중인 태스크 (큐)
                        {metric.pendingTasks > 3 && <Activity size={12} className="text-rose-500 animate-pulse" />}
                      </span>
                      <span className={metric.pendingTasks > 3 ? 'text-rose-500' : ''}>{metric.pendingTasks}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {/* Visualize queue chunks */}
                      {Array.from({ length: Math.min(metric.pendingTasks, 10) }).map((_, idx) => (
                        <div key={idx} className={`h-full flex-1 border-r border-white/50 ${idx > 2 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
