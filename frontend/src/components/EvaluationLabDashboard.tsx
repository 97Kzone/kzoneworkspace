import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Activity, History, Server, Loader2, Target, 
  CheckCircle2, XCircle, Clock, Zap, Check, ChevronRight, 
  Plus, Trash2, Database, FileText 
} from 'lucide-react';
import { 
  Agent, evaluationService, EvaluationRunResponse, 
  EvaluationDetailResponse, CreateBenchmarkTaskRequest, BenchmarkTaskResponse 
} from '../app/apiService';

interface EvaluationLabDashboardProps {
  agents: Agent[];
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
  liveEvaluation: any;
  setLiveEvaluation: (val: any) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (판정 최적화)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (고성능 추론)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (고속 경량)' }
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '쉬움 (Level 1)',
  2: '보통 (Level 2)',
  3: '어려움 (Level 3)'
};

const CRITERIA_LABELS: Record<string, string> = {
  'EXACT_MATCH': '정확도 매칭 (Exact)',
  'CONTAINS': '키워드 포함 (Contains)',
  'REGEX': '정규표현식 매칭 (Regex)',
  'SEMANTIC': 'Semantic LLM Judge (의미론적 판정)'
};

export const EvaluationLabDashboard: React.FC<EvaluationLabDashboardProps> = ({ 
  agents, 
  getAgentColor,
  liveEvaluation,
  setLiveEvaluation
}) => {
  const [activeTab, setActiveTab] = useState<'BENCHMARK' | 'TASKS'>('BENCHMARK');
  
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(agents.length > 0 ? agents[0].id : null);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [history, setHistory] = useState<EvaluationRunResponse[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvaluationRunResponse | null>(null);
  const [runDetails, setRunDetails] = useState<EvaluationDetailResponse[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 테스트 케이스 상태
  const [benchmarkTasks, setBenchmarkTasks] = useState<BenchmarkTaskResponse[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<CreateBenchmarkTaskRequest>({
    name: '',
    category: 'CODING',
    inputPrompt: '',
    expectedOutput: '',
    criteriaType: 'SEMANTIC',
    difficulty: 2
  });

  // 실시간 결과 누적 상태
  const [liveResults, setLiveResults] = useState<any[]>([]);

  useEffect(() => {
    if (selectedAgentId) {
      fetchHistory(selectedAgentId);
      setSelectedRun(null);
      setRunDetails([]);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    fetchBenchmarkTasks();
  }, []);

  // WebSocket 실시간 데이터 누적 및 라이브 피드백 핸들링
  useEffect(() => {
    if (liveEvaluation) {
      if (liveEvaluation.status === 'RUNNING') {
        setIsRunning(true);
        // 새로운 실행이거나 첫 완료 시 누적 초기화
        if (liveEvaluation.completedTasks === 0) {
          setLiveResults([]);
        }
        if (liveEvaluation.latestResult) {
          setLiveResults(prev => {
            const exists = prev.some(r => r.taskId === liveEvaluation.latestResult.taskId);
            if (!exists) {
              return [...prev, liveEvaluation.latestResult];
            }
            return prev;
          });
        }
      } else if (liveEvaluation.status === 'COMPLETED' || liveEvaluation.status === 'FAILED') {
        setIsRunning(false);
        if (selectedAgentId) {
          fetchHistory(selectedAgentId);
        }
        // 최종 결과 노출을 위해 5초 뒤 실시간 상태 해제
        const timer = setTimeout(() => {
          setLiveEvaluation(null);
          setLiveResults([]);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [liveEvaluation]);

  const fetchHistory = async (agentId: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await evaluationService.getHistory(agentId);
      setHistory(res.data);
      if (res.data.length > 0 && !selectedRun) {
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

  const fetchBenchmarkTasks = async () => {
    try {
      const res = await evaluationService.getTasks();
      setBenchmarkTasks(res.data);
    } catch (err) {
      console.error("벤치마크 태스크 조회 실패:", err);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedAgentId) return;
    setIsRunning(true);
    setLiveResults([]);
    try {
      await evaluationService.run({
        agentId: selectedAgentId,
        targetModel: selectedModel,
      });
    } catch (err) {
      console.error("평가 실행 실패:", err);
      setIsRunning(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.inputPrompt) {
      alert("테스트 케이스 이름과 입력 프롬프트는 필수로 입력해야 합니다.");
      return;
    }
    try {
      await evaluationService.createTask(newTask);
      setIsCreateModalOpen(false);
      setNewTask({
        name: '',
        category: 'CODING',
        inputPrompt: '',
        expectedOutput: '',
        criteriaType: 'SEMANTIC',
        difficulty: 2
      });
      fetchBenchmarkTasks();
    } catch (err) {
      console.error("테스트 케이스 생성 실패:", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("정말 이 벤치마크 테스트 케이스를 삭제하시겠습니까?\n삭제된 케이스는 복구할 수 없습니다.")) return;
    try {
      await evaluationService.deleteTask(id);
      fetchBenchmarkTasks();
    } catch (err) {
      console.error("테스트 케이스 삭제 실패:", err);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Top Navigator & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">하이브 벤치마킹 랩 (Hive Evaluation Lab)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AI 에이전트의 인지 능력 및 신뢰성 정량 평가 시스템</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'BENCHMARK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            <Activity size={14} /> 벤치마크 평가 실행
          </button>
          <button 
            onClick={() => setActiveTab('TASKS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            <Database size={14} /> 테스트 케이스 관리 ({benchmarkTasks.length})
          </button>
        </div>
      </div>

      {activeTab === 'BENCHMARK' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Panel: Controls & History */}
          <div className="flex flex-col gap-6 overflow-hidden">
            {/* Controls */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                <Zap size={14} className="text-indigo-500" /> 신규 벤치마크 구동
              </h4>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">평가 대상 에이전트</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                    value={selectedAgentId || ''}
                    onChange={e => setSelectedAgentId(Number(e.target.value))}
                    disabled={isRunning}
                  >
                    <option value="" disabled>에이전트를 선택하세요</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">테스트 엔진 (LLM Engine)</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={isRunning}
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleRunEvaluation}
                  disabled={isRunning || !selectedAgentId || benchmarkTasks.length === 0}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  {isRunning ? '백그라운드 평가 실행 중...' : '벤치마크 테스트 시작'}
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-50 shrink-0 flex justify-between items-center bg-slate-50/50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={14} className="text-slate-500" /> 과거 평가 리포트 목록
                </h4>
                {isLoadingHistory && <Loader2 size={12} className="animate-spin text-slate-400" />}
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <AnimatePresence>
                  {history.map((run, i) => (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => !isRunning && handleSelectRun(run)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border mb-2 ${selectedRun?.id === run.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'} ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : run.status === 'RUNNING' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-rose-100 text-rose-600'}`}>
                          {run.status === 'COMPLETED' ? '완료' : run.status === 'RUNNING' ? '분석 중' : '실패'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock size={10} /> {new Date(run.startTime).toLocaleDateString()} {new Date(run.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedAgent ? getAgentColor(selectedAgent.name).bg : 'bg-slate-300'}`}></div>
                          <span className="text-xs font-black text-slate-700 truncate max-w-[120px]">{run.modelName}</span>
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
                       <p className="text-[10px] font-black uppercase tracking-widest">평가 이력이 존재하지 않습니다</p>
                     </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Panel: Live progress OR Static details */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative min-h-[500px]">
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             
             {liveEvaluation ? (
               /* ================== [LIVE TRACKER MODE] ================== */
               <div className="flex flex-col h-full relative z-10">
                 {/* Live Header */}
                 <div className="p-8 border-b border-slate-800/50 bg-indigo-950/20 shrink-0">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                       <div>
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">실시간 평가 통제소</span>
                         <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                           {liveEvaluation.agentName} <span className="text-slate-400 font-light">&gt;</span> {liveEvaluation.modelName}
                         </h2>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">진행도 요약</span>
                       <p className="text-sm font-bold text-white font-mono mt-0.5">{liveEvaluation.completedTasks} / {liveEvaluation.totalTasks} 태스크 평가 완료</p>
                     </div>
                   </div>

                   {/* Progress Gauge */}
                   <div className="mt-6">
                     <div className="flex justify-between text-[10px] text-slate-400 font-black tracking-widest uppercase mb-2">
                       <span>벤치마킹 진척률</span>
                       <span className="text-indigo-400">
                         {((liveEvaluation.completedTasks / liveEvaluation.totalTasks) * 100).toFixed(0)}%
                       </span>
                     </div>
                     <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-800">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                         initial={{ width: 0 }}
                         animate={{ width: `${(liveEvaluation.completedTasks / liveEvaluation.totalTasks) * 100}%` }}
                         transition={{ duration: 0.5, ease: "easeOut" }}
                       />
                     </div>
                   </div>
                 </div>

                 {/* Live Content */}
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-dark space-y-6">
                   {liveEvaluation.status === 'RUNNING' && (
                     <div className="flex items-center justify-center p-4 bg-slate-800/30 border border-slate-700/30 rounded-2xl gap-3">
                       <Loader2 size={16} className="animate-spin text-indigo-400" />
                       <span className="text-xs font-bold text-slate-300">백엔드에서 평가 엔진을 구동하여 실시간 채점하는 중입니다...</span>
                     </div>
                   )}

                   <div className="space-y-4">
                     {liveResults.map((result, idx) => (
                       <motion.div 
                         key={result.taskId}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.3 }}
                         className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6"
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${result.isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                               {result.isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                             </div>
                             <div>
                               <h4 className="text-sm font-black text-white uppercase tracking-wider">{result.taskName}</h4>
                               <p className="text-[10px] font-mono text-slate-500 mt-1">응답 지연: {result.latencyMs}ms</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <span className={`text-xl font-black ${result.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {result.score.toFixed(0)} <span className="text-[10px] text-slate-500">pt</span>
                             </span>
                           </div>
                         </div>

                         {result.rationale && (
                           <div className="bg-indigo-950/20 rounded-2xl p-4 border border-indigo-900/30 mt-4">
                             <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1.5 block flex items-center gap-1"><Zap size={10} /> LLM Judge 의미론적 판정 분석</span>
                             <p className="text-xs text-indigo-200 leading-relaxed font-semibold">{result.rationale}</p>
                           </div>
                         )}

                         <div className="mt-4 bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 block">에이전트 실제 응답</span>
                           <p className="text-xs text-slate-300 font-mono leading-relaxed truncate">{result.actualOutput || 'N/A'}</p>
                         </div>
                       </motion.div>
                     ))}

                     {liveResults.length === 0 && (
                       <div className="flex flex-col items-center justify-center text-slate-600 h-64 border border-dashed border-slate-800 rounded-3xl gap-4">
                         <Activity size={32} className="animate-pulse" />
                         <span className="text-xs font-bold uppercase tracking-widest">첫 번째 태스크 채점을 대기하고 있습니다.</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             ) : selectedRun ? (
               /* ================== [STATIC DETAIL MODE] ================== */
               <>
                 <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10 bg-black/20">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                         {selectedRun.modelName} <span className="text-slate-500 font-light">평가 보고서</span>
                      </h2>
                      <div className="flex gap-4 items-center">
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                            EVAL-#{selectedRun.id}
                         </span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
                            <Server size={12} /> {selectedRun.completedTasks} / {selectedRun.totalTasks} 태스크 채점 완료
                         </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">최종 종합 평점</span>
                       <div className="text-5xl font-black text-white tracking-tighter">
                         {selectedRun.overallScore.toFixed(1)}<span className="text-xl text-slate-600"> / 100</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-8 relative z-10">
                   {isLoadingDetails ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                         <Loader2 size={40} className="animate-spin text-indigo-500" />
                         <span className="text-xs font-black uppercase tracking-widest">결과 세부 데이터 동기화 중...</span>
                      </div>
                   ) : (
                      <div className="space-y-6">
                        {runDetails.map((detail, idx) => (
                          <motion.div 
                            key={detail.taskId}
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            className="bg-slate-800/40 border border-slate-700/40 rounded-3xl p-6 hover:bg-slate-800 transition-all"
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
                                  <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{detail.inputPrompt}</p>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-emerald-950/20 rounded-2xl p-4 border border-emerald-900/30">
                                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80 mb-2 block">기대 답변 (Expected)</span>
                                     <p className="text-xs text-emerald-100/70 leading-relaxed font-mono whitespace-pre-wrap">{detail.expectedOutput || '기대 정답 없음'}</p>
                                  </div>
                                  <div className={`rounded-2xl p-4 border ${detail.isSuccess ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/20 border-rose-900/30'}`}>
                                     <span className={`text-[9px] font-black uppercase tracking-widest mb-2 block ${detail.isSuccess ? 'text-slate-500' : 'text-rose-500/70'}`}>실제 답변 (Actual)</span>
                                     <p className={`text-xs leading-relaxed font-mono whitespace-pre-wrap ${detail.isSuccess ? 'text-slate-300' : 'text-rose-100/70'}`}>{detail.actualOutput || detail.errorLog || '출력 없음'}</p>
                                  </div>
                               </div>

                               {detail.rationale && (
                                 <div className="bg-indigo-950/30 rounded-2xl p-4 border border-indigo-900/40">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1.5 block flex items-center gap-1"><Zap size={10} /> LLM Judge 판정 분석 (Rationale)</span>
                                    <p className="text-xs text-indigo-200 leading-relaxed font-semibold">{detail.rationale}</p>
                                 </div>
                               )}
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
                    <Activity size={40} className="text-indigo-500/50 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white uppercase tracking-widest">선택된 평가 리포트 없음</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">좌측 이력 목록에서 리포트를 선택하거나 새로운 벤치마크 테스트를 시작하세요</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        /* ================== [TEST CASE MANAGEMENT TAB] ================== */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl flex-1 flex flex-col overflow-hidden p-8">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> 커스텀 벤치마크 태스크 리스트
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">AI 에이전트의 수준별 검증을 위해 자체 설계한 테스트 케이스 목록입니다.</p>
            </div>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={14} /> 테스트 케이스 추가
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benchmarkTasks.map((task) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-slate-100 rounded-3xl p-6 shadow-sm bg-slate-50/20 hover:bg-slate-50/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-500`}>
                          {task.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-2 truncate leading-tight uppercase max-w-[200px]">{task.name}</h4>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors flex items-center justify-center border border-slate-100"
                        title="테스트 케이스 제거"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 text-xs">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">입력 질문 (Prompt)</span>
                        <p className="text-slate-600 font-mono line-clamp-2 leading-relaxed">{task.inputPrompt}</p>
                      </div>

                      {task.expectedOutput && (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-100 text-xs">
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 block mb-1">기대 정답 (Expected)</span>
                          <p className="text-emerald-700 font-mono truncate leading-relaxed">{task.expectedOutput}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 relative z-10">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 font-mono">
                      난이도: <span className="font-bold text-slate-700">{DIFFICULTY_LABELS[task.difficulty] || task.difficulty}</span>
                    </span>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {CRITERIA_LABELS[task.criteriaType] || task.criteriaType}
                    </span>
                  </div>
                </motion.div>
              ))}

              {benchmarkTasks.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-3xl">
                  <Database size={40} className="opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">등록된 벤치마크 테스트 케이스가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 테스트 케이스 생성 모달 */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-xl border border-white/20 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic tracking-tight uppercase">테스트 케이스 추가</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">새로운 성능 검증 지표를 수립합니다</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="space-y-5 relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">테스트 케이스 식별 명칭</label>
                  <input 
                    type="text" 
                    placeholder="예: 복합 논리 추론 - 체스 전술" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                    value={newTask.name} 
                    onChange={e => setNewTask({...newTask, name: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">테스트 카테고리</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                      value={newTask.category}
                      onChange={e => setNewTask({...newTask, category: e.target.value})}
                    >
                      <option value="CODING">코딩 능력 (Coding)</option>
                      <option value="LOGIC">논리 추론 (Logic)</option>
                      <option value="SYSTEM">시스템 이해 (System)</option>
                      <option value="WRITING">작문 및 요약 (Writing)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">테스트 난이도</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                      value={newTask.difficulty}
                      onChange={e => setNewTask({...newTask, difficulty: Number(e.target.value)})}
                    >
                      <option value={1}>Level 1 (기초 검증)</option>
                      <option value={2}>Level 2 (일반 추론)</option>
                      <option value={3}>Level 3 (하드 코어)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">채점 판정 기준 (Criteria Type)</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                    value={newTask.criteriaType}
                    onChange={e => setNewTask({...newTask, criteriaType: e.target.value as any})}
                  >
                    <option value="EXACT_MATCH">정확도 매칭 (Exact Match)</option>
                    <option value="CONTAINS">특정 키워드 포함 (Contains)</option>
                    <option value="REGEX">정규표현식 검증 (Regex)</option>
                    <option value="SEMANTIC">Semantic LLM Judge (의미적 공정 판정)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">입력 질문 프롬프트 (Prompt)</label>
                  <textarea 
                    placeholder="AI 에이전트에게 전달될 실제 질문을 작성하세요..." 
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none font-mono" 
                    value={newTask.inputPrompt} 
                    onChange={e => setNewTask({...newTask, inputPrompt: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">기대하는 모범 답안 (Expected Output)</label>
                  <textarea 
                    placeholder="채점의 정답 기준이 될 텍스트 또는 의미 키워드를 작성하세요... (LLM Judge 선택 시 맥락 채점 기준으로 사용됨)" 
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none font-mono" 
                    value={newTask.expectedOutput || ''} 
                    onChange={e => setNewTask({...newTask, expectedOutput: e.target.value})} 
                  />
                </div>
              </div>

              <div className="mt-8 relative z-10 pt-4 border-t border-slate-100">
                <button 
                  onClick={handleCreateTask} 
                  className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={16} /> 테스트 케이스 신규 생성
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
