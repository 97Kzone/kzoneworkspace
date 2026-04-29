import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Award, 
  History, 
  Shield, 
  Zap, 
  Star, 
  ChevronRight, 
  Activity, 
  Target, 
  Brain,
  RefreshCw,
  Search
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area 
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

  const radarData = useMemo(() => {
    if (!selectedAgent) return [];
    return Object.entries(selectedAgent.personalityTraits || {}).map(([key, value]) => ({
      subject: key,
      A: value,
      fullMark: 100,
    }));
  }, [selectedAgent]);

  const trendData = useMemo(() => {
    return [...evolutionLogs].reverse().map(log => ({
      time: new Date(log.createdAt).toLocaleDateString(),
      level: log.experienceLevel,
      missions: log.missionCount,
      ...log.personalityTraits
    }));
  }, [evolutionLogs]);

  const getExpertiseBadge = (level: number) => {
    if (level >= 10) return { label: "Ascended Master", color: "text-purple-400 bg-purple-400/10" };
    if (level >= 5) return { label: "Elite Architect", color: "text-indigo-400 bg-indigo-400/10" };
    if (level >= 3) return { label: "Senior Logicist", color: "text-emerald-400 bg-emerald-400/10" };
    return { label: "Novice Synthesizer", color: "text-slate-400 bg-slate-400/10" };
  };

  return (
    <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
            <TrendingUp className="text-white" size={28} />
          </div>
          <div>
            <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
              Hive Evolution Chronicles
              <span className="text-white/20 font-light">|</span>
              <span className="text-indigo-400">하이브 진화 연대기</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              에이전트의 페르소나 성장 및 기술적 진화 히스토리 분석
            </p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedAgentId === agent.id
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {agent.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden relative z-10">
        {/* Left Column: Profile & Radar */}
        <div className="xl:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar-dark pr-2">
          {selectedAgent && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedAgent.id}
              className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-indigo-500/30 flex items-center justify-center text-3xl font-black text-indigo-400 shadow-inner">
                    {selectedAgent.name[0]}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-slate-950 flex items-center justify-center">
                    <Star className="text-white" size={14} fill="currentColor" />
                  </div>
                </div>
                <div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-2 ${getExpertiseBadge(selectedAgent.experienceLevel).color}`}>
                    {getExpertiseBadge(selectedAgent.experienceLevel).label}
                  </div>
                  <h4 className="text-white text-xl font-black uppercase">{selectedAgent.name}</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 italic">{selectedAgent.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">EXP LEVEL</span>
                  <span className="text-xl font-black text-white italic">LV.{selectedAgent.experienceLevel}</span>
                </div>
                <div className="bg-black/20 p-4 rounded-3xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">MISSIONS</span>
                  <span className="text-xl font-black text-white italic">{selectedAgent.missionCount} OPS</span>
                </div>
              </div>

              <div className="relative h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 900 }}
                    />
                    <Radar
                      name={selectedAgent.name}
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                  <span>Persona Alignment</span>
                  <span>{Math.round(radarData.reduce((acc, d) => acc + d.A, 0) / 5)}% Stable</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(radarData.reduce((acc, d) => acc + d.A, 0) / 5)}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Middle & Right: History & Trends */}
        <div className="xl:col-span-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar-dark pr-2">
          {/* Trends Graph */}
          <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                Growth & Trait Variance
              </h4>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase">Analytical</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase">Bold</span>
                 </div>
              </div>
            </div>
            
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAna" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
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
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="ANALYTICAL" stroke="#6366f1" fillOpacity={1} fill="url(#colorAna)" strokeWidth={2} />
                  <Area type="monotone" dataKey="BOLD" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History List */}
          <div className="flex flex-col gap-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <History size={14} className="text-amber-400" />
                Evolution Log Entries
             </h4>
             
             <AnimatePresence mode="popLayout">
               {logsLoading ? (
                 <div className="h-32 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-indigo-500/50" size={32} />
                 </div>
               ) : evolutionLogs.length === 0 ? (
                 <div className="bg-white/5 rounded-3xl p-10 border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 gap-3">
                    <Brain size={40} strokeWidth={1} />
                    <p className="text-[9px] font-black uppercase tracking-widest italic">수집된 진화 로그가 없습니다</p>
                 </div>
               ) : (
                 evolutionLogs.map((log, idx) => (
                   <motion.div
                     key={log.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className="group bg-white/5 hover:bg-white/[0.08] rounded-[2rem] border border-white/5 hover:border-white/10 p-6 flex items-center justify-between transition-all"
                   >
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex flex-col items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-inner">
                            <span className="text-[8px] font-black text-slate-500 uppercase">LV</span>
                            <span className="text-lg font-black text-white leading-none">{log.experienceLevel}</span>
                         </div>
                         <div>
                            <p className="text-white text-xs font-black tracking-tight">{log.achievement || "Evolution Step Completed"}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[9px] text-slate-500 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-700" />
                               <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{log.missionCount}th Mission</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                         {Object.entries(log.personalityTraits).slice(0, 3).map(([trait, val]) => (
                            <div key={trait} className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/5 flex flex-col gap-0.5 items-center min-w-[50px]">
                               <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{trait[0]}</span>
                               <span className="text-[10px] font-black text-slate-300">{val}</span>
                            </div>
                         ))}
                         <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                            <ChevronRight size={16} />
                         </div>
                      </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10 relative z-10 shrink-0">
        <div className="flex gap-6">
           <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Neural Growth Synchronized</span>
           </div>
           <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Persona Stability High</span>
           </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
           <Search size={12} />
           <span className="text-[9px] font-black uppercase italic tracking-widest">Real-time Evolution Tracking Active</span>
        </div>
      </div>
    </div>
  );
};
