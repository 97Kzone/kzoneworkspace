"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Heart, Info, Target, Sparkles, Activity, Share2 } from "lucide-react";
import { AgentSynergy, synergyService, Agent, agentService } from "../app/apiService";

export const SwarmSynergyMap: React.FC = () => {
  const [synergies, setSynergies] = useState<AgentSynergy[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<AgentSynergy | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [synRes, agentRes] = await Promise.all([
        synergyService.getAll(),
        agentService.getAll()
      ]);
      setSynergies(synRes.data);
      setAgents(agentRes.data);
    } catch (e) {
      console.error("Failed to fetch synergy data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAgentPos = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 140; // 약간 더 넓게 조정
    return {
      x: 250 + Math.cos(angle) * radius,
      y: 250 + Math.sin(angle) * radius
    };
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">시너지 매트릭스 동기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 flex flex-col gap-8 h-full shadow-2xl overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <Share2 className="text-indigo-400" size={24} />
            Swarm Synergy Matrix
            <span className="text-white/20 font-light mx-2">|</span>
            <span className="text-indigo-400">스웜 시너지 매트릭스</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">에이전트 간의 동적 협업 조화도 및 인지적 결합도 분석</p>
        </div>
        
        <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PEAK SYNERGY</span>
              <div className="flex items-center gap-2">
                 <Zap size={14} className="text-amber-400" />
                 <span className="text-white text-xl font-black italic">
                   {synergies.length > 0 ? Math.max(...synergies.map(s => s.synergyScore)) : 0}%
                 </span>
              </div>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ACTIVE LINKS</span>
              <span className="text-white text-xl font-black italic">{synergies.length} UNITS</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-10 items-center justify-center relative z-10 overflow-hidden">
        {/* Network Visualization Section */}
        <div className="relative w-[500px] h-[500px] shrink-0">
          <svg width="500" height="500" className="absolute inset-0 overflow-visible">
            {/* SVG Filter for Glow */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Links */}
            <AnimatePresence>
              {synergies.map((syn) => {
                const idx1 = agents.findIndex(a => a.name === syn.agent1Name);
                const idx2 = agents.findIndex(a => a.name === syn.agent2Name);
                if (idx1 === -1 || idx2 === -1) return null;

                const pos1 = getAgentPos(idx1, agents.length);
                const pos2 = getAgentPos(idx2, agents.length);
                
                const isAgentSelected = selectedAgentName === syn.agent1Name || selectedAgentName === syn.agent2Name;
                const isHovered = hoveredLink?.id === syn.id;
                const dimOpacity = selectedAgentName && !isAgentSelected ? 0.05 : 0.2;
                const baseOpacity = syn.synergyScore / 100;
                
                return (
                  <g key={syn.id}>
                    {/* Background Line (Static) */}
                    <motion.line
                      x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y}
                      stroke={syn.synergyScore > 80 ? "#10b981" : "#6366f1"}
                      strokeWidth={isHovered || isAgentSelected ? 4 : 1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHovered || isAgentSelected ? 0.5 : dimOpacity }}
                      className="transition-all duration-500"
                    />
                    
                    {/* Animated Flow Line (Active) */}
                    <motion.line
                      x1={pos1.x} y1={pos1.y} x2={pos2.x} y2={pos2.y}
                      stroke={syn.synergyScore > 80 ? "#34d399" : "#818cf8"}
                      strokeWidth={isHovered || isAgentSelected ? 3 : Math.max(1, syn.synergyScore / 30)}
                      strokeDasharray="10 15"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: 1, 
                        opacity: isHovered || isAgentSelected ? 1 : baseOpacity * 0.8,
                        strokeDashoffset: [0, -50] 
                      }}
                      transition={{ 
                        pathLength: { duration: 1.5 },
                        strokeDashoffset: { repeat: Infinity, duration: 2, ease: "linear" } 
                      }}
                      filter={syn.synergyScore > 70 ? "url(#glow)" : ""}
                      onMouseEnter={() => setHoveredLink(syn)}
                      onMouseLeave={() => setHoveredLink(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  </g>
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Agent Nodes */}
          {agents.map((agent, i) => {
            const pos = getAgentPos(i, agents.length);
            const isSelected = selectedAgentName === agent.name;
            const isDimmed = selectedAgentName && !isSelected;

            return (
              <motion.div
                key={agent.id}
                className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-3xl flex items-center justify-center shadow-2xl cursor-pointer z-20 group border-2 transition-all duration-300 ${
                  isSelected ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-indigo-500/40' : 
                  isDimmed ? 'bg-slate-900/50 border-slate-800 opacity-40' : 
                  'bg-slate-900 border-slate-700 hover:border-indigo-500/50'
                }`}
                style={{ left: pos.x, top: pos.y }}
                onClick={() => setSelectedAgentName(isSelected ? null : agent.name)}
                whileHover={{ scale: 1.1 }}
              >
                <div className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                  {agent.name[0]}
                </div>
                
                {/* Name Label */}
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isSelected ? 'text-indigo-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`}>
                  {agent.name}
                </div>
              </motion.div>
            );
          })}

          {/* Center Hub */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 shadow-[0_0_50px_rgba(99,102,241,0.1)] flex flex-col items-center justify-center relative">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                 className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/20"
               />
               <Activity size={32} className="text-indigo-400" />
               <span className="text-[7px] font-black text-slate-600 uppercase mt-1">Core Sync</span>
            </div>
          </div>
        </div>

        {/* Info & Report Panel */}
        <div className="flex-1 w-full max-w-md h-full flex flex-col gap-6 overflow-hidden">
          <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6 h-full backdrop-blur-md">
             <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                   <Target size={16} className="text-indigo-500" />
                   Collaboration Insights
                </h4>
                {selectedAgentName && (
                  <button 
                    onClick={() => setSelectedAgentName(null)}
                    className="text-[9px] font-black text-indigo-400 uppercase hover:underline"
                  >
                    필터 해제
                  </button>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar-dark space-y-4 pr-3">
                {synergies.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-30">
                      <div className="p-5 rounded-full bg-slate-900"><Info size={40} /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest">데이터 수집 중...</p>
                   </div>
                ) : (
                   synergies
                    .filter(s => !selectedAgentName || s.agent1Name === selectedAgentName || s.agent2Name === selectedAgentName)
                    .sort((a,b) => b.synergyScore - a.synergyScore)
                    .map((syn) => (
                      <motion.div 
                        key={syn.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 rounded-[2rem] border transition-all relative overflow-hidden group ${
                          hoveredLink?.id === syn.id ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg' : 'bg-black/20 border-white/5'
                        }`}
                        onMouseEnter={() => setHoveredLink(syn)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                         {/* High Synergy Glow Effect */}
                         {syn.synergyScore > 85 && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                         )}

                         <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white text-[11px] font-black tracking-tight uppercase italic">{syn.agent1Name}</span>
                                  <ArrowRight size={10} className="text-slate-600" />
                                  <span className="text-white text-[11px] font-black tracking-tight uppercase italic">{syn.agent2Name}</span>
                               </div>
                               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{syn.collaborationCount}회 협업 수행</p>
                            </div>
                            <div className="flex flex-col items-end">
                               <div className="flex items-center gap-1.5 mb-1">
                                  <Heart size={12} className={syn.synergyScore > 80 ? "text-rose-500 fill-rose-500" : "text-slate-600"} />
                                  <span className={`text-lg font-black italic ${syn.synergyScore > 80 ? 'text-emerald-400' : 'text-indigo-400'}`}>{syn.synergyScore}%</span>
                               </div>
                               <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Resonance Score</span>
                            </div>
                         </div>

                         <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4 relative z-10">
                            <motion.div 
                              className={`h-full ${syn.synergyScore > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${syn.synergyScore}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                         </div>

                         <div className="bg-black/20 p-3 rounded-xl border border-white/5 relative z-10">
                            <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                              "{syn.synergyNote || "두 에이전트 간의 조화로운 연산 최적화가 진행되었습니다."}"
                            </p>
                         </div>
                         
                         <div className="mt-3 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               <span className="text-[8px] font-black text-slate-600 uppercase">Synchronized</span>
                            </div>
                            <span className="text-[8px] font-black text-slate-600 uppercase">Last Link: {new Date(syn.lastCollaboratedAt).toLocaleDateString()}</span>
                         </div>
                      </motion.div>
                   ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Arrow Icon
const ArrowRight = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);
