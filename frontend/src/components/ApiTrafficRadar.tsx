import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  DollarSign, 
  Zap, 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  ShieldCheck,
  Cpu,
  ArrowUpRight,
  Database
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { ApiTrafficStats, trafficService } from "../app/apiService";

export const ApiTrafficRadar: React.FC = () => {
  const [stats, setStats] = useState<ApiTrafficStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'PROVIDER' | 'MODEL'>('OVERVIEW');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await trafficService.getStats();
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch traffic stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const providerData = stats ? Object.entries(stats.usageByProvider).map(([name, value]) => ({
    name, value
  })) : [];

  const modelData = stats ? Object.entries(stats.usageByModel).map(([name, value]) => ({
    name, value
  })).sort((a, b) => b.value - a.value).slice(0, 5) : [];

  const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
          <p className="text-white text-[10px] font-black uppercase mb-1">{payload[0].name}</p>
          <p className="text-indigo-400 text-lg font-black italic">
            {payload[0].value.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold not-italic">TOKENS</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden group">
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-rose-500/20 transition-all duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] shadow-xl shadow-indigo-500/20">
            <Activity className="text-white" size={28} />
          </div>
          <div>
            <h3 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-3">
              API TRAFFIC RADAR
              <span className="text-indigo-500/50">|</span>
              <span className="text-indigo-400">군집 비용 감시</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">
              실시간 토큰 소모량 및 누적 운영 비용 분석
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {(['OVERVIEW', 'PROVIDER', 'MODEL'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${
                            viewMode === mode ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>
            <motion.button 
                whileHover={{ rotate: 180 }}
                onClick={fetchStats}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
            >
                <RefreshCw className={loading ? "animate-spin text-indigo-400" : "text-slate-400"} size={20} />
            </motion.button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
            { label: 'Cumulative Cost', value: `$${stats?.totalCost.toFixed(4) || '0.0000'}`, icon: DollarSign, color: 'text-emerald-400', sub: '누적 운영 비용' },
            { label: 'Total Tokens', value: stats?.totalTokens.toLocaleString() || '0', icon: Database, color: 'text-indigo-400', sub: '전체 사용 토큰' },
            { label: 'Active Models', value: stats ? Object.keys(stats.usageByModel).length : '0', icon: Cpu, color: 'text-purple-400', sub: '활성 AI 모델 수' }
        ].map((item, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-2 group/stat hover:bg-white/10 transition-all cursor-default"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    <item.icon size={16} className={item.color} />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white italic tracking-tighter">{item.value}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{item.sub}</span>
                </div>
            </motion.div>
        ))}
      </div>

      {/* Main Analysis Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 relative z-10">
        
        {/* Left: Visual Charts */}
        <div className="lg:col-span-7 bg-white/5 rounded-[3rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <h4 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-400" />
                    Usage Distribution
                </h4>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'PROVIDER' ? (
                        <PieChart>
                            <Pie
                                data={providerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {providerData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black text-slate-400 uppercase ml-2">{value}</span>} />
                        </PieChart>
                    ) : (
                        <BarChart data={modelData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                                width={120}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 10, 10, 0]}
                                barSize={20}
                            >
                                {modelData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* Right: Recent Logs */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between">
                    <h4 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-rose-400" />
                        Recent API Logs
                    </h4>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Last 10 Requests</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar-dark">
                    <AnimatePresence>
                        {stats?.recentLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-black/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between group/log hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                        <Zap size={16} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-[11px] font-black italic">{log.agentName}</span>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">{log.model.substring(0, 15)}...</span>
                                        </div>
                                        <p className="text-slate-600 text-[8px] font-bold uppercase tracking-widest mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white text-[11px] font-black italic">${log.estimatedCost.toFixed(5)}</p>
                                    <p className="text-slate-600 text-[8px] font-bold uppercase">{log.totalTokens} tokens</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-5 group cursor-default">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h5 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        Resource Guard Active
                        <ArrowUpRight size={12} className="text-slate-500" />
                    </h5>
                    <p className="text-slate-500 text-[9px] font-bold leading-relaxed mt-1">
                        군집의 비정상적인 토큰 소모를 감지하고 운영 비용을 최적화하고 있습니다.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
