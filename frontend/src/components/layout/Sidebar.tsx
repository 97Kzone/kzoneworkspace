import React from "react";
import { motion } from "framer-motion";
import { 
  Bot, Plus, Users, Terminal, Code2, Layout, Database, 
  Search, Activity, Trash2, Heart, Zap 
} from "lucide-react";
import { getAgentColor } from "../../utils/agentColors";

interface SidebarProps {
  vo: any;
  onDeleteAgent: (id: number) => Promise<void>;
  onOpenProjectHealth: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({ vo, onDeleteAgent, onOpenProjectHealth }) => {
  return (
    <div className="w-96 bg-white border-r border-slate-100 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.02)] z-10">
      <div className="p-8 pb-6 bg-gradient-to-b from-slate-50/50 to-transparent">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3 transform hover:rotate-0 transition-transform cursor-pointer group">
              <Layout size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-slate-800">K-ZONE <span className="text-indigo-600">AI</span></h1>
          </div>
          <button 
            onClick={onOpenProjectHealth}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center border border-slate-100 hover:border-rose-100 overflow-hidden relative group"
          >
            <Heart size={20} className="group-hover:scale-110 transition-transform" />
            <motion.div className="absolute inset-0 bg-rose-500/10 scale-0 group-hover:scale-100 transition-transform origin-center" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
           <div className="flex-1 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 group focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all">
              <Search size={14} className="text-slate-400 group-focus-within:text-indigo-500" />
              <input 
                type="text" 
                placeholder="빠른 명령어 찾기 (Ctrl+K)..." 
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-full placeholder:text-slate-400"
                onFocus={() => vo.setIsCommanderOpen(true)}
                readOnly
              />
           </div>
        </div>
        
        <div className="flex items-center justify-between px-1">
           <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">실시간 워크스페이스 가동 중</span>
           </div>
           <div className="flex items-center gap-2">
              <button 
                 onClick={() => vo.setIsKnowledgeExplorerOpen(true)}
                 className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                 title="전역 지식 탐색"
              >
                 <Database size={14} />
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">활성 에이전트</h2>
            <button 
              onClick={() => vo.setIsDeployModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black transition-all border border-indigo-100 shadow-sm"
            >
              <Plus size={12} strokeWidth={3} /> 배포하기
            </button>
          </div>
          <div className="space-y-3">
            {vo.agents.map((agent: any) => (
              <motion.div 
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group relative p-4 rounded-3xl border transition-all cursor-pointer ${vo.activeChat === agent.name ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg'}`}
                onClick={() => vo.setActiveChat(agent.name)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl ${getAgentColor(agent.name).bg} flex items-center justify-center text-white shadow-lg relative z-10 overflow-hidden`}>
                      <Bot size={24} />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center z-20 ${agent.status === 'IDLE' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}>
                      {agent.status !== 'IDLE' && <Activity size={8} className="text-white" />}
                    </div>
                    {vo.activeCollaborations[agent.name] && (
                      <motion.div 
                        className="absolute -right-8 top-1/2 -translate-y-1/2 z-30 bg-white shadow-md border border-indigo-100 rounded-full p-1"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                      >
                        <Users size={12} className="text-indigo-500" />
                      </motion.div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 truncate text-sm tracking-tight capitalize">{agent.name}</h3>
                      {vo.activePreviews[agent.name] && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" title="추론 진행 중"></span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{agent.role}</p>
                    {agent.greeting && (
                      <p className="text-[9px] font-bold text-indigo-500 mt-0.5 truncate italic">"{agent.greeting}"</p>
                    )}
                    {agent.currentActivity && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                        <span className="flex h-1 w-1 rounded-full bg-indigo-500 animate-pulse"></span>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">{agent.currentActivity}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {agent.assignedSkills?.map((skillId : any) => (
                    <span key={skillId} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black rounded-lg border border-slate-100 truncate max-w-[60px]">
                      {skillId}
                    </span>
                  ))}
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      vo.setEditingAgentId(agent.id);
                      vo.setNewAgent({ name: agent.name, role: agent.role, model: agent.model, systemPrompt: agent.systemPrompt || "", assignedSkills: agent.assignedSkills || [] });
                      vo.setIsDeployModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors"
                    title="에이전트 수정"
                  >
                    <Code2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAgent(agent.id);
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="에이전트 해제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">진행 중인 태스크</h2>
            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">{(vo.tasks.filter((t: any) => t.status === 'RUNNING').length)}개 활성</span>
          </div>
          <div className="space-y-2">
            {vo.tasks.filter((t: any) => t.status !== 'COMPLETED').slice(0, 5).map((task: any) => (
              <div key={task.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3 group hover:bg-white hover:shadow-md transition-all">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-500' : task.status === 'HEALING' ? 'bg-orange-50 text-orange-500' : task.status === 'FAILED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                  {task.status === 'RUNNING' ? <Activity size={14} className="animate-pulse" /> : <Terminal size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{task.command}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{task.agent?.name}</span>
                     <span className="text-[8px] text-slate-300">•</span>
                     <span className={`text-[8px] font-black uppercase ${task.status === 'RUNNING' ? 'text-indigo-500' : task.status === 'HEALING' ? 'text-orange-500' : 'text-slate-500'}`}>
                        {task.status === 'RUNNING' ? '실행 중' : task.status === 'HEALING' ? '자가 복구 중' : task.status === 'FAILED' ? '실패' : '대기'}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
