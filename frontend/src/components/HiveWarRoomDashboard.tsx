"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, ShieldAlert, Zap, Cpu, Users, 
  Terminal, Send, CheckCircle, Clock, Activity,
  ChevronRight, ArrowRight, XCircle, RefreshCw
} from "lucide-react";
import { Agent, warRoomService, agentService, WarRoomIncident } from "../app/apiService";

export const HiveWarRoomDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<WarRoomIncident[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [pivotInstruction, setPivotInstruction] = useState("");
  const [isPivoting, setIsPivoting] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [incRes, agentRes] = await Promise.all([
        warRoomService.getActive(),
        agentService.getAll()
      ]);
      setIncidents(incRes.data);
      setAgents(agentRes.data);
      
      if (incRes.data.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incRes.data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch war room data", e);
    } finally {
      setLoading(false);
    }
  };

  const selectedIncident = useMemo(() => 
    incidents.find(i => i.id === selectedIncidentId), 
  [incidents, selectedIncidentId]);

  const handlePivot = async () => {
    if (!selectedIncidentId || !pivotInstruction.trim()) return;
    setIsPivoting(true);
    try {
      await warRoomService.pivot(selectedIncidentId, pivotInstruction);
      setPivotInstruction("");
      // 성공 피드백 (간단히 토스트 대신 로그에 남김)
    } catch (e) {
      console.error("Failed to provide pivot instruction", e);
    } finally {
      setIsPivoting(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await warRoomService.resolve(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (selectedIncidentId === id) setSelectedIncidentId(null);
    } catch (e) {
      console.error("Failed to resolve incident", e);
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-20 h-20 border-2 border-red-500/20 rounded-full animate-ping absolute" />
             <div className="w-20 h-20 border-t-2 border-red-500 rounded-full animate-spin relative z-10" />
          </div>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] animate-pulse">Scanning for Anomalies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 bg-[#050505] text-white overflow-hidden relative">
      {/* Global Alert Overlay for Critical */}
      {incidents.some(i => i.severity === 'CRITICAL') && (
        <div className="absolute inset-0 pointer-events-none border-[10px] border-red-600/10 animate-pulse z-50 shadow-[inset_0_0_100px_rgba(220,38,38,0.1)]" />
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={32} />
            HIVE WAR-ROOM
            <span className="text-white/10 font-light text-xl">/</span>
            <span className="text-red-500 text-lg uppercase tracking-widest">{incidents.length} ACTIVE INCIDENTS</span>
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black text-red-500/80 uppercase tracking-widest">Strategic Lockdown Active</span>
             </div>
             <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Operational Command & Control Center</div>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
              <Activity size={14} className="text-indigo-400" />
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-white/40 uppercase">System Strain</span>
                 <span className="text-xs font-black italic text-indigo-400">HIGH VELOCITY</span>
              </div>
           </div>
           <button 
             onClick={fetchData}
             className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
           >
             <RefreshCw size={16} />
           </button>
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left: Incident List */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 mb-2">Live Incident Feed</h3>
          <AnimatePresence mode="popLayout">
            {incidents.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 gap-4">
                 <CheckCircle size={32} />
                 <span className="text-[10px] font-black uppercase">All Systems Nominal</span>
              </div>
            ) : (
              incidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                    selectedIncidentId === incident.id 
                      ? "bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      incident.severity === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
                    }`}>
                      {incident.severity}
                    </div>
                    <span className="text-[9px] font-bold text-white/30">{new Date(incident.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-1 relative z-10">{incident.title}</h4>
                  <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed relative z-10">{incident.description}</p>
                  
                  {selectedIncidentId === incident.id && (
                    <motion.div 
                      layoutId="incident-highlight"
                      className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"
                    />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Center: Swarming Visualization */}
        <div className="col-span-6 bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden flex items-center justify-center">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          <AnimatePresence mode="wait">
            {selectedIncident ? (
              <motion.div 
                key={selectedIncident.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {agents.filter(a => selectedIncident.involvedAgents.includes(a.name) || a.status === 'RUNNING').map((agent, i) => {
                    const angle = (i / agents.length) * Math.PI * 2;
                    const radius = 250;
                    const x = 50 + Math.cos(angle) * 35;
                    const y = 50 + Math.sin(angle) * 35;
                    return (
                      <motion.line
                        key={agent.id}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        x1={`${x}%`} y1={`${y}%`}
                        x2="50%" y2="50%"
                        stroke={selectedIncident.severity === 'CRITICAL' ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>

                {/* Central Incident Node */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 40px rgba(239,68,68,0.2)",
                      "0 0 80px rgba(239,68,68,0.4)",
                      "0 0 40px rgba(239,68,68,0.2)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-48 h-48 rounded-full bg-black border-4 border-red-500 flex flex-col items-center justify-center gap-2 relative z-10"
                >
                  <AlertTriangle className="text-red-500" size={48} />
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active Core</span>
                     <span className="text-xs font-black italic">{selectedIncident.severity}</span>
                  </div>
                </motion.div>

                {/* Surrounding Agents */}
                {agents.map((agent, i) => {
                  const angle = (i / agents.length) * Math.PI * 2;
                  const radiusX = 40;
                  const radiusY = 40;
                  const x = 50 + Math.cos(angle) * radiusX;
                  const y = 50 + Math.sin(angle) * radiusY;
                  const isInvolved = selectedIncident.involvedAgents.includes(agent.name);

                  return (
                    <motion.div
                      key={agent.id}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20 ${isInvolved ? 'opacity-100' : 'opacity-20'}`}
                    >
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                         isInvolved ? 'bg-indigo-600/20 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10'
                       }`}>
                          <Cpu size={20} className={isInvolved ? 'text-indigo-400' : 'text-white/20'} />
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-white/10">{agent.name}</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/10">
                 <Zap size={64} strokeWidth={1} />
                 <span className="text-xl font-black italic uppercase tracking-[0.5em]">System Idle</span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Intervention & Analysis */}
        <div className="col-span-3 flex flex-col gap-6 overflow-hidden">
          
          {/* Analysis Card */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-4">
             <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} className="text-red-400" />
                Root Cause Analysis
             </h3>
             <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[11px] font-bold text-white/70 leading-relaxed italic">
                   {selectedIncident ? selectedIncident.description : "인시던트를 선택하여 상세 분석 내용을 확인하십시오."}
                </p>
             </div>
             {selectedIncident && (
               <button 
                 onClick={() => handleResolve(selectedIncident.id)}
                 className="mt-2 w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
               >
                 <CheckCircle size={14} />
                 Mark as Resolved
               </button>
             )}
          </div>

          {/* Intervention Terminal */}
          <div className="flex-1 bg-black border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                <Zap size={100} className="text-red-500" />
             </div>
             <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 relative z-10">
                <Zap size={14} className="text-yellow-400" />
                Tactical Intervention
             </h3>
             <textarea 
               value={pivotInstruction}
               onChange={(e) => setPivotInstruction(e.target.value)}
               placeholder="에이전트들에게 내릴 긴급 해결 전략을 입력하십시오..."
               className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-red-500/50 transition-all resize-none placeholder:text-white/10"
             />
             <button 
               onClick={handlePivot}
               disabled={isPivoting || !selectedIncidentId || !pivotInstruction.trim()}
               className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 rounded-2xl flex items-center justify-center gap-3 transition-all relative overflow-hidden shadow-lg shadow-red-600/20"
             >
                {isPivoting ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <>
                    <span className="text-xs font-black uppercase tracking-widest">Execute Strategy Pivot</span>
                    <ArrowRight size={16} />
                  </>
                )}
             </button>
          </div>
        </div>
      </div>

      {/* Footer Log Ticker */}
      <div className="h-12 bg-red-600/10 border-t border-red-600/30 flex items-center overflow-hidden relative group">
         <div className="bg-red-600 px-6 h-full flex items-center gap-3 relative z-10">
            <Zap size={16} className="text-white fill-white animate-pulse" />
            <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">LIVE FEED</span>
         </div>
         <div className="flex-1 overflow-hidden relative">
            <div 
              ref={tickerRef}
              className="flex items-center gap-20 whitespace-nowrap animate-ticker py-2 px-10"
              style={{ animation: 'ticker 60s linear infinite' }}
            >
               {incidents.length > 0 ? incidents.map((i, idx) => (
                 <div key={idx} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">[{i.severity}]</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{i.title}: {i.description}</span>
                    <span className="text-[10px] font-black text-white/20">///</span>
                 </div>
               )) : (
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">[NORMAL]</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Hive Cognitive Sync Stable. Monitoring for anomalies...</span>
                    <span className="text-[10px] font-black text-white/20">///</span>
                 </div>
               )}
            </div>
         </div>
         
         <style jsx>{`
           @keyframes ticker {
             0% { transform: translateX(0); }
             100% { transform: translateX(-50%); }
           }
           .animate-ticker {
             display: inline-flex;
           }
         `}</style>
      </div>
    </div>
  );
};
