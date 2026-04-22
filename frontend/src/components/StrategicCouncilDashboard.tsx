import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Zap, 
  Lightbulb, 
  BarChart3, 
  Users, 
  Rocket, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { StrategicRecommendation, strategicCouncilService } from "../app/apiService";

export const StrategicCouncilDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<StrategicRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await strategicCouncilService.getRecommendations();
      setRecommendations(res.data);
    } catch (e) {
      console.error("Failed to fetch recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (id: number) => {
    setExecutingId(id);
    try {
      await strategicCouncilService.execute(id);
      await fetchData();
    } catch (e) {
      console.error("Execution failed:", e);
      alert("전략 실행 중 오류가 발생했습니다.");
    } finally {
      setExecutingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await strategicCouncilService.reject(id);
      await fetchData();
    } catch (e) {
      console.error("Rejection failed:", e);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TECH_DEBT': return <RefreshCw className="text-amber-400" size={18} />;
      case 'INNOVATION': return <Lightbulb className="text-indigo-400" size={18} />;
      case 'PERFORMANCE': return <Zap className="text-emerald-400" size={18} />;
      case 'SECURITY': return <Shield className="text-rose-400" size={18} />;
      case 'COLLABORATION': return <Users className="text-sky-400" size={18} />;
      default: return <BarChart3 className="text-slate-400" size={18} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'LOW': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-950/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Shield className="text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-2">
                HIVE STRATEGIC COUNCIL
                <span className="text-indigo-500/50">|</span>
                <span className="text-indigo-400">하이브 전략 위원회</span>
              </h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
                에이전트 집단 지성이 제안하는 프로젝트 진화 로드맵
              </p>
            </div>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
        >
          <RefreshCw className={loading ? "animate-spin text-indigo-400" : "text-slate-400"} size={20} />
        </motion.button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {recommendations.length === 0 ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <Sparkles size={48} className="text-slate-700 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest italic">분석된 전략적 제안이 없습니다</p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group bg-white/5 hover:bg-white/[0.07] rounded-[2rem] border transition-all duration-500 flex flex-col overflow-hidden ${
                    rec.status === 'EXECUTED' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
                  }`}
                >
                  <div className="p-6 flex flex-col gap-4">
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <div>
                          <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mb-1 ${getPriorityColor(rec.priority)}`}>
                            {rec.priority} PRIORITY
                          </div>
                          <h4 className="text-white text-lg font-black tracking-tight leading-tight">{rec.title}</h4>
                        </div>
                      </div>
                      {rec.status === 'EXECUTED' && (
                        <div className="bg-emerald-500/20 p-1 rounded-full">
                          <CheckCircle2 className="text-emerald-400" size={20} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <p className="text-slate-400 text-xs font-medium leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 italic">
                        "{rec.description}"
                      </p>
                      
                      {rec.analysisReasoning && (
                        <div className="flex gap-2 items-start">
                          <AlertTriangle className="text-amber-500/50 shrink-0 mt-0.5" size={14} />
                          <p className="text-[10px] text-slate-500 font-bold leading-tight">
                            AI 분석 결과: {rec.analysisReasoning.split('\n')[0].take(100)}...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-white/5 p-3 rounded-2xl flex flex-col gap-1 border border-white/5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">분류</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">{rec.category}</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl flex flex-col gap-1 border border-white/5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">예상 리소스</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">{rec.estimatedEffort} EFFORT</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase">{new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>

                      {rec.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReject(rec.id)}
                            className="p-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 rounded-2xl text-slate-400 hover:text-rose-400 transition-all"
                          >
                            <XCircle size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={executingId !== null}
                            onClick={() => handleExecute(rec.id)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                          >
                            {executingId === rec.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Rocket size={16} />
                            )}
                            LAUNCH MISSION
                            <ChevronRight size={14} />
                          </motion.button>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                          rec.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {rec.status === 'EXECUTED' ? (
                            <>
                              <Rocket size={12} className="animate-bounce" />
                              Mission In Progress
                            </>
                          ) : rec.status}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10 relative z-10">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Council Status: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Total Proposals: {recommendations.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic flex items-center gap-1">
            <Sparkles size={10} /> Powered by Swarm Intelligence
          </span>
        </div>
      </div>
    </div>
  );
};
