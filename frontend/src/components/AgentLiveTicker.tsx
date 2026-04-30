"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Activity as ActivityIcon, MessageSquare, Clock } from "lucide-react";
import { Agent, ActivityLog, agentService, activityService } from "../app/apiService";

export const AgentLiveTicker: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentRes, activityRes] = await Promise.all([
        agentService.getAll(),
        activityService.getAll()
      ]);
      setAgents(agentRes.data);
      // 가장 최근 10개의 활동 로그만 사용
      setRecentLogs(activityRes.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
    } catch (e) {
      console.error("Failed to fetch data for ticker:", e);
    }
  };

  if (agents.length === 0 && recentLogs.length === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 text-white z-[100] h-10 flex items-center overflow-hidden font-mono text-xs"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 고정된 헤더 부분 */}
      <div className="flex items-center gap-2 bg-slate-950 h-full px-4 border-r border-slate-800 shrink-0 z-10 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <Radio size={14} className="text-emerald-400 animate-pulse" />
        <span className="font-black uppercase tracking-widest text-slate-300">Swarm Live</span>
      </div>

      {/* 흘러가는 티커 부분 */}
      <div className="flex-1 relative overflow-hidden h-full flex items-center">
        {/* 그라데이션 마스크 */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center gap-10 whitespace-nowrap pl-full"
          animate={{ x: isHovered ? 0 : [0, -2000] }}
          transition={{
            repeat: Infinity,
            duration: 60,
            ease: "linear",
          }}
          style={{ x: isHovered ? undefined : 0 }}
        >
          {/* 에이전트 상태 + 최근 활동을 섞어서 두 번 반복 (무한 스크롤용) */}
          {[...agents, ...recentLogs, ...agents, ...recentLogs].map((item, index) => {
            if ('role' in item) {
              // Agent
              const agent = item as Agent;
              return (
                <div key={`agent-${agent.id}-${index}`} className="flex items-center gap-2">
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                    agent.status === 'RUNNING' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                    agent.status === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {agent.name}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${
                    agent.status === 'RUNNING' ? 'text-indigo-300' : 'text-slate-500'
                  }`}>
                    [{agent.status}]
                  </span>
                  <span className="text-slate-300 text-[11px] flex items-center gap-1.5 font-medium">
                    {agent.status === 'RUNNING' && <ActivityIcon size={12} className="text-indigo-400 animate-pulse" />}
                    {agent.currentActivity || agent.greeting || "대기 상태 유지 중"}
                  </span>
                  <span className="text-slate-700 ml-4">◆</span>
                </div>
              );
            } else {
              // ActivityLog
              const log = item as ActivityLog;
              const logAgent = agents.find(a => a.id === log.agentId);
              return (
                <div key={`log-${log.id}-${index}`} className="flex items-center gap-2 opacity-80">
                  <Clock size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-400 ml-1">
                    {logAgent?.name || 'SYSTEM'}:
                  </span>
                  <span className="text-slate-300 italic flex items-center gap-1.5 text-[11px]">
                    {log.toolName ? (
                      <span className="bg-slate-800 px-1.5 rounded text-slate-400 border border-slate-700 text-[9px] uppercase">
                        {log.toolName}
                      </span>
                    ) : <MessageSquare size={10} />}
                    {log.activityType} - {log.details}
                  </span>
                  <span className="text-slate-700 ml-4">◆</span>
                </div>
              );
            }
          })}
        </motion.div>
      </div>
    </div>
  );
};
