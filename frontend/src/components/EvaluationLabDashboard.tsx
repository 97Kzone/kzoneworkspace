import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Activity, History, Server, Loader2, Target, CheckCircle2, XCircle, Clock, Zap, Check, ChevronRight } from 'lucide-react';
import { Agent, evaluationService, EvaluationRunResponse, EvaluationDetailResponse } from '../app/apiService';

interface EvaluationLabDashboardProps {
  agents: Agent[];
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
}

const AVAILABLE_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
];

export const EvaluationLabDashboard: React.FC<EvaluationLabDashboardProps> = ({ agents, getAgentColor }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(agents.length > 0 ? agents[0].id : null);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [history, setHistory] = useState<EvaluationRunResponse[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvaluationRunResponse | null>(null);
  const [runDetails, setRunDetails] = useState<EvaluationDetailResponse[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (selectedAgentId) {
      fetchHistory(selectedAgentId);
      setSelectedRun(null);
      setRunDetails([]);
    }
  }, [selectedAgentId]);

  const fetchHistory = async (agentId: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await evaluationService.getHistory(agentId);
      setHistory(res.data);
      if (res.data.length > 0) {
        handleSelectRun(res.data[0]);
      }
    } catch (err) {
      console.error("평가 이력 조회 실패:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectRun = async (run: EvaluationRunResponse) => {
    setSelectedRun(run);
    setIsLoadingDetails(true);
    try {
      const res = await evaluationService.getDetails(run.id);
      setRunDetails(res.data);
    } catch (err) {
      console.error("상세 조회 실패:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedAgentId) return;
    setIsRunning(true);
    try {
      const res = await evaluationService.run({
        agentId: selectedAgentId,
        targetModel: selectedModel,
      });
      // 성공 후 2초 뒤에 히스토리 리프레시 (백엔드가 비동기로 동작할 수도 있음을 고려)
      // 현재 백엔드는 동기지만 UX를 위해 리프레시
      setTimeout(() => fetchHistory(selectedAgentId), 1000);
    } catch (err) {
      console.error("평가 실행 실패:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">하이브 벤치마킹 랩</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AI 에이전트 성능 평가 및 모델 비교 분석 센터</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Panel: Controls & History */}
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Controls */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shrink-0">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap size={14} /> 새로운 평가 세션 시작
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">대상 에이전트</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                  value={selectedAgentId || ''}
                  onChange={e => setSelectedAgentId(Number(e.target.value))}
                >
                  <option value="" disabled>에이전트를 선택하세요</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">테스트 모델 (LLM Engine)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleRunEvaluation}
                disabled={isRunning || !selectedAgentId}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? '평가 진행 중...' : '벤치마크 테스트 시작'}
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-50 shrink-0 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={14} /> 과거 평가 이력
              </h4>
              {isLoadingHistory && <Loader2 size={12} className="animate-spin text-slate-400" />}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              <AnimatePresence>
                {history.map((run, i) => (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectRun(run)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border mb-2 ${selectedRun?.id === run.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {run.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={10} /> {new Date(run.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedAgent ? getAgentColor(selectedAgent.name).bg : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-black text-slate-700">{run.modelName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-600">{run.overallScore.toFixed(0)}<span className="text-xs text-indigo-300">/100</span></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {history.length === 0 && !isLoadingHistory && (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 py-10">
                     <Activity size={32} className="opacity-20" />
                     <p className="text-[10px] font-black uppercase tracking-widest">평가 이력이 없습니다</p>
                   </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel: Evaluation Details */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
           
           {selectedRun ? (
             <>
               <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10 bg-black/20">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                       {selectedRun.modelName} <span className="text-slate-500 font-light">평가 보고서</span>
                    </h2>
                    <div className="flex gap-4 items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                          ID: EVAL-{selectedRun.id}
                       </span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Server size={12} /> {selectedRun.completedTasks} / {selectedRun.totalTasks} 태스크 완료
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">최종 종합 점수</span>
                     <div className="text-5xl font-black text-white tracking-tighter">
                       {selectedRun.overallScore.toFixed(1)}<span className="text-xl text-slate-600"> / 100</span>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-8 relative z-10">
                 {isLoadingDetails ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                       <Loader2 size={40} className="animate-spin text-indigo-500" />
                       <span className="text-xs font-black uppercase tracking-widest">결과 데이터 동기화 중...</span>
                    </div>
                 ) : (
                    <div className="space-y-6">
                      {runDetails.map((detail, idx) => (
                        <motion.div 
                          key={detail.taskId}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${detail.isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                  {detail.isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                               </div>
                               <div>
                                 <h4 className="text-sm font-black text-white uppercase tracking-wider">{detail.taskName}</h4>
                                 <p className="text-[10px] font-mono text-slate-500 mt-1">응답 소요: {detail.latencyMs}ms</p>
                               </div>
                             </div>
                             <div className="text-right">
                                <span className={`text-xl font-black ${detail.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {detail.score.toFixed(0)} <span className="text-[10px] text-slate-500">pt</span>
                                </span>
                             </div>
                          </div>

                          <div className="space-y-4 mt-6">
                             <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">입력 프롬프트 (Input)</span>
                                <p className="text-xs text-slate-300 leading-relaxed font-mono">{detail.inputPrompt}</p>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-900/30">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 mb-2 block">기대 출력 (Expected)</span>
                                   <p className="text-xs text-emerald-100/70 leading-relaxed font-mono">{detail.expectedOutput || 'N/A'}</p>
                                </div>
                                <div className={`rounded-2xl p-4 border ${detail.isSuccess ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/20 border-rose-900/30'}`}>
                                   <span className={`text-[9px] font-black uppercase tracking-widest mb-2 block ${detail.isSuccess ? 'text-slate-500' : 'text-rose-500/70'}`}>실제 출력 (Actual)</span>
                                   <p className={`text-xs leading-relaxed font-mono ${detail.isSuccess ? 'text-slate-300' : 'text-rose-100/70'}`}>{detail.actualOutput || detail.errorLog || 'No output'}</p>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                 )}
               </div>
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 z-10 relative">
                <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <Activity size={40} className="text-indigo-500/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white uppercase tracking-widest">선택된 평가 세션 없음</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">좌측에서 히스토리를 선택하거나 새 벤치마크를 실행하세요</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
