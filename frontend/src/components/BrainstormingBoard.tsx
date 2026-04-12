"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Send, Users, Sparkles, ChevronRight, 
  CheckCircle2, Loader2, Target, Lightbulb, Bot, User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BrainstormingSession, brainstormingService, Agent } from '../app/apiService';

interface BrainstormingBoardProps {
  agents: Agent[];
  sessions: BrainstormingSession[];
  onSessionStarted: () => void;
  getAgentColor: (name: string) => { bg: string, text: string, soft: string };
}

export const BrainstormingBoard: React.FC<BrainstormingBoardProps> = ({ 
  agents, 
  sessions, 
  onSessionStarted,
  getAgentColor 
}) => {
  const [goal, setGoal] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<BrainstormingSession | null>(
    sessions.length > 0 ? sessions[0] : null
  );

  const handleStartSession = async () => {
    if (!goal || selectedAgentIds.length === 0) return;
    
    setIsStarting(true);
    try {
      const res = await brainstormingService.start({
        roomId: 'default',
        goal,
        agentIds: selectedAgentIds
      });
      setActiveSession(res.data);
      onSessionStarted();
      setGoal('');
      setSelectedAgentIds([]);
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const toggleAgent = (id: number) => {
    if (selectedAgentIds.includes(id)) {
      setSelectedAgentIds(selectedAgentIds.filter(aid => aid !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  return (
    <div className="flex flex-col h-full gap-8">
      {/* Header & Init Section */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">집단 브레인스토밍 본부</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">에이전트 협업 전략 수립 시스템</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">미션 목표 설정</label>
              <textarea 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="어떤 문제를 해결하고 싶으신가요? (예: 실시간 알림 시스템 아키텍처 설계)"
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[140px] resize-none"
              />
            </div>
          </div>

          <div className="space-y-6">
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-1">공동 작업 에이전트 선택 ({selectedAgentIds.length})</label>
                <div className="flex flex-wrap gap-3">
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${selectedAgentIds.includes(agent.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                    >
                      <div className={`w-6 h-6 rounded-lg ${selectedAgentIds.includes(agent.id) ? 'bg-white/20' : getAgentColor(agent.name).bg} flex items-center justify-center text-[10px] font-bold`}>
                        {agent.name[0]}
                      </div>
                      <span className="text-xs font-black tracking-tight">{agent.name}</span>
                    </button>
                  ))}
                </div>
             </div>
             
             <button 
               onClick={handleStartSession}
               disabled={!goal || selectedAgentIds.length === 0 || isStarting}
               className="w-full h-16 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95"
             >
                {isStarting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    브레인스토밍 진행 중...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    브레인스토밍 세션 시작
                  </>
                )}
             </button>
          </div>
        </div>
      </section>

      {/* Sessions Display */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
         {/* Session List */}
         <div className="xl:col-span-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">최근 세션 기록</h3>
            {sessions.map(s => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => setActiveSession(s)}
                className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeSession?.id === s.id ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-50' : 'bg-white/50 border-slate-100 hover:bg-white hover:border-indigo-100'}`}
              >
                 <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${s.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                      {s.status}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                 </div>
                 <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-relaxed">{s.goal}</h4>
              </motion.div>
            ))}
            {sessions.length === 0 && (
              <div className="h-40 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-2 opacity-60">
                <Target size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">저장된 세션이 없습니다</span>
              </div>
            )}
         </div>

         {/* Active Session Detail */}
         <div className="xl:col-span-2 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeSession ? (
                <motion.div 
                  key={activeSession.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col h-full"
                >
                   <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Lightbulb size={20} />
                         </div>
                         <div>
                            <h3 className="text-sm font-black text-slate-800 leading-tight">세션 상세 리포트</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{activeSession.id} • 참여 에이전트: {activeSession.contributions.length}명</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        {activeSession.status === 'COMPLETED' && (
                          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                             <CheckCircle2 size={12} />
                             워크스트림으로 변환
                          </button>
                        )}
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">미션 목표</label>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100/50 text-sm font-bold text-slate-700 leading-relaxed italic">
                           "{activeSession.goal}"
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">에이전트별 초기 제안</label>
                        <div className="space-y-4">
                           {activeSession.contributions.map(c => (
                             <div key={c.id} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                   <div className={`w-8 h-8 rounded-xl ${getAgentColor(c.agentName).bg} flex items-center justify-center text-white text-[10px] font-bold`}>
                                      {c.agentName[0]}
                                   </div>
                                   <div>
                                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{c.agentName}</h5>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.agentRole}</p>
                                   </div>
                                </div>
                                <div className="text-[12px] font-medium text-slate-600 leading-relaxed markdown-content">
                                   <ReactMarkdown>{c.content}</ReactMarkdown>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>

                      {activeSession.finalBlueprint && (
                        <div className="space-y-6">
                           <div className="flex items-center gap-3">
                              <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                              <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">Mission Blueprint (Final Strategy)</label>
                           </div>
                           <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 leading-relaxed text-[13px] font-medium markdown-content-dark">
                              <ReactMarkdown 
                                components={{
                                  p: ({ children }) => <p className="mb-4 last:mb-0 opacity-90">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-xl font-black mb-6 border-b border-white/20 pb-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-lg font-black mb-4 mt-8 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400"></div>{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-black mb-3 mt-6 uppercase tracking-widest border-l-2 border-indigo-400 pl-3">{children}</h3>,
                                  code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props} />,
                                  pre: ({ children }) => <pre className="bg-slate-900/50 p-6 rounded-2xl my-6 overflow-x-auto text-[11px] font-mono border border-white/10">{children}</pre>,
                                  li: ({ children }) => <li className="mb-2 flex gap-3 italic font-bold"><span>•</span>{children}</li>
                                }}
                              >
                                {activeSession.finalBlueprint}
                              </ReactMarkdown>
                           </div>
                        </div>
                      )}
                   </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                   <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-100">
                      <Brain size={48} className="opacity-20" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest">분석할 세션을 선택하거나 새로 시작하세요</p>
                </div>
              )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};
