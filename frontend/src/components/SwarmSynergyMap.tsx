import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Heart, Info, Target, Sparkles } from "lucide-react";
import { AgentSynergy, synergyService, Agent, agentService } from "../app/apiService";

export const SwarmSynergyMap: React.FC = () => {
  const [synergies, setSynergies] = useState<AgentSynergy[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<AgentSynergy | null>(null);

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
    const radius = 120;
    return {
      x: 200 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius
    };
  };

  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.name] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-10 flex flex-col gap-8 h-full shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8">
        <Sparkles className="text-indigo-400 animate-pulse" size={24} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg font-black uppercase tracking-tight italic flex items-center gap-3">
            <Users className="text-indigo-400" size={20} />
            스웜 시너지 매트릭스
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">에이전트 간의 협업 조화도 및 신뢰 지표</p>
        </div>
        <div className="flex gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-emerald-400 uppercase">최고 시너지</span>
              <span className="text-white text-xs font-black italic">
                {synergies.length > 0 ? [...synergies].sort((a,b) => b.synergyScore - a.synergyScore)[0].synergyScore : 0}%
              </span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-10 items-center justify-center">
        {/* Network Visualization */}
        <div className="relative w-[400px] h-[400px] shrink-0">
          <svg width="400" height="400" className="absolute inset-0">
            {/* Links */}
            <AnimatePresence>
              {synergies.map((syn) => {
                const idx1 = agents.findIndex(a => a.name === syn.agent1Name);
                const idx2 = agents.findIndex(a => a.name === syn.agent2Name);
                if (idx1 === -1 || idx2 === -1) return null;

                const pos1 = getAgentPos(idx1, agents.length);
                const pos2 = getAgentPos(idx2, agents.length);
                const isHovered = hoveredLink?.id === syn.id;

                return (
                  <motion.line
                    key={syn.id}
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={isHovered ? "#818cf8" : `rgba(129, 140, 248, ${syn.synergyScore / 150})`}
                    strokeWidth={isHovered ? 4 : Math.max(1, syn.synergyScore / 20)}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    onMouseEnter={() => setHoveredLink(syn)}
                    onMouseLeave={() => setHoveredLink(null)}
                    style={{ cursor: 'pointer' }}
                  />
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
                className="absolute w-12 h-12 -ml-6 -mt-6 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-xl group cursor-help"
                style={{ left: pos.x, top: pos.y }}
                whileHover={{ scale: 1.2, borderColor: '#818cf8' }}
              >
                <div className="text-[10px] font-black text-white">{agent.name[0]}</div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {agent.name}
                </div>
              </motion.div>
            );
          })}

          {/* Center Info */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
              <Zap size={24} className="text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6 flex-1 flex flex-col gap-4 min-w-[300px]">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} />
                실시간 시너지 리포트
             </h4>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar-dark space-y-4 pr-2">
                {synergies.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Info size={24} />
                      <p className="text-[9px] font-bold uppercase">충분한 협업 데이터가 없습니다</p>
                   </div>
                ) : (
                   synergies.sort((a,b) => b.synergyScore - a.synergyScore).map((syn) => (
                      <motion.div 
                        key={syn.id}
                        className={`p-4 rounded-2xl border transition-all ${hoveredLink?.id === syn.id ? 'bg-indigo-500/20 border-indigo-500/50 scale-[1.02]' : 'bg-white/5 border-white/5'}`}
                      >
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-white uppercase italic">{syn.agent1Name} x {syn.agent2Name}</span>
                            <div className="flex items-center gap-1">
                               <Heart size={10} className={syn.synergyScore > 70 ? "text-rose-500 fill-rose-500" : "text-slate-500"} />
                               <span className={`text-[10px] font-black ${syn.synergyScore > 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>{syn.synergyScore}%</span>
                            </div>
                         </div>
                         <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                            <motion.div 
                              className={`h-full ${syn.synergyScore > 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${syn.synergyScore}%` }}
                            />
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic">{syn.synergyNote || "표준 협업 프로토콜 가동 중"}</p>
                         <div className="mt-2 flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-600 uppercase">협업 횟수: {syn.collaborationCount}회</span>
                            <span className="text-[8px] font-black text-slate-600 uppercase">최근: {new Date(syn.lastCollaboratedAt).toLocaleDateString()}</span>
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
