import React from "react";
import { Terminal, Brain, BarChart3, Sparkles } from "lucide-react";
import { getAgentColor } from "../../utils/agentColors";
import { briefingService } from "../../app/apiService";

interface HeaderProps {
  vo: any;
  onOpenBriefing: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ vo, onOpenBriefing }) => {
  return (
    <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
      <div className="flex items-center gap-6">
        <nav className="flex gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
          {[
            { id: 'PROCESS', label: '워크스테이션', icon: Terminal },
            { id: 'INTELLIGENCE', label: '인텔리전스', icon: Brain },
            { id: 'METRICS', label: '분석 및 통계', icon: BarChart3 },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => vo.setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black transition-all tracking-widest ${vo.activeCategory === cat.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-1 ring-slate-100' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
            >
              <cat.icon size={13} strokeWidth={vo.activeCategory === cat.id ? 3 : 2} />
              {cat.label}
            </button>
          ))}
        </nav>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex gap-4">
           {vo.activeCategory === 'PROCESS' && (
              <div className="flex gap-1">
                {[{id:'LOGS', label:'활동 로그'}, {id:'SCHEDULER', label:'스케줄러'}, {id:'KANBAN', label:'칸반 보드'}, {id:'MISSION', label:'미션 맵'}].map(tab => (
                  <button key={tab.id} onClick={() => vo.setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
           )}
           {vo.activeCategory === 'INTELLIGENCE' && (
              <div className="flex gap-1">
                {[
                  {id:'REASONING', label:'추론 타임라인'}, 
                  {id:'CODE_REVIEW', label:'QA 리뷰'}, 
                  {id:'JANITOR', label:'AI 자니터'}, 
                  {id:'MISSION_CONTROL', label:'미션 컨트롤'}, 
                  {id:'BRAINSTORMING', label:'브레인스토밍'},
                  {id:'SCENARIO_LAB', label:'시나리오 랩'}
                ].map(tab => (
                  <button key={tab.id} onClick={() => vo.setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
           )}
           {vo.activeCategory === 'METRICS' && (
              <div className="flex gap-1">
                {[{id:'STATS', label:'핵심 지표'}, {id:'ANALYTICS', label:'생산성 분석'}, {id:'TECH_PULSE', label:'기술 트렌드'}].map(tab => (
                  <button key={tab.id} onClick={() => vo.setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
           )}
        </div>
      </div>

      <div className="flex items-center gap-4">
         <div className="flex -space-x-3 mr-4">
            {vo.agents.slice(0, 4).map((agent: any) => (
               <div key={agent.id} className={`w-8 h-8 rounded-full border-2 border-white ${getAgentColor(agent.name).bg} flex items-center justify-center text-white text-[10px] font-bold shadow-sm relative group cursor-pointer tooltip`}>
                  <span className="uppercase">{agent.name[0]}</span>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {agent.name}
                  </div>
               </div>
            ))}
         </div>
         
         <button 
            onClick={onOpenBriefing}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-95"
         >
            <Sparkles size={14} /> 데일리 브리핑
         </button>
      </div>
    </header>
  );
};
