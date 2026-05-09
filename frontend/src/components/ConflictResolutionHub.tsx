"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, CheckCircle2, Clock, AlertTriangle, Users, MessageSquare, ArrowRight } from "lucide-react";

interface Conflict {
  id: number;
  title: String;
  description: String;
  agent1Name: String;
  agent2Name: String;
  mediatorName: String | null;
  status: String; // PENDING, RESOLVING, RESOLVED
  resolution: String | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const ConflictResolutionHub: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConflicts = async () => {
    try {
      const res = await fetch("/api/agent/conflicts");
      const data = await res.json();
      setConflicts(data);
      if (data.length > 0 && !selectedConflict) {
        setSelectedConflict(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch conflicts:", e);
      // 실패 시 더미 데이터 사용
      const dummyData: Conflict[] = [
        {
          id: 1,
          title: "코드 스타일 논쟁",
          description: "에이전트 A는 함수형 프로그래밍 스타일을 선호하는 반면, 에이전트 B는 객체지향 스타일을 고집하여 코드 리뷰에서 충돌이 발생했습니다.",
          agent1Name: "AgentA",
          agent2Name: "AgentB",
          status: "RESOLVED",
          mediatorName: "MediatorAgent",
          resolution: "두 스타일의 장점을 결합하여, 상태 관리는 객체지향으로 하되 비즈니스 로직은 순수 함수로 작성하기로 합의했습니다.",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          resolvedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 2,
          title: "API 엔드포인트 네이밍 충돌",
          description: "새로운 기능의 API 엔드포인트 이름을 두고 에이전트 C와 에이전트 D의 의견이 일치하지 않습니다.",
          agent1Name: "AgentC",
          agent2Name: "AgentD",
          status: "PENDING",
          mediatorName: null,
          resolution: null,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          resolvedAt: null
        },
        {
          id: 3,
          title: "리소스 할당 경쟁",
          description: "두 에이전트가 동시에 대용량 데이터 처리를 위해 동일한 컴퓨팅 리소스를 요청하여 병목 현상이 예상됩니다.",
          agent1Name: "AgentE",
          agent2Name: "AgentF",
          status: "RESOLVING",
          mediatorName: "ResourceManager",
          resolution: null,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          resolvedAt: null
        }
      ];
      setConflicts(dummyData);
      if (!selectedConflict) {
        setSelectedConflict(dummyData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: String) => {
    switch (status) {
      case "RESOLVED":
        return <CheckCircle2 className="text-emerald-400" size={18} />;
      case "RESOLVING":
        return <Zap className="text-amber-400 animate-pulse" size={18} />;
      case "PENDING":
        return <Clock className="text-slate-400" size={18} />;
      default:
        return <AlertTriangle className="text-red-400" size={18} />;
    }
  };

  const getStatusColor = (status: String) => {
    switch (status) {
      case "RESOLVED":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "RESOLVING":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "PENDING":
        return "border-slate-700 bg-slate-800/50 text-slate-400";
      default:
        return "border-red-500/30 bg-red-500/10 text-red-400";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">갈등 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 flex flex-col gap-8 h-full shadow-2xl overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-600/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <Shield className="text-red-400" size={24} />
            Swarm Conflict Resolution Hub
            <span className="text-white/20 font-light mx-2">|</span>
            <span className="text-red-400">군집 갈등 해결 허브</span>
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">에이전트 간의 갈등 상황 및 중재 프로세스 모니터링</p>
        </div>
        
        <div className="flex items-center gap-8 bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">PENDING</span>
              <span className="text-white text-xl font-black italic">{conflicts.filter(c => c.status === "PENDING").length}</span>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RESOLVING</span>
              <span className="text-amber-400 text-xl font-black italic">{conflicts.filter(c => c.status === "RESOLVING").length}</span>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RESOLVED</span>
              <span className="text-emerald-400 text-xl font-black italic">{conflicts.filter(c => c.status === "RESOLVED").length}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-10 overflow-hidden relative z-10">
        {/* Timeline / List Section */}
        <div className="w-full xl:w-2/5 flex flex-col gap-4 overflow-y-auto custom-scrollbar-dark pr-2">
          <AnimatePresence>
            {conflicts.map((conflict) => (
              <motion.div
                key={conflict.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-[2rem] border cursor-pointer transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${
                  selectedConflict?.id === conflict.id 
                    ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10' 
                    : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30'
                }`}
                onClick={() => setSelectedConflict(conflict)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(conflict.status)}
                    <span className="text-white font-bold text-sm tracking-tight">{conflict.title}</span>
                  </div>
                  <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusColor(conflict.status)}`}>
                    {conflict.status}
                  </div>
                </div>
                
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                  {conflict.description}
                </p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1 text-slate-600 text-[10px] font-bold uppercase">
                    <Users size={12} />
                    <span>{conflict.agent1Name} vs {conflict.agent2Name}</span>
                  </div>
                  <span className="text-slate-700 text-[9px] font-bold">
                    {new Date(conflict.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Detail & Visualization Section */}
        <div className="flex-1 bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden backdrop-blur-md">
          {selectedConflict ? (
            <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar-dark pr-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white text-xl font-black italic">{selectedConflict.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">발생 시각: {new Date(selectedConflict.createdAt).toLocaleString()}</span>
                    {selectedConflict.resolvedAt && (
                      <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">| 해결 시각: {new Date(selectedConflict.resolvedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${getStatusColor(selectedConflict.status)}`}>
                  {selectedConflict.status}
                </div>
              </div>

              <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                <p className="text-slate-300 text-sm leading-relaxed">{selectedConflict.description}</p>
              </div>

              {/* Visualization (Diagram) */}
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-6 relative min-h-[200px] justify-center">
                <div className="flex items-center gap-12 relative z-10">
                  {/* Agent 1 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 border-2 border-red-500/50 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/20">
                      {selectedConflict.agent1Name[selectedConflict.agent1Name.length - 1]}
                    </div>
                    <span className="text-slate-400 text-xs font-bold">{selectedConflict.agent1Name}</span>
                  </div>

                  {/* VS / Mediator */}
                  <div className="flex flex-col items-center gap-2 relative">
                    {selectedConflict.mediatorName ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                          M
                        </div>
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{selectedConflict.mediatorName}</span>
                        <div className="absolute top-1/2 left-[-40px] right-[-40px] h-0.5 bg-dashed bg-indigo-500/30 -z-10" />
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-900/50 border-2 border-red-500 flex items-center justify-center text-white font-black text-sm">
                        VS
                      </div>
                    )}
                  </div>

                  {/* Agent 2 */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 border-2 border-red-500/50 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-500/20">
                      {selectedConflict.agent2Name[selectedConflict.agent2Name.length - 1]}
                    </div>
                    <span className="text-slate-400 text-xs font-bold">{selectedConflict.agent2Name}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-4 flex items-center gap-2">
                  {getStatusIcon(selectedConflict.status)}
                  <span className="text-sm font-bold text-slate-300">
                    {selectedConflict.status === "RESOLVED" ? "해결 완료" : 
                     selectedConflict.status === "RESOLVING" ? "중재 진행 중" : "중재 대기 중"}
                  </span>
                </div>
              </div>

              {/* Resolution Section */}
              {selectedConflict.status === "RESOLVED" && selectedConflict.resolution && (
                <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">해결 방안</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{selectedConflict.resolution}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-30">
              <Shield size={48} />
              <p className="text-xs font-black uppercase tracking-widest">갈등 항목을 선택하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
