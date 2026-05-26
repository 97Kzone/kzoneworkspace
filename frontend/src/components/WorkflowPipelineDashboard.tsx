import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  RefreshCw,
  TrendingUp,
  Workflow
} from "lucide-react";
import { workflowPipelineService, PipelineMetrics, OptimizationRecommendation } from "../app/apiService";

export const WorkflowPipelineDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await workflowPipelineService.getMetrics();
      setMetrics(res.data);
    } catch (e) {
      console.error("Failed to fetch pipeline metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15초마다 자동 갱신
    return () => clearInterval(interval);
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOTTLENECK': return 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
      case 'ACTIVE': return 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400';
      case 'IDLE': return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const handleApplyOptimization = async (rec: OptimizationRecommendation) => {
    setApplyingId(rec.targetStageId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await workflowPipelineService.applyOptimization(rec.targetStageId, rec.title);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchData();
      } else {
        setErrorMessage("최적화 파이프라인 조치를 적용하지 못했습니다.");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("백엔드 서버 통신 중 오류가 발생했습니다.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-rose-600/20 transition-all duration-1000" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-rose-600 rounded-2xl shadow-lg">
            <Workflow className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-3">
              PIPELINE OPTIMIZER
              <span className="text-white/20">|</span>
              <span className="text-indigo-400">워크플로우 최적화</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              에이전트 파이프라인 병목 분석 및 자동 스케일링
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {metrics && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">전체 효율성 (Efficiency)</span>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={metrics.overallEfficiency >= 80 ? "text-emerald-400" : metrics.overallEfficiency >= 50 ? "text-amber-400" : "text-rose-400"} />
                <span className="text-3xl font-black text-white italic">{metrics.overallEfficiency}%</span>
              </div>
            </div>
          )}
          <motion.button 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            onClick={fetchData}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={loading ? "animate-spin text-indigo-400" : "text-slate-400"} size={20} />
          </motion.button>
        </div>
      </div>

      {/* Notification Bar */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-20"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-20"
          >
            <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-8 relative z-10">
        {loading && !metrics ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="animate-spin text-indigo-500/50" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Pipeline Metrics...</p>
            </div>
          </div>
        ) : metrics && (
          <>
            {/* Pipeline Visualization */}
            <div className="bg-black/40 rounded-[2rem] border border-white/5 p-8 relative">
              <h4 className="text-white text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" />
                Live Pipeline Stages
              </h4>
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {metrics.stages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex-1 w-full min-w-[200px] p-6 rounded-3xl border transition-all duration-300 relative group/card ${getStatusColor(stage.status)}`}
                    >
                      {stage.status === 'BOTTLENECK' && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{stage.status}</span>
                        {stage.status === 'BOTTLENECK' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                      </div>
                      
                      <h5 className="text-white font-black text-lg mb-1">{stage.name}</h5>
                      <p className="text-xs font-bold opacity-60 mb-6 flex items-center gap-1">
                        <Cpu size={12} /> {stage.agentName}
                      </p>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-60 font-medium">Avg Time</span>
                          <span className="font-bold flex items-center gap-1"><Clock size={12} /> {stage.avgTimeSec}s</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-60 font-medium">Success Rate</span>
                          <span className="font-bold text-white">{stage.successRate}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-60 font-medium">Queue</span>
                          <span className={`font-bold ${stage.queueSize > 10 ? 'text-rose-400' : 'text-white'}`}>{stage.queueSize} tasks</span>
                        </div>
                      </div>

                      {/* Bottleneck indicator bar */}
                      <div className="mt-6 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.bottleneckScore}%` }}
                          className={`h-full ${stage.status === 'BOTTLENECK' ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </motion.div>

                    {index < metrics.stages.length - 1 && (
                      <div className="flex items-center justify-center px-2 opacity-30">
                        <ArrowRight size={24} className="hidden lg:block text-white" />
                        <ArrowRight size={24} className="block lg:hidden text-white rotate-90" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {metrics.recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-500/5 to-rose-500/5 rounded-[2rem] border border-white/5 p-8">
                <h4 className="text-white text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BrainCircuit size={14} className="text-rose-400" />
                  AI Optimization Suggestions
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.recommendations.map((rec, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-black/30 hover:bg-black/50 border border-white/5 hover:border-indigo-500/30 p-6 rounded-3xl transition-all flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${rec.impact === 'HIGH' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                          <h5 className="text-white text-sm font-black tracking-tight">{rec.title}</h5>
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black ${getImpactColor(rec.impact)}`}>
                          {rec.impact} IMPACT
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-xs font-medium leading-relaxed flex-1">
                        {rec.description}
                      </p>

                      <div className="pt-4 border-t border-white/5">
                        <button 
                          onClick={() => handleApplyOptimization(rec)}
                          disabled={applyingId === rec.targetStageId}
                          className="w-full py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-50 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {applyingId === rec.targetStageId ? (
                            <Loader2 className="animate-spin text-indigo-400" size={14} />
                          ) : (
                            <TrendingUp size={14} />
                          )}
                          {applyingId === rec.targetStageId ? "최적화 적용 중..." : "자동 최적화 적용"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Only needed for the fallback loading state
const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
