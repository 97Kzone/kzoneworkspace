import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Activity, History, Server, Loader2, Target, 
  CheckCircle2, XCircle, Clock, Zap, Check, ChevronRight, 
  Plus, Trash2, Database, FileText, Download, Terminal
} from 'lucide-react';
import { 
  Agent, evaluationService, EvaluationRunResponse, 
  EvaluationDetailResponse, CreateBenchmarkTaskRequest, BenchmarkTaskResponse 
} from '../app/apiService';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, Legend, Bar
} from 'recharts';

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

  // 비교 분석 관련 상태 추가
  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<{ run: EvaluationRunResponse; details: EvaluationDetailResponse[] }[]>([]);
  const [isComparingLoading, setIsComparingLoading] = useState(false);

  // 단일 리포트 통계 필터 및 복사 상태 추가
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 샌드박스 즉시 검증 상태 추가
  const [activeSandboxTaskId, setActiveSandboxTaskId] = useState<number | null>(null);
  const [sandboxAgentId, setSandboxAgentId] = useState<number>(agents.length > 0 ? agents[0].id : 0);
  const [sandboxModel, setSandboxModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<EvaluationDetailResponse | null>(null);

  const handleToggleRunSelection = (e: React.MouseEvent, runId: number) => {
    e.stopPropagation();
    setIsCompareMode(false); // 선택 상태가 변하면 비교 뷰 리셋
    setSelectedRunIds(prev => 
      prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]
    );
  };

  const handleStartComparison = async () => {
    if (selectedRunIds.length < 2) {
      alert("비교 분석을 하려면 최소 2개 이상의 평가 리포트를 선택해야 합니다.");
      return;
    }
    setIsComparingLoading(true);
    setIsCompareMode(true);
    setSelectedRun(null); // 단일 상세 모드 해제
    try {
      const selectedRuns = history.filter(run => selectedRunIds.includes(run.id));
      const loadedCompareData = await Promise.all(
        selectedRuns.map(async (run) => {
          const res = await evaluationService.getDetails(run.id);
          return {
            run,
            details: res.data
          };
        })
      );
      setCompareData(loadedCompareData);
    } catch (e) {
      console.error("비교 분석 데이터 로딩 실패:", e);
      alert("비교 분석에 필요한 상세 데이터를 불러오는 데 실패했습니다.");
      setIsCompareMode(false);
    } finally {
      setIsComparingLoading(false);
    }
  };

  // 단일 보고서 마크다운 내보내기
  const handleDownloadSingleReportMarkdown = (run: EvaluationRunResponse, details: EvaluationDetailResponse[]) => {
    let md = `# AI 에이전트 성능 평가 보고서 (EVAL-#${run.id})\n\n`;
    md += `## 1. 개요\n`;
    md += `- **평가 대상 에이전트**: ${run.agentName}\n`;
    md += `- **사용 LLM 엔진**: ${run.modelName}\n`;
    md += `- **최종 종합 점수**: **${run.overallScore.toFixed(1)} / 100 pt**\n`;
    md += `- **평가 일시**: ${new Date(run.startTime).toLocaleString()}\n`;
    md += `- **태스크 달성률**: ${run.completedTasks} / ${run.totalTasks} 완료\n\n`;

    md += `## 2. 평가 카테고리별 요약\n`;
    const categories = Array.from(new Set(details.map(d => d.category)));
    categories.forEach(cat => {
      const catDetails = details.filter(d => d.category === cat);
      const avg = catDetails.reduce((sum, d) => sum + d.score, 0) / catDetails.length;
      md += `- **${cat}**: 평균 ${avg.toFixed(1)} pt (총 ${catDetails.length}개 태스크)\n`;
    });
    md += `\n`;

    md += `## 3. 개별 테스트 상세 내역\n\n`;
    details.forEach((detail, index) => {
      md += `### [${index + 1}] ${detail.taskName} (${detail.category})\n`;
      md += `- **결과**: ${detail.isSuccess ? '✅ 성공' : '❌ 실패'} (${detail.score} pt)\n`;
      md += `- **응답 소요 시간**: ${detail.latencyMs} ms\n`;
      md += `- **입력 프롬프트**:\n\`\`\`\n${detail.inputPrompt}\n\`\`\`\n`;
      md += `- **기대 답변**:\n\`\`\`\n${detail.expectedOutput || 'N/A'}\n\`\`\`\n`;
      md += `- **실제 답변**:\n\`\`\`\n${detail.actualOutput || 'N/A'}\n\`\`\`\n`;
      if (detail.rationale) {
        md += `- **LLM Judge 판정 이유 (Rationale)**:\n> ${detail.rationale}\n`;
      }
      md += `\n---\n\n`;
    });

    const filename = `evaluation_report_${run.agentName}_${run.modelName}.md`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 단일 보고서 마크다운 클립보드 복사
  const handleCopyMarkdown = (run: EvaluationRunResponse, details: EvaluationDetailResponse[]) => {
    let md = `# AI 에이전트 성능 평가 보고서 (EVAL-#${run.id})\n\n`;
    md += `## 1. 개요\n`;
    md += `- **평가 대상 에이전트**: ${run.agentName}\n`;
    md += `- **사용 LLM 엔진**: ${run.modelName}\n`;
    md += `- **최종 종합 점수**: **${run.overallScore.toFixed(1)} / 100 pt**\n`;
    md += `- **평가 일시**: ${new Date(run.startTime).toLocaleString()}\n`;
    md += `- **태스크 달성률**: ${run.completedTasks} / ${run.totalTasks} 완료\n\n`;

    md += `## 2. 평가 카테고리별 요약\n`;
    const categories = Array.from(new Set(details.map(d => d.category)));
    categories.forEach(cat => {
      const catDetails = details.filter(d => d.category === cat);
      const avg = catDetails.reduce((sum, d) => sum + d.score, 0) / catDetails.length;
      md += `- **${cat}**: 평균 ${avg.toFixed(1)} pt (총 ${catDetails.length}개 태스크)\n`;
    });
    md += `\n`;

    md += `## 3. 개별 테스트 상세 내역\n\n`;
    details.forEach((detail, index) => {
      md += `### [${index + 1}] ${detail.taskName} (${detail.category})\n`;
      md += `- **결과**: ${detail.isSuccess ? '✅ 성공' : '❌ 실패'} (${detail.score} pt)\n`;
      md += `- **응답 소요 시간**: ${detail.latencyMs} ms\n`;
      md += `- **입력 프롬프트**:\n\`\`\`\n${detail.inputPrompt}\n\`\`\`\n`;
      md += `- **기대 답변**:\n\`\`\`\n${detail.expectedOutput || 'N/A'}\n\`\`\`\n`;
      md += `- **실제 답변**:\n\`\`\`\n${detail.actualOutput || 'N/A'}\n\`\`\`\n`;
      if (detail.rationale) {
        md += `- **LLM Judge 판정 이유 (Rationale)**:\n> ${detail.rationale}\n`;
      }
      md += `\n---\n\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error("복사 실패:", err);
      alert("클립보드 복사에 실패했습니다.");
    });
  };

  // 샌드박스 즉시 검증 비동기 구동 함수
  const handleRunSandbox = async (taskId: number) => {
    if (!sandboxAgentId) {
      alert("검증을 진행할 에이전트를 선택해주세요.");
      return;
    }
    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      const res = await evaluationService.quickTest({
        agentId: sandboxAgentId,
        taskId: taskId,
        targetModel: sandboxModel
      });
      setSandboxResult(res.data);
    } catch (e) {
      console.error("샌드박스 검증 실패:", e);
      alert("샌드박스 즉시 검증 중 오류가 발생했습니다.");
    } finally {
      setSandboxLoading(false);
    }
  };

  // 비교 분석 보고서 마크다운 내보내기
  const handleDownloadCompareReportMarkdown = () => {
    if (compareData.length === 0) return;
    let md = `# 하이브 군집 지능 모델 성능 비교 분석 보고서\n\n`;
    md += `## 1. 비교 대상 목록\n`;
    compareData.forEach((item, idx) => {
      md += `### [대상 #${idx + 1}] ${item.run.modelName} (EVAL-#${item.run.id})\n`;
      md += `- **에이전트**: ${item.run.agentName}\n`;
      md += `- **최종 점수**: **${item.run.overallScore.toFixed(1)} / 100 pt**\n`;
      md += `- **완료 비율**: ${item.run.completedTasks} / ${item.run.totalTasks} 태스크\n\n`;
    });

    md += `## 2. 카테고리별 상세 대조표\n\n`;
    const categories = ['CODING', 'LOGIC', 'SYSTEM', 'WRITING'];
    md += `| 카테고리 | ` + compareData.map(item => `${item.run.modelName}`).join(' | ') + ` |\n`;
    md += `| --- | ` + compareData.map(() => `---`).join(' | ') + ` |\n`;
    categories.forEach(cat => {
      let row = `| **${cat}** | `;
      compareData.forEach(item => {
        const catDetails = item.details.filter(d => d.category === cat);
        const avg = catDetails.length > 0 ? catDetails.reduce((sum, d) => sum + d.score, 0) / catDetails.length : 0;
        row += `${avg.toFixed(1)} pt | `;
      });
      md += row + `\n`;
    });
    md += `\n`;

    md += `## 3. 개별 태스크 결과 대조표\n\n`;
    const taskNames = Array.from(new Set(compareData.flatMap(item => item.details.map(d => d.taskName))));
    md += `| 태스크명 | ` + compareData.map(item => `${item.run.modelName}`).join(' | ') + ` |\n`;
    md += `| --- | ` + compareData.map(() => `---`).join(' | ') + ` |\n`;
    taskNames.forEach(tName => {
      let row = `| ${tName} | `;
      compareData.forEach(item => {
        const detail = item.details.find(d => d.taskName === tName);
        if (detail) {
          row += `${detail.isSuccess ? '✅' : '❌'} (${detail.score} pt / ${detail.latencyMs}ms) | `;
        } else {
          row += `미수행 | `;
        }
      });
      md += row + `\n`;
    });
    md += `\n\n*본 보고서는 하이브 벤치마킹 랩에 의해 자동으로 한글로 작성되었습니다.*`;

    const filename = `swarm_compare_report.md`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    setIsCompareMode(false);
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

  const renderCompareView = () => {
    if (isComparingLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 z-10 relative text-center p-10">
          <Loader2 size={40} className="animate-spin text-indigo-500 mb-2" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-300">하이브 모델 비교 분석 데이터 가공 중...</span>
        </div>
      );
    }

    if (compareData.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 z-10 relative">
          <Target size={40} className="text-indigo-500/50 animate-pulse" />
          <p className="text-sm font-black text-white uppercase tracking-widest">비교할 데이터가 없습니다</p>
        </div>
      );
    }

    const categories = ['CODING', 'LOGIC', 'SYSTEM', 'WRITING'];
    const radarData = categories.map(cat => {
      const row: any = { subject: cat };
      compareData.forEach(item => {
        const catDetails = item.details.filter(d => d.category === cat);
        const avg = catDetails.length > 0 ? catDetails.reduce((sum, d) => sum + d.score, 0) / catDetails.length : 0;
        row[item.run.modelName] = Math.round(avg);
      });
      return row;
    });

    const barData = compareData.map(item => {
      const avgLatency = item.run.avgLatencyMs || (item.details.reduce((sum, d) => sum + d.latencyMs, 0) / item.details.length);
      return {
        name: item.run.modelName,
        '평균 지연(ms)': Math.round(avgLatency)
      };
    });

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
    const taskNames = Array.from(new Set(compareData.flatMap(item => item.details.map(d => d.taskName))));

    return (
      <div className="flex flex-col h-full relative z-10">
        <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 bg-black/20">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                하이브 모델 비교 분석 <span className="text-indigo-400 font-light">대시보드</span>
              </h2>
              <button
                onClick={handleDownloadCompareReportMarkdown}
                className="mb-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
                title="한글 마크다운 문서 다운로드"
              >
                <Download size={12} /> 다운로드 (.md)
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                SWARM-COMPARE
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
                <Server size={12} /> 총 {compareData.length}개 모델 성능 종합 대조
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCompareMode(false)}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            비교 닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {compareData.map((item, idx) => (
              <div key={item.run.id} className="bg-slate-800/40 border border-slate-700/40 rounded-3xl p-6 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                ></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">대상 #{idx + 1} 모델</span>
                <h4 className="text-base font-black text-white mt-1 truncate">{item.run.modelName}</h4>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">종합 평가 점수</p>
                    <p className="text-3xl font-black text-white tracking-tighter mt-1">
                      {item.run.overallScore.toFixed(1)}<span className="text-xs text-slate-500 font-light"> / 100 pt</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500">성공률</p>
                    <p className="text-sm font-black text-slate-300 mt-1 font-mono">
                      {Math.round((item.details.filter(d => d.isSuccess).length / item.details.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800/20 border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 self-start font-mono">Cognitive Area comparison (Radar)</h4>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                    {compareData.map((item, idx) => (
                      <Radar
                        key={item.run.id}
                        name={item.run.modelName}
                        dataKey={item.run.modelName}
                        stroke={colors[idx % colors.length]}
                        fill={colors[idx % colors.length]}
                        fillOpacity={0.15}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12 }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
                      itemStyle={{ fontSize: 11, color: '#f8fafc' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800/20 border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 self-start font-mono">Response Latency comparison (ms)</h4>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} unit="ms" />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12 }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
                      itemStyle={{ fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="평균 지연(ms)" fill="#818cf8" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/20 border border-slate-800 rounded-[2rem] p-8 overflow-hidden">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">개별 태스크 상세 매트릭스</h4>
            <div className="overflow-x-auto custom-scrollbar-dark">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4 min-w-[150px]">테스트 케이스명</th>
                    {compareData.map((item, idx) => (
                      <th key={item.run.id} className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold text-white mb-1" style={{ backgroundColor: colors[idx % colors.length] }}>
                          {item.run.modelName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taskNames.map((tName, tIdx) => (
                    <tr key={tIdx} className="border-b border-slate-800/50 hover:bg-slate-800/10 text-slate-300 font-semibold">
                      <td className="py-3.5 px-4 font-bold text-white">{tName}</td>
                      {compareData.map(item => {
                        const detail = item.details.find(d => d.taskName === tName);
                        if (!detail) {
                          return <td key={item.run.id} className="py-3.5 px-4 text-center text-slate-600 font-bold">미구동</td>;
                        }
                        return (
                          <td key={item.run.id} className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-black ${detail.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {detail.isSuccess ? 'SUCCESS' : 'FAILED'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {detail.score}pt / {detail.latencyMs}ms
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  };

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
              <div className="p-6 border-b border-slate-50 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={14} className="text-slate-500" /> 과거 평가 리포트 목록
                </h4>
                <div className="flex items-center gap-2">
                  {selectedRunIds.length >= 2 && (
                    <button
                      onClick={handleStartComparison}
                      disabled={isComparingLoading}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {isComparingLoading ? <Loader2 size={10} className="animate-spin" /> : <Activity size={10} />}
                      비교 분석 ({selectedRunIds.length})
                    </button>
                  )}
                  {isLoadingHistory && <Loader2 size={12} className="animate-spin text-slate-400" />}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <AnimatePresence>
                  {history.map((run, i) => {
                    const isSelectedForCompare = selectedRunIds.includes(run.id);
                    return (
                      <motion.div
                        key={run.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => !isRunning && handleSelectRun(run)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border mb-2 relative ${selectedRun?.id === run.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : isSelectedForCompare ? 'bg-slate-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'} ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelectedForCompare}
                              disabled={run.status !== 'COMPLETED'}
                              onClick={(e) => handleToggleRunSelection(e, run.id)}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                              title="비교 분석 항목으로 선택"
                            />
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : run.status === 'RUNNING' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-rose-100 text-rose-600'}`}>
                              {run.status === 'COMPLETED' ? '완료' : run.status === 'RUNNING' ? '분석 중' : '실패'}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={10} /> {new Date(run.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedAgent ? getAgentColor(selectedAgent.name).bg : 'bg-slate-300'}`}></div>
                            <span className="text-[11px] font-black text-slate-700 truncate max-w-[100px]">{run.modelName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-indigo-600">{run.overallScore.toFixed(0)}<span className="text-[10px] text-indigo-300">/100</span></span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
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
             ) : isCompareMode ? (
               /* ================== [COMPARISON MODE] ================== */
               renderCompareView()
             ) : selectedRun ? (
               /* ================== [STATIC DETAIL MODE] ================== */
              (() => {
                const successCount = runDetails.filter(d => d.isSuccess).length;
                const totalCount = runDetails.length;
                const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;
                const avgLatency = totalCount > 0 ? Math.round(runDetails.reduce((sum, d) => sum + d.latencyMs, 0) / totalCount) : 0;

                // Recharts category score data
                const categoriesList = Array.from(new Set(runDetails.map(d => d.category)));
                const singleRunChartData = categoriesList.map(cat => {
                  const catDetails = runDetails.filter(d => d.category === cat);
                  const avgScore = catDetails.reduce((sum, d) => sum + d.score, 0) / catDetails.length;
                  const avgLat = catDetails.reduce((sum, d) => sum + d.latencyMs, 0) / catDetails.length;
                  return {
                    name: cat,
                    '평균 점수': Math.round(avgScore),
                    '평균 지연(ms)': Math.round(avgLat)
                  };
                });

                // Filtered list
                const filteredDetails = runDetails.filter(detail => {
                  const matchesCategory = filterCategory === 'ALL' || detail.category === filterCategory;
                  const matchesStatus = filterStatus === 'ALL' || 
                    (filterStatus === 'SUCCESS' && detail.isSuccess) || 
                    (filterStatus === 'FAILED' && !detail.isSuccess);
                  const matchesSearch = detail.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (detail.actualOutput && detail.actualOutput.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (detail.rationale && detail.rationale.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchesCategory && matchesStatus && matchesSearch;
                });

                return (
                  <>
                    <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 relative z-10 bg-black/20">
                       <div>
                         <div className="flex items-center gap-3 flex-wrap">
                           <h2 className="text-2xl font-black text-white uppercase tracking-tight font-mono">
                              {selectedRun.modelName} <span className="text-slate-500 font-light">평가 보고서</span>
                           </h2>
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => handleDownloadSingleReportMarkdown(selectedRun, runDetails)}
                               className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
                               title="한글 마크다운 문서 다운로드"
                             >
                               <Download size={12} /> 다운로드 (.md)
                             </button>
                             <button
                               onClick={() => handleCopyMarkdown(selectedRun, runDetails)}
                               className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border active:scale-95 cursor-pointer ${isCopied ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-850 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'}`}
                               title="마크다운 리포트 클립보드 복사"
                             >
                               <Check size={12} /> {isCopied ? '복사 완료!' : '마크다운 복사'}
                             </button>
                           </div>
                         </div>
                         <div className="flex gap-4 items-center mt-3">
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

                    <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-8 relative z-10 space-y-8">
                      {isLoadingDetails ? (
                         <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 py-20">
                            <Loader2 size={40} className="animate-spin text-indigo-500" />
                            <span className="text-xs font-black uppercase tracking-widest">결과 세부 데이터 동기화 중...</span>
                         </div>
                      ) : (
                         <>
                           {/* 통계 요약 카드 */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="bg-slate-800/30 border border-slate-700/40 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                               <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">인텔리전스 성공률</span>
                               <div className="flex items-baseline gap-2 mt-2">
                                 <span className="text-3xl font-black text-emerald-400">{successRate}%</span>
                                 <span className="text-[10px] text-slate-500 font-bold">({successCount} / {totalCount} 성공)</span>
                               </div>
                             </div>
                             <div className="bg-slate-800/30 border border-slate-700/40 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                               <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">평균 응답 지연 시간</span>
                               <div className="flex items-baseline gap-2 mt-2">
                                 <span className="text-3xl font-black text-indigo-400">{avgLatency} ms</span>
                                 <span className="text-[10px] text-slate-500 font-bold">전체 태스크 평균</span>
                               </div>
                             </div>
                             <div className="bg-slate-800/30 border border-slate-700/40 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                               <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">평가 카테고리 수</span>
                               <div className="flex items-baseline gap-2 mt-2">
                                 <span className="text-3xl font-black text-purple-400">{categoriesList.length} 개</span>
                                 <span className="text-[10px] text-slate-500 font-bold">도메인 다양성</span>
                               </div>
                             </div>
                           </div>

                           {/* 카테고리별 성능 시각화 차트 */}
                           <div className="bg-slate-800/20 border border-slate-850 rounded-[2.5rem] p-8">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 font-mono">CATEGORY PERFORMANCE METRICS (AVG SCORE & LATENCY)</h4>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                               {/* 점수 차트 */}
                               <div className="h-60">
                                 <span className="text-[10px] font-bold text-slate-400 mb-2 block">카테고리별 평균 획득 점수 (점)</span>
                                 <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={singleRunChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                     <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                                     <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                     <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} width={80} />
                                     <ChartTooltip 
                                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12 }}
                                       itemStyle={{ color: '#f8fafc', fontSize: 10 }}
                                     />
                                     <Bar dataKey="평균 점수" fill="#818cf8" radius={[0, 8, 8, 0]} barSize={20} />
                                   </BarChart>
                                 </ResponsiveContainer>
                               </div>

                               {/* 지연 시간 차트 */}
                               <div className="h-60">
                                 <span className="text-[10px] font-bold text-slate-400 mb-2 block">카테고리별 평균 지연 시간 (ms)</span>
                                 <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={singleRunChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                     <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                                     <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 9 }} unit="ms" />
                                     <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} width={80} />
                                     <ChartTooltip 
                                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12 }}
                                       itemStyle={{ color: '#f8fafc', fontSize: 10 }}
                                     />
                                     <Bar dataKey="평균 지연(ms)" fill="#a78bfa" radius={[0, 8, 8, 0]} barSize={20} />
                                   </BarChart>
                                 </ResponsiveContainer>
                               </div>
                             </div>
                           </div>

                           {/* 실시간 필터 및 검색 바 */}
                           <div className="bg-slate-800/30 border border-slate-700/30 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4">
                             <div className="flex-1 w-full relative">
                               <input
                                 type="text"
                                 placeholder="결과 내 검색 (태스크명, 응답, 판정 사유...)"
                                 className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-4 pr-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                                 value={searchTerm}
                                 onChange={e => setSearchTerm(e.target.value)}
                               />
                             </div>
                             <div className="flex gap-4 w-full md:w-auto shrink-0">
                               <select
                                 className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                 value={filterCategory}
                                 onChange={e => setFilterCategory(e.target.value)}
                               >
                                 <option value="ALL">모든 카테고리</option>
                                 <option value="CODING">CODING (코딩)</option>
                                 <option value="LOGIC">LOGIC (논리)</option>
                                 <option value="SYSTEM">SYSTEM (시스템)</option>
                                 <option value="WRITING">WRITING (작문)</option>
                               </select>

                               <select
                                 className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                 value={filterStatus}
                                 onChange={e => setFilterStatus(e.target.value)}
                               >
                                 <option value="ALL">모든 결과</option>
                                 <option value="SUCCESS">성공 (✅)</option>
                                 <option value="FAILED">실패 (❌)</option>
                               </select>
                             </div>
                           </div>

                           {/* 필터링된 결과 상세 리스트 */}
                           <div className="space-y-6">
                             {filteredDetails.map((detail, idx) => (
                               <motion.div 
                                 key={detail.taskId}
                                 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                 className="bg-slate-800/40 border border-slate-700/40 rounded-3xl p-6 hover:bg-slate-800 transition-all"
                               >
                                 <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${detail.isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                         {detail.isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-white uppercase tracking-wider">{detail.taskName}</h4>
                                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-700 text-slate-300">{detail.category}</span>
                                        </div>
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

                             {filteredDetails.length === 0 && (
                               <div className="flex flex-col items-center justify-center text-slate-500 py-16 bg-slate-900/20 border border-slate-800 rounded-3xl gap-4">
                                 <Target size={32} className="opacity-20" />
                                 <span className="text-xs font-bold uppercase tracking-widest">필터 기준에 부합하는 평가 상세 내역이 없습니다.</span>
                               </div>
                             )}
                           </div>
                         </>
                      )}
                    </div>
                  </>
                )
              })()
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
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        {CRITERIA_LABELS[task.criteriaType] || task.criteriaType}
                      </span>
                      <button
                        onClick={() => {
                          if (activeSandboxTaskId === task.id) {
                            setActiveSandboxTaskId(null);
                            setSandboxResult(null);
                          } else {
                            setActiveSandboxTaskId(task.id);
                            setSandboxResult(null);
                          }
                        }}
                        className={`px-2.5 py-1 text-[9px] font-black rounded-md border transition-all ${activeSandboxTaskId === task.id ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {activeSandboxTaskId === task.id ? '콘솔 닫기' : '즉시 검증'}
                      </button>
                    </div>
                  </div>

                  {activeSandboxTaskId === task.id && (
                    <div className="border-t border-slate-100 mt-4 pt-4 space-y-4 relative z-10 bg-slate-50/50 p-4 rounded-2xl border text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1"><Terminal size={10} /> 샌드박스 검증 콘솔</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 block mb-1">검증 에이전트</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                            value={sandboxAgentId}
                            onChange={e => setSandboxAgentId(Number(e.target.value))}
                            disabled={sandboxLoading}
                          >
                            <option value={0} disabled>선택...</option>
                            {agents.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 block mb-1">검증 엔진</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                            value={sandboxModel}
                            onChange={e => setSandboxModel(e.target.value)}
                            disabled={sandboxLoading}
                          >
                            {AVAILABLE_MODELS.map(m => (
                              <option key={m.id} value={m.id}>{m.name.split(' (')[0]}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRunSandbox(task.id)}
                        disabled={sandboxLoading || !sandboxAgentId}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow transition-all flex items-center justify-center gap-1"
                      >
                        {sandboxLoading ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                        {sandboxLoading ? '실시간 추론 및 채점 중...' : '샌드박스 테스트 실행'}
                      </button>

                      {sandboxLoading && (
                        <div className="p-3 bg-slate-900 rounded-xl text-slate-400 font-mono text-[9px] border border-slate-800 animate-pulse leading-relaxed">
                          &gt; 에이전트 "{agents.find(a => a.id === sandboxAgentId)?.name}" 기동 중...<br/>
                          &gt; LLM 채널 연결 수립 완료 (모델: {sandboxModel})...<br/>
                          &gt; 입력 프롬프트 인출 및 의미 추론 진행 중...
                        </div>
                      )}

                      {sandboxResult && (
                        <div className="space-y-3 mt-3 animate-fadeIn">
                          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[8px] font-bold text-slate-400">검증 점수</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-black ${sandboxResult.isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {sandboxResult.isSuccess ? 'SUCCESS' : 'FAILED'}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs font-black text-indigo-600">{sandboxResult.score} pt</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-[9px] text-slate-500 font-mono">{sandboxResult.latencyMs}ms</span>
                            </div>
                          </div>

                          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-[10px] font-mono text-slate-300 max-h-[120px] overflow-y-auto custom-scrollbar-dark leading-relaxed">
                            <span className="text-[8px] font-black text-slate-500 block mb-1 uppercase">에이전트 응답 (Actual Response)</span>
                            {sandboxResult.actualOutput || sandboxResult.errorLog || '응답이 존재하지 않습니다.'}
                          </div>

                          {sandboxResult.rationale && (
                            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-[10px] text-indigo-700 leading-relaxed font-semibold">
                              <span className="text-[8px] font-black text-indigo-500 block mb-1 uppercase">LLM Judge 판정 근거 (Rationale)</span>
                              {sandboxResult.rationale}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
