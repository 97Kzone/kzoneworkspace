import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Sparkles, Info, BrainCircuit, Globe, MessageSquare } from "lucide-react";
import { NeuralResonance, resonanceService, Agent, agentService } from "../app/apiService";

export const NeuralResonanceMap: React.FC = () => {
  const [resonances, setResonances] = useState<NeuralResonance[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResonance, setSelectedResonance] = useState<NeuralResonance | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resRes, agentRes] = await Promise.all([
        resonanceService.getLatest(),
        agentService.getAll()
      ]);
      setResonances(resRes.data);
      setAgents(agentRes.data);
    } catch (e) {
      console.error("Failed to fetch resonance data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAgentPos = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 130;
    return {
      x: 200 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius
    };
  };

  const triggerAnalysis = async () => {
    try {
      await resonanceService.analyze();
      fetchData();
    } catch (e) {
      console.error("Failed to trigger analysis:", e);
    }
  };

  return (
    <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 flex flex-col gap-8 h-full shadow-2xl relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-white text-lg font-black uppercase tracking-tight italic flex items-center gap-3">
            <BrainCircuit className="text-purple-400" size={24} />
            Hive Neural Resonance
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">에이전트 간 암묵적 지식 패턴 및 신경 공명 분석</p>
        </div>
        <button 
          onClick={triggerAnalysis}
          className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all group"
        >
          <Zap size={14} className="text-purple-400 group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase italic">정밀 분석 실행</span>
        </button>
      </div>

      <div className="flex-1 flex gap-10 items-center justify-center relative z-10">
        {/* Neural Network Visualization */}
        <div className="relative w-[400px] h-[400px] shrink-0">
          <svg width="400" height="400" className="absolute inset-0">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Resonance Links */}
            <AnimatePresence>
              {resonances.map((res) => {
                const idx1 = agents.findIndex(a => a.name === res.sourceAgentName);
                const idx2 = agents.findIndex(a => a.name === res.targetAgentName);
                if (idx1 === -1 || idx2 === -1) return null;

                const pos1 = getAgentPos(idx1, agents.length);
                const pos2 = getAgentPos(idx2, agents.length);
                const isSelected = selectedResonance?.id === res.id;

                return (
                  <g key={res.id} onClick={() => setSelectedResonance(res)} style={{ cursor: 'pointer' }}>
                    <motion.line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={isSelected ? "url(#lineGrad)" : "rgba(192, 132, 252, 0.2)"}
                      strokeWidth={isSelected ? 4 : 2}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: isSelected ? 1 : [0.2, 0.4, 0.2],
                        strokeDasharray: isSelected ? "0" : "5,5"
                      }}
                      transition={{ 
                        pathLength: { duration: 1.5, ease: "easeOut" },
                        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                    />
                    {isSelected && (
                      <motion.circle
                        cx={(pos1.x + pos2.x) / 2}
                        cy={(pos1.y + pos2.y) / 2}
                        r={6}
                        fill="#f472b6"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </g>
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Agent Nodes */}
          {agents.map((agent, i) => {
            const pos = getAgentPos(i, agents.length);
            return (
              <motion.div
                key={agent.id}
                className="absolute w-14 h-14 -ml-7 -mt-7 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.1)] group cursor-pointer"
                style={{ left: pos.x, top: pos.y }}
                whileHover={{ scale: 1.2, borderColor: '#c084fc', boxShadow: '0 0 30px rgba(192,132,252,0.3)' }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-black text-white relative z-10">{agent.name[0]}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-2 py-1 rounded-md whitespace-nowrap text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {agent.name}
                </div>
              </motion.div>
            );
          })}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border border-purple-500/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/5 border border-purple-500/20 animate-pulse flex items-center justify-center">
                 <Globe className="text-purple-400/40" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Insight Panel */}
        <div className="flex-1 flex flex-col gap-6 max-w-[400px]">
          <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 flex flex-col gap-6 min-h-[400px]">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-pink-400" />
              Resonance Insight Codex
            </h4>

            <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-4 space-y-4">
              {resonances.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                  <Info size={40} strokeWidth={1} />
                  <p className="text-[9px] font-bold uppercase text-center leading-loose">
                    에이전트들이 충분한 활동을 마친 후<br/>암묵적 신경 공명이 탐지됩니다
                  </p>
                </div>
              ) : (
                resonances.map((res) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedResonance(res)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedResonance?.id === res.id 
                        ? 'bg-purple-500/20 border-purple-500/50 scale-[1.02] shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                          {res.sourceAgentName} <span className="text-slate-600">⇌</span> {res.targetAgentName}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-pink-400">STR: {(res.resonanceStrength * 100).toFixed(0)}%</span>
                    </div>
                    
                    <h5 className="text-[11px] font-black text-purple-300 mb-2 flex items-center gap-2">
                      <MessageSquare size={12} />
                      {res.resonanceTheme}
                    </h5>
                    
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                      "{res.synthesizedInsight}"
                    </p>
                    
                    <div className="mt-4 flex justify-between items-center opacity-50">
                       <span className="text-[7px] font-bold text-slate-500 uppercase">{new Date(res.createdAt).toLocaleTimeString()} DETECTED</span>
                       <Activity size={10} className="text-purple-500" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {resonances.length > 0 && (
               <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/10">
                  <p className="text-[8px] font-black text-purple-400/60 uppercase tracking-widest mb-1">Swarm collective Intelligence</p>
                  <p className="text-[9px] font-bold text-slate-300 leading-normal">
                    현재 {resonances.length}개의 활성 신경 공명이 발견되었습니다. 에이전트들이 공통의 지식 계층을 형성하며 최적화되고 있습니다.
                  </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
