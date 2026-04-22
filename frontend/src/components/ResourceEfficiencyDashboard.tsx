import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Cpu, 
  BarChart3, 
  Target, 
  Users, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  Maximize2
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { SwarmMetrics, resourceEfficiencyService } from "../app/apiService";

export const ResourceEfficiencyDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SwarmMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await resourceEfficiencyService.getMetrics();
      setMetrics(res.data);
    } catch (e) {
      console.error("Failed to fetch metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const radarData = metrics ? [
    { subject: 'Velocity', A: metrics.swarmRadar.velocity, fullMark: 100 },
    { subject: 'Intelligence', A: metrics.swarmRadar.intelligence, fullMark: 100 },
    { subject: 'Synergy', A: metrics.swarmRadar.synergy, fullMark: 100 },
    { subject: 'Stability', A: metrics.swarmRadar.stability, fullMark: 100 },
    { subject: 'Innovation', A: metrics.swarmRadar.innovation, fullMark: 100 },
  ] : [];

  return (
    <div className="bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-600/30 transition-all duration-1000" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-emerald-600/30 transition-all duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Cpu className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-3">
              SWARM EFFICIENCY
              <span className="text-indigo-500/50">|</span>
              <span className="text-indigo-400">군집 효율성 분석</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">
              에이전트 리소스 최적화 및 활동성 모니터링
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          onClick={fetchData}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
        >
          <RefreshCw className={loading ? "animate-spin text-indigo-400" : "text-slate-400"} size={20} />
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 relative z-10">
        
        {/* Left: Radar Chart & Score */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-6 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-6 left-6 flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Overall Score</span>
                <span className="text-5xl font-black text-white italic">{metrics?.overallScore || 0}</span>
             </div>
             
             <div className="w-full h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Swarm"
                      dataKey="A"
                      stroke="#818cf8"
                      fill="#818cf8"
                      fillOpacity={0.3}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 rounded-[2rem] border border-indigo-500/20 p-6">
            <h4 className="text-white text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <BrainCircuit size={14} className="text-indigo-400" />
              Intelligence Core Suggestions
            </h4>
            <div className="space-y-3">
              {metrics?.optimizationTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className={`mt-1 w-2 h-2 rounded-full ${tip.impact === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-[11px] font-black italic">{tip.title}</span>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black ${getImpactColor(tip.impact)}`}>{tip.impact} IMPACT</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-medium leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Agent Load Heatmap & Status */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
               <h4 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-emerald-400" />
                Active Swarm Units
              </h4>
              <span className="text-[10px] font-black text-slate-500 uppercase">{metrics?.agentMetrics.length} Agents Online</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-4 space-y-4">
              <AnimatePresence>
                {metrics?.agentMetrics.map((agent, i) => (
                  <motion.div
                    key={agent.agentId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group/card bg-black/30 hover:bg-black/40 border border-white/5 hover:border-indigo-500/30 p-5 rounded-3xl flex items-center gap-6 transition-all duration-500"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10 group-hover/card:border-indigo-500/50 transition-colors">
                        <span className="text-xl font-black text-white italic">{agent.agentName.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                        agent.status === 'ACTIVE' ? 'bg-emerald-500' : agent.status === 'OVERLOADED' ? 'bg-rose-500' : 'bg-slate-600'
                      }`} />
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-white text-[13px] font-black italic">{agent.agentName}</h5>
                          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">{agent.role}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            agent.status === 'OVERLOADED' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500 tracking-widest">
                            <span>Unit Load</span>
                            <span>{agent.load}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${agent.load}%` }}
                              className={`h-full ${agent.load > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500 tracking-widest">
                            <span>Efficiency</span>
                            <span>{agent.efficiency}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${agent.efficiency}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between bg-white/5 p-5 rounded-[2rem] border border-white/10 relative z-10">
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Optimization Status: Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/5 rounded-lg border border-white/5">
              <BarChart3 size={12} className="text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Last Analysis: {metrics ? new Date(metrics.updatedAt).toLocaleTimeString() : '---'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Maximize2 size={14} className="text-slate-700 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
};
