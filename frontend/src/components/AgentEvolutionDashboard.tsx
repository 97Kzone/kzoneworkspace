"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Award, History, Shield, Zap, Star, 
  ChevronRight, Activity, Target, Brain, RefreshCw, 
  Search, BarChart3, PieChart, Layers, Gauge, Cpu, Code, ClipboardCheck, MessageCircle
} from "lucide-react";
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { Agent, AgentEvolutionLog, agentService, evolutionService } from "../app/apiService";

export const AgentEvolutionDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [evolutionLogs, setEvolutionLogs] = useState<AgentEvolutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchEvolutionLogs(selectedAgentId);
    }
  }, [selectedAgentId]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await agentService.getAll();
      setAgents(res.data);
      if (res.data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(res.data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch agents", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvolutionLogs = async (agentId: number) => {
    setLogsLoading(true);
    try {
      const res = await evolutionService.getHistory(agentId);
      setEvolutionLogs(res.data);
    } catch (e) {
      console.error("Failed to fetch evolution logs", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId), 
  [agents, selectedAgentId]);

  // 군집 평균 계산
  const swarmAverageTraits = useMemo(() => {
    if (agents.length === 0) return {};
    const traits = ["ANALYTICAL", "BOLD", "CAUTIOUS", "CREATIVE", "EMPATHETIC"];
    const averages: Record<string, number> = {};
    
    traits.forEach(trait => {
        const sum = agents.reduce((acc, agent) => acc + (agent.personalityTraits?.[trait] || 50), 0);
        averages[trait] = Math.round(sum / agents.length);
    });
    return averages;
  }, [agents]);

  const radarData = useMemo(() => {
    if (!selectedAgent) return [];
    return Object.entries(selectedAgent.personalityTraits || {}).map(([key, value]) => ({
      subject: key,
      A: value,
      B: swarmAverageTraits[key] || 50, // Swarm Average
      fullMark: 100,
    }));
  }, [selectedAgent, swarmAverageTraits]);

  const trendData = useMemo(() => {
    return [...evolutionLogs].reverse().map(log => ({
      time: new Date(log.createdAt).toLocaleDateString(),
      level: log.experienceLevel,
      missions: log.missionCount,
      ...log.personalityTraits
    }));
  }, [evolutionLogs]);

  // 업무 적합도 계산 로직
  const roleSuitability = useMemo(() => {
    if (!selectedAgent) return [];
    const traits = selectedAgent.personalityTraits || {};
    const getVal = (t: string) => traits[t] || 50;

    return [
      { 
        role: "System Architecture", 
        score: Math.round((getVal("ANALYTICAL") * 0.6 + getVal("CAUTIOUS") * 0.4)),
        icon: <Layers size={14} />,
        color: "bg-indigo-500"
      },
      { 
        role: "High-Speed Coding", 
        score: Math.round((getVal("CREATIVE") * 0.5 + getVal("BOLD") * 0.5)),
        icon: <Code size={14} />,
        color: "bg-emerald-500"
      },
      { 
        role: "Vulnerability Audit", 
        score: Math.round((getVal("CAUTIOUS") * 0.7 + getVal("ANALYTICAL") * 0.3)),
        icon: <ClipboardCheck size={14} />,
        color: "bg-amber-500"
      },
      { 
        role: "Cross-Agent Sync", 
        score: Math.round((getVal("EMPATHETIC") * 0.6 + getVal("BOLD") * 0.4)),
        icon: <MessageCircle size={14} />,
        color: "bg-purple-500"
      }
    ].sort((a, b) => b.score - a.score);
  }, [selectedAgent]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">연대기 데이터 분석 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-hidden p-2">
      {/* Top Header & Agent Cards */}
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
              <TrendingUp className="text-indigo-400" size={24} />
              Cognitive Reliability Hub
              <span className="text-white/20 font-light mx-2">|</span>
              <span className="text-indigo-400">에이전트 인지 신뢰성 분석실</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">개별 에이전트의 사고 정합성 성향 및 업무 신뢰성 지표 정량 분석</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-dark no-scrollbar">
          {agents.map((agent) => (
            <motion.button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              whileHover={{ y: -5 }}
              className={`min-w-[180px] p-5 rounded-[2rem] border transition-all relative overflow-hidden group ${
                selectedAgentId === agent.id 
                  ? "bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                  : "bg-white/5 border-white/5 hover:border-white/20"
              }`}
            >
              {selectedAgentId === agent.id && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl -mr-8 -mt-8" />
              )}
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black ${
                  selectedAgentId === agent.id ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-500"
                }`}>
                  {agent.name[0]}
                </div>
                <div className="text-left">
                  <h4 className="text-white text-sm font-black truncate max-w-[80px] uppercase">{agent.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{agent.role.split(' ')[0]}</p>
                </div>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Reliability</span>
                  <span className="text-xl font-black text-white italic leading-none">{agent.experienceLevel}%</span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                   agent.status === 'RUNNING' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-500'
                }`}>
                   {agent.status}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
        {/* Left: Persona & Suitability */}
        <div className="xl:col-span-5 flex flex-col gap-8 overflow-y-auto custom-scrollbar-dark pr-2">
          {selectedAgent && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-[3rem] border border-white/10 p-8 flex flex-col gap-8"
            >
              {/* Radar Chart Section */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-indigo-400" />
                    Persona Resonance
                  </h4>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[8px] font-black text-slate-500 uppercase">Agent</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full border border-white/30" />
                        <span className="text-[8px] font-black text-slate-500 uppercase">Swarm Avg</span>
                     </div>
                  </div>
                </div>

                <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900 }}
                      />
                      <Radar
                        name="Swarm Average"
                        dataKey="B"
                        stroke="rgba(255,255,255,0.2)"
                        fill="transparent"
                        strokeDasharray="4 4"
                      />
                      <Radar
                        name={selectedAgent.name}
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Role Suitability Section */}
              <div className="flex flex-col gap-5">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Gauge size={14} className="text-emerald-400" />
                    Operational Suitability Analysis
                 </h4>
                 <div className="grid grid-cols-1 gap-4">
                    {roleSuitability.map((role, idx) => (
                      <div key={idx} className="bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl ${role.color}/20 flex items-center justify-center text-white`}>
                                 {role.icon}
                              </div>
                              <span className="text-[11px] font-black text-white uppercase tracking-tight">{role.role}</span>
                           </div>
                           <span className="text-sm font-black text-white italic">{role.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${role.score}%` }}
                             transition={{ duration: 1, delay: idx * 0.1 }}
                             className={`h-full ${role.color}`}
                           />
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: History Timeline & Trends */}
        <div className="xl:col-span-7 flex flex-col gap-8 overflow-y-auto custom-scrollbar-dark pr-2">
          {/* Trends Module */}
          <div className="bg-white/5 rounded-[3rem] border border-white/10 p-8 flex flex-col gap-6 shrink-0">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Activity size={14} className="text-indigo-400" />
                   Cognitive Reliability Curve
                </h4>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Stability Guaranteed</span>
                </div>
             </div>

             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendData}>
                      <defs>
                         <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 900 }}
                      />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', fontSize: '10px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="level" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorLevel)" 
                        strokeWidth={3} 
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Vertical Timeline Module */}
          <div className="flex flex-col gap-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                <History size={14} className="text-amber-400" />
                Reliability Audit Chronicles
             </h4>

             <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                <AnimatePresence mode="popLayout">
                   {logsLoading ? (
                      <div className="flex items-center justify-center h-32">
                         <RefreshCw className="animate-spin text-indigo-500" size={32} />
                      </div>
                   ) : evolutionLogs.length === 0 ? (
                      <div className="ml-4 p-10 bg-white/5 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 gap-4">
                         <Brain size={48} strokeWidth={1} />
                         <p className="text-[10px] font-black uppercase tracking-widest">수집된 진화 로그가 없습니다</p>
                      </div>
                   ) : (
                      evolutionLogs.map((log, idx) => {
                        const isMajor = idx === 0 || log.experienceLevel > evolutionLogs[idx+1]?.experienceLevel;
                        return (
                          <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative group"
                          >
                             {/* Timeline Point */}
                             <div className={`absolute -left-[30px] top-1 w-[22px] h-[22px] rounded-full border-4 border-slate-950 flex items-center justify-center transition-all ${
                               isMajor ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800'
                             }`}>
                                {isMajor && <Star size={8} className="text-white fill-white" />}
                             </div>

                             <div className="bg-white/5 hover:bg-white/[0.08] rounded-[2rem] border border-white/5 p-6 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <p className="text-white text-sm font-black tracking-tight mb-1">{log.achievement || "Cognitive Safety Metrics Audited"}</p>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[9px] font-bold text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                                         <span className="w-1 h-1 rounded-full bg-slate-700" />
                                         <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">TASK #{log.missionCount}</span>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black text-slate-600 uppercase">Reliability</span>
                                      <span className="text-lg font-black text-white italic leading-none">{log.experienceLevel}%</span>
                                   </div>
                                </div>
                                
                                <div className="flex gap-2">
                                   {Object.entries(log.personalityTraits).map(([trait, val]) => (
                                      <div key={trait} className="px-3 py-2 rounded-xl bg-black/20 border border-white/5 flex flex-col gap-0.5 items-center min-w-[60px]">
                                         <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{trait}</span>
                                         <span className="text-[10px] font-black text-slate-300">{val}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </motion.div>
                        );
                      })
                   )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer System Status */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[2.5rem] border border-white/10 shrink-0">
         <div className="flex gap-10">
            <div className="flex items-center gap-3">
               <Cpu size={16} className="text-indigo-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive State Audited</span>
            </div>
            <div className="flex items-center gap-3">
               <Shield size={16} className="text-emerald-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Consistency Certified</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reliability Analyzer Live</span>
         </div>
      </div>
    </div>
  );
};
