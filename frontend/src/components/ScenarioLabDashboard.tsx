import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Play, History, FileText, BarChart3, Shield, Activity, 
  Cpu, Layout, Loader2, ChevronRight, AlertCircle, Sparkles, Plus
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { ScenarioSimulation, scenarioService } from "../app/apiService";

interface ScenarioLabDashboardProps {
  simulations: ScenarioSimulation[];
  isLoading: boolean;
  onRunSimulation: (title: string, description: string) => Promise<void>;
}

export const ScenarioLabDashboard: React.FC<ScenarioLabDashboardProps> = ({
  simulations,
  isLoading,
  onRunSimulation
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(simulations[0]?.id || null);

  const selectedSimulation = simulations.find(s => s.id === selectedId) || simulations[0];

  const handleRun = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    await onRunSimulation(newTitle, newDescription);
    setNewTitle("");
    setNewDescription("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-50';
      case 'SIMULATING': return 'text-indigo-500 bg-indigo-50 animate-pulse';
      case 'FAILED': return 'text-rose-500 bg-rose-50';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  return (
    <div className="flex-1 flex gap-8 h-full overflow-hidden">
      {/* 왼쪽: 시나리오 리스트 및 디자이너 */}
      <div className="w-96 flex flex-col gap-6 h-full">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">시나리오 디자이너</h3>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="시나리오 제목 (예: PostgreSQL 전환)" 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea 
              placeholder="시나리오의 상세 내용과 조건을 입력하십시오..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium h-32 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <button 
              onClick={handleRun}
              disabled={isLoading || !newTitle.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              시뮬레이션 가동
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History size={12} /> 시뮬레이션 히스토리
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {simulations.map((sim) => (
              <button 
                key={sim.id}
                onClick={() => setSelectedId(sim.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === sim.id ? 'bg-indigo-50/50 border-indigo-200 shadow-md ring-1 ring-indigo-100' : 'bg-white border-slate-50 hover:border-indigo-100 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-1">
                   <h4 className="text-[11px] font-black text-slate-800 truncate uppercase">{sim.title}</h4>
                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${getStatusColor(sim.status)}`}>
                      {sim.status === 'COMPLETED' ? '완료' : sim.status === 'SIMULATING' ? '가동 중' : sim.status === 'FAILED' ? '실패' : '대기'}
                   </span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium line-clamp-1">{sim.description}</p>
                <div className="mt-2 flex items-center gap-2">
                   <span className="text-[8px] font-mono text-slate-300">{new Date(sim.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 분석 결과 및 대시보드 */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        {selectedSimulation ? (
          <>
            <div className="grid grid-cols-5 gap-4 shrink-0">
               {['Architecture', 'Security', 'Performance', 'Workload', 'Risk'].map((area) => {
                 const impact = selectedId ? selectedSimulation.impacts?.find(i => i.area === area) : null;
                 const score = impact?.score || 0;
                 return (
                   <motion.div 
                     key={area}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white p-4 rounded-3xl border border-slate-100 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group"
                   >
                     <div className="absolute top-0 inset-x-0 h-1 bg-slate-50 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${score * 10}%` }}
                          className={`h-full ${score > 7 ? 'bg-rose-500' : score > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                     </div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{area}</span>
                     <span className={`text-2xl font-black ${score > 7 ? 'text-rose-600' : score > 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {score === 0 ? '-' : score}
                     </span>
                     <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                        <p className="text-[8px] font-bold text-slate-600 leading-tight">
                           {impact?.observation || "분석 대기 중..."}
                        </p>
                     </div>
                   </motion.div>
                 );
               })}
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedSimulation.title} - 시뮬레이션 보고서</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">수석 아키텍트 AI 엔진 분석 결과</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      보고서 내보내기 <ChevronRight size={14} />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
                {selectedSimulation.finalReport ? (
                   <div className="prose prose-slate max-w-none">
                     <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-black text-slate-800 mt-10 mb-4 border-l-4 border-indigo-500 pl-4 uppercase tracking-tight">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-black text-slate-600 mt-8 mb-3 uppercase tracking-widest">{children}</h3>,
                          p: ({ children }) => <p className="text-sm text-slate-600 leading-loose mb-6 font-medium">{children}</p>,
                          ul: ({ children }) => <ul className="space-y-3 mb-8">{children}</ul>,
                          li: ({ children }) => <li className="text-sm text-slate-600 flex items-start gap-2 before:content-['•'] before:text-indigo-500 before:font-bold">{children}</li>,
                          code: ({ node, ...props }) => <code className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-slate-700" {...props} />,
                        }}
                     >
                       {selectedSimulation.finalReport}
                     </ReactMarkdown>
                   </div>
                ) : selectedSimulation.status === 'SIMULATING' ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
                      <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
                         <Cpu size={40} className="text-indigo-500 animate-pulse" />
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">지능형 시뮬레이션 가동 중...</p>
                         <p className="text-[10px] font-bold uppercase tracking-tighter">아키텍처 영향 및 리스크 벡터를 분석하고 있습니다.</p>
                      </div>
                   </div>
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50 italic">
                      <AlertCircle size={48} />
                      <p className="text-sm font-black uppercase tracking-widest">보고서가 아직 생성되지 않았습니다</p>
                   </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
             <div className="p-8 rounded-full bg-slate-50 border-4 border-dashed border-slate-200">
                <Sparkles size={64} className="text-slate-300" />
             </div>
             <div className="text-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">S-LAB 시뮬레이션 준비 완료</h3>
                <p className="text-sm font-medium">왼쪽 패널에서 새로운 시나리오를 정의하거나 히스토리를 선택하십시오.</p>
             </div>
             <button 
               onClick={() => (document.querySelector('input') as HTMLInputElement)?.focus()}
               className="mt-4 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
             >
                시나리오 설계 시작하기
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
