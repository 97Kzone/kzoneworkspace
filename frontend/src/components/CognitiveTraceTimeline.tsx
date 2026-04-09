import { motion } from "framer-motion";
import { Brain, Target, ShieldAlert, Zap, Activity } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { CognitiveTrace, Agent } from "../app/apiService";

/**
 * 에이전트의 사고 과정(Planning, Inference 등)을 타임라인으로 표시
 */
export const CognitiveTraceTimeline = ({ 
  traces, 
  getAgentColor, 
  agents 
}: { 
  traces: CognitiveTrace[], 
  getAgentColor: (name: string) => any, 
  agents: Agent[] 
}) => {
    // 각 트레이스 타입별 아이콘 및 레이블 매핑
    const typeConfigs: Record<string, { icon: any, color: string, label: string }> = {
        'PLANNING': { icon: Target, color: 'text-sky-400', label: '차세대 전략 수립' },
        'INFERENCE': { icon: Brain, color: 'text-indigo-400', label: '논리적 추론 도출' },
        'VALIDATION': { icon: ShieldAlert, color: 'text-amber-400', label: '자율 무결성 검증' },
        'CORRECTION': { icon: Zap, color: 'text-rose-400', label: '인지적 평형 복구' },
        'OBSERVATION': { icon: Activity, color: 'text-emerald-400', label: '코드 시퀀스 관측' }
    };

    return (
        <div className="space-y-8 p-4 pt-6 relative before:absolute before:inset-y-0 before:left-10 before:w-px before:bg-slate-800/50 overflow-x-hidden">
            {traces.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-50 italic">
                    <Brain size={32} className="mb-2" />
                    추론 데이터가 아직 수집되지 않았습니다.
                </div>
            ) : traces.map((trace, i) => {
                const config = typeConfigs[trace.type] || typeConfigs['INFERENCE'];
                const Icon = config.icon;
                const agent = agents.find(a => a.id === Number(trace.agentId));
                const agentName = agent?.name || "미지정";

                return (
                    <motion.div 
                        key={trace.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-14 group"
                    >
                        {/* 타임라인 점(Dot) */}
                        <div className={`absolute left-10 top-2 w-5 h-5 rounded-full border-4 border-slate-900 bg-slate-800 z-10 group-hover:scale-125 group-hover:bg-indigo-500 transition-all duration-300 transform -translate-x-1/2 shadow-[0_0_15px_rgba(99,102,241,0.2)]`} />

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 hover:border-indigo-500/40 transition-all shadow-xl backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center ${config.color} shadow-lg shadow-black/20`}>
                                        <Icon size={24} className={trace.type === 'CORRECTION' ? 'animate-pulse' : ''} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${config.color}`}>
                                                {config.label}
                                            </span>
                                            {trace.type === 'CORRECTION' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                                        </div>
                                        <h5 className="text-[12px] font-black text-slate-100 flex items-center gap-2 mt-1">
                                            <span className={getAgentColor(agentName).soft}>{agentName}</span>
                                            <span className="text-slate-600 font-normal">/</span>
                                            <span className="text-slate-500 font-mono text-[10px] uppercase tracking-tighter">{new Date(trace.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </h5>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">추론 신뢰도</span>
                                        <span className={`text-[10px] font-mono font-bold ${trace.confidence > 0.8 ? 'text-emerald-400' : 'text-indigo-400'}`}>{(trace.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${trace.confidence * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full bg-gradient-to-r ${trace.confidence > 0.8 ? 'from-emerald-500 to-teal-400' : 'from-indigo-500 to-violet-400'} shadow-[0_0_8px_rgba(99,102,241,0.5)]`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-300 leading-relaxed font-medium bg-black/30 p-5 rounded-2xl border border-white/5 shadow-inner">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        code: ({ node, ...props }) => (
                                          <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-slate-700" {...props} />
                                        ),
                                        strong: ({ children }) => <strong className="text-white font-black">{children}</strong>,
                                    }}
                                >
                                    {trace.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
            <div className="h-10" />
        </div>
    );
};
