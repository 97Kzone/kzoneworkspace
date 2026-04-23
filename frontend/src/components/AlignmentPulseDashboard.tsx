import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Brain, 
  Activity, 
  ShieldAlert, 
  Handshake, 
  MessageSquareWarning,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  Split
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { alignmentService, CognitiveAlignmentReport, ConflictPoint } from "../app/apiService";
import ReactMarkdown from 'react-markdown';

interface AlignmentPulseDashboardProps {
  roomId: string;
}

export const AlignmentPulseDashboard: React.FC<AlignmentPulseDashboardProps> = ({ roomId }) => {
  const [report, setReport] = useState<CognitiveAlignmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictPoint[]>([]);

  useEffect(() => {
    fetchLatest();
  }, [roomId]);

  const fetchLatest = async () => {
    try {
      const res = await alignmentService.getLatest(roomId);
      if (res.data) {
        setReport(res.data);
        parseConflicts(res.data.conflicts);
      }
    } catch (e) {
      console.error("Failed to fetch latest alignment report", e);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await alignmentService.analyze(roomId);
      setReport(res.data);
      parseConflicts(res.data.conflicts);
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setLoading(false);
    }
  };

  const parseConflicts = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      setConflicts(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setConflicts([]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-emerald-400";
    if (score > 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden group">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-1000" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white text-3xl font-black italic tracking-tighter flex items-center gap-3">
              HIVE ALIGNMENT PULSE
              <span className="text-purple-500/50">|</span>
              <span className="text-purple-400">인지 정렬 모니터</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
              에이전트 간의 인지적 조화 및 추론 일치도 분석
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-slate-500 uppercase">Last Sync</span>
            <span className="text-xs font-bold text-white">{report ? new Date(report.createdAt).toLocaleTimeString() : 'Never'}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all group/btn"
          >
            <RefreshCw className={`${loading ? "animate-spin text-purple-400" : "text-slate-400 group-hover/btn:text-purple-400"}`} size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Run Analysis</span>
          </motion.button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 relative z-10">
        
        {/* Left: Stats & Score */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 flex flex-col items-center justify-center relative overflow-hidden group/score">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/score:opacity-100 transition-opacity" />
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Alignment Score</div>
            <div className={`text-8xl font-black italic mb-4 ${report ? getScoreColor(report.alignmentScore) : 'text-slate-700'}`}>
              {report?.alignmentScore || "--"}
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {report?.alignmentScore && report.alignmentScore > 80 ? "Harmonious" : report?.alignmentScore && report.alignmentScore > 50 ? "Stable" : "Dissonant"}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/10 p-6 flex flex-col gap-4 overflow-hidden">
             <h4 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                <ShieldAlert size={14} className="text-rose-400" />
                Detected Conflicts ({conflicts.length})
             </h4>
             <div className="flex-1 overflow-y-auto custom-scrollbar-dark space-y-3 pr-2">
                {conflicts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30">
                    <Handshake size={48} className="text-slate-500 mb-4" />
                    <p className="text-slate-400 text-xs font-bold italic">No active conflicts detected.</p>
                  </div>
                ) : (
                  conflicts.map((c, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group/conflict"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {c.agents.map((a, ai) => (
                            <span key={ai} className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black text-slate-300">
                              {a}
                            </span>
                          ))}
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black ${getSeverityColor(c.severity)}`}>
                          {c.severity}
                        </span>
                      </div>
                      <h5 className="text-white text-xs font-black italic mb-1 group-hover/conflict:text-purple-400 transition-colors">{c.topic}</h5>
                      <p className="text-slate-500 text-[10px] leading-relaxed">{c.description}</p>
                    </motion.div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Right: Mediation & Analysis */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Mediation Strategy & Intelligence
              </h4>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain size={14} className="text-purple-400" />
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
               {/* Mediation */}
               <div className="flex flex-col gap-4 overflow-hidden">
                  <div className="flex items-center gap-2 text-white/40 mb-1">
                    <Handshake size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Recommended Actions</span>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar-dark">
                    <div className="prose prose-invert prose-xs max-w-none prose-p:text-slate-400 prose-headings:text-white prose-strong:text-purple-400">
                      {report?.mediationStrategy ? (
                        <ReactMarkdown>{report.mediationStrategy}</ReactMarkdown>
                      ) : (
                        <p className="italic text-slate-600">분석을 실행하여 중재 전략을 생성하세요.</p>
                      )}
                    </div>
                  </div>
               </div>

               {/* Reasoning */}
               <div className="flex flex-col gap-4 overflow-hidden">
                  <div className="flex items-center gap-2 text-white/40 mb-1">
                    <Search size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Analysis Reasoning</span>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar-dark">
                    <div className="prose prose-invert prose-xs max-w-none prose-p:text-slate-400 prose-headings:text-white prose-li:text-slate-400">
                      {report?.analysisReasoning ? (
                        <ReactMarkdown>{report.analysisReasoning}</ReactMarkdown>
                      ) : (
                        <p className="italic text-slate-600">인지 프로세스 분석 결과가 여기에 표시됩니다.</p>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <Split size={16} className="text-purple-400" />
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Conflict Resolution Protocol</span>
                <span className="text-white text-xs font-bold">에이전트 간의 정렬 오류를 감지하면 자동으로 시스템 중재가 활성화됩니다.</span>
              </div>
            </div>
            <motion.button
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-purple-400 font-black text-[10px] uppercase tracking-widest"
            >
              Learn More <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
