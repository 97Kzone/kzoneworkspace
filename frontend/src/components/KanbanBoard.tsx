"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Play, Zap, CheckCircle2, AlertCircle, 
  User, Server, ArrowRight, Eye, Calendar,
  Activity, ShieldAlert, Terminal, X, Search
} from "lucide-react";
import { Task, Agent } from "../app/apiService";
import { getAgentColor } from "../utils/agentColors";

interface KanbanBoardProps {
  tasks: Task[];
  agents: Agent[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, agents }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 필터링 및 검색된 태스크 목록
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesAgent = filterAgent === "ALL" || (task.agent && task.agent.name === filterAgent);
      const matchesQuery = searchQuery.trim() === "" || 
        task.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.result && task.result.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.id.toString().includes(searchQuery);
      return matchesAgent && matchesQuery;
    });
  }, [tasks, filterAgent, searchQuery]);

  // 각 상태별 태스크 분류
  const columns = useMemo(() => {
    const defaultCols = {
      PENDING: [] as Task[],
      RUNNING: [] as Task[],
      HEALING: [] as Task[],
      COMPLETED: [] as Task[],
      FAILED: [] as Task[]
    };

    filteredTasks.forEach(task => {
      if (defaultCols[task.status]) {
        defaultCols[task.status].push(task);
      } else {
        // Fallback for any unknown status
        defaultCols.PENDING.push(task);
      }
    });

    return defaultCols;
  }, [filteredTasks]);

  // 컬럼 스타일 정의
  const columnStyles = {
    PENDING: {
      title: "대기중",
      bg: "bg-slate-900/40",
      border: "border-slate-800",
      headerBg: "bg-slate-800/50",
      textColor: "text-slate-400",
      icon: <Clock size={16} className="text-slate-400" />,
      accentColor: "slate"
    },
    RUNNING: {
      title: "진행중",
      bg: "bg-indigo-950/20",
      border: "border-indigo-900/50",
      headerBg: "bg-indigo-950/40",
      textColor: "text-indigo-400",
      icon: <Play size={16} className="text-indigo-400 animate-pulse" />,
      accentColor: "indigo"
    },
    HEALING: {
      title: "자가 치유",
      bg: "bg-amber-950/20",
      border: "border-amber-900/50",
      headerBg: "bg-amber-950/40",
      textColor: "text-amber-400",
      icon: <Zap size={16} className="text-amber-400 animate-bounce" />,
      accentColor: "amber"
    },
    COMPLETED: {
      title: "완료",
      bg: "bg-emerald-950/20",
      border: "border-emerald-900/50",
      headerBg: "bg-emerald-950/40",
      textColor: "text-emerald-400",
      icon: <CheckCircle2 size={16} className="text-emerald-400" />,
      accentColor: "emerald"
    },
    FAILED: {
      title: "실패",
      bg: "bg-rose-950/20",
      border: "border-rose-900/50",
      headerBg: "bg-rose-950/40",
      textColor: "text-rose-400",
      icon: <AlertCircle size={16} className="text-rose-400" />,
      accentColor: "rose"
    }
  };

  // 고유 에이전트 목록 (필터 검색용)
  const uniqueAgentNames = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(t => {
      if (t.agent) names.add(t.agent.name);
    });
    return Array.from(names);
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative">
      {/* 백그라운드 효과 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none z-0"></div>

      {/* 헤더 및 컨트롤 레이어 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg">
            <Terminal size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase flex items-center gap-2">
              자율 에이전트 태스크 칸반 보드
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              에이전트들이 수행하는 분산 워크플로우의 실행 단계를 실시간 통제 및 모니터링합니다.
            </p>
          </div>
        </div>

        {/* 필터 및 검색바 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 gap-2 w-48 md:w-64">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="명령어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-white w-full placeholder:text-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          <select 
            value={filterAgent} 
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">모든 에이전트</option>
            {uniqueAgentNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 칸반 그리드 레이어 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-hidden relative z-10">
        {(Object.keys(columnStyles) as Array<keyof typeof columnStyles>).map((status) => {
          const style = columnStyles[status];
          const taskList = columns[status] || [];

          return (
            <div 
              key={status} 
              className={`flex flex-col h-full rounded-[2rem] border ${style.border} ${style.bg} overflow-hidden`}
            >
              {/* 컬럼 헤더 */}
              <div className={`px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 ${style.headerBg}`}>
                <div className="flex items-center gap-2">
                  {style.icon}
                  <span className={`text-[11px] font-black uppercase tracking-wider ${style.textColor}`}>
                    {style.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">
                  {taskList.length}
                </span>
              </div>

              {/* 컬럼 바디 (카드 목록) */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-dark space-y-3 pb-8">
                {taskList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 py-10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-center">작업 없음</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {taskList.map((task) => {
                      const agentColor = task.agent ? getAgentColor(task.agent.name) : { bg: "bg-slate-700", text: "text-slate-300" };
                      return (
                        <motion.div
                          key={task.id}
                          layoutId={`task-${task.id}`}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ y: -2, scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          onClick={() => setSelectedTask(task)}
                          className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4.5 rounded-2xl cursor-pointer transition-all shadow-md hover:shadow-lg group flex flex-col gap-3.5 relative overflow-hidden"
                        >
                          {/* 진행중/자가치유 중인 경우 카드 우측 광 효과 */}
                          {task.status === 'RUNNING' && (
                            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 animate-pulse"></div>
                          )}
                          {task.status === 'HEALING' && (
                            <div className="absolute top-0 right-0 w-1 h-full bg-amber-500 animate-pulse"></div>
                          )}

                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[9px] font-mono font-bold text-slate-500">
                              #{task.id}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                              task.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                              task.status === 'HEALING' ? 'bg-amber-500/10 text-amber-400' :
                              task.status === 'RUNNING' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {task.status}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                            {task.command}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-1">
                            {task.agent ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full ${agentColor.bg} flex items-center justify-center text-[8px] font-bold text-white`}>
                                  {task.agent.name[0].toUpperCase()}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase truncate max-w-[80px]">
                                  {task.agent.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                  ?
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase">
                                  대기중
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                              <Eye size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span>상세 정보</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 보기 모달 팝업 */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative"
            >
              {/* 백그라운드 장식용 블루 그라데이션 */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              {/* 헤더 */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5 shrink-0 z-10 relative">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                    selectedTask.status === 'COMPLETED' ? 'bg-emerald-600' :
                    selectedTask.status === 'FAILED' ? 'bg-rose-600' :
                    selectedTask.status === 'HEALING' ? 'bg-amber-600 animate-pulse' :
                    selectedTask.status === 'RUNNING' ? 'bg-indigo-600 animate-spin-slow' : 'bg-slate-700'
                  }`}>
                    {selectedTask.status === 'COMPLETED' ? <CheckCircle2 size={20} /> :
                     selectedTask.status === 'FAILED' ? <AlertCircle size={20} /> :
                     selectedTask.status === 'HEALING' ? <Zap size={20} /> :
                     selectedTask.status === 'RUNNING' ? <Activity size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      태스크 #{selectedTask.id} 상세 현황
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      상세 로그 및 리소스 할당 이력을 검증합니다.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 내용 스크롤뷰 */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar-dark z-10 relative">
                
                {/* 1. 명령 필드 */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">실행 명령어 (Command)</span>
                  <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 select-all overflow-x-auto">
                    {selectedTask.command}
                  </div>
                </div>

                {/* 2. 메타 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">담당 인공지능 개체</span>
                    {selectedTask.agent ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAgentColor(selectedTask.agent.name).bg} flex items-center justify-center text-white text-xs font-bold`}>
                          {selectedTask.agent.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{selectedTask.agent.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{selectedTask.agent.role.split(' ')[0]}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 italic">미정 (대기열 잔류)</span>
                    )}
                  </div>

                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">작업 실행 및 완료 상태</span>
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded text-[9px] font-black uppercase ${
                        selectedTask.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        selectedTask.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' :
                        selectedTask.status === 'HEALING' ? 'bg-amber-500/10 text-amber-400' :
                        selectedTask.status === 'RUNNING' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedTask.status}
                      </span>
                      {selectedTask.parentId && (
                        <span className="ml-2 text-[9px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
                          하위 태스크 (부모: #{selectedTask.parentId})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. 시간 정보 */}
                <div className="bg-slate-800/30 p-5 rounded-3xl border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Calendar size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">일정 이력</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 font-bold">생성 시점</span>
                      <span className="text-white font-mono">{new Date(selectedTask.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 font-bold">수정 시점</span>
                      <span className="text-white font-mono">{new Date(selectedTask.updatedAt).toLocaleString()}</span>
                    </div>
                    {selectedTask.startedAt && (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold">작업 시작</span>
                        <span className="text-white font-mono">{new Date(selectedTask.startedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedTask.completedAt && (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 font-bold">작업 완료</span>
                        <span className="text-white font-mono">{new Date(selectedTask.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. 실행 결과 */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">수행 결과 및 오류 리포트</span>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar-dark">
                    {selectedTask.result ? (
                      <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed">
                        {selectedTask.result}
                      </pre>
                    ) : (
                      <span className="text-xs font-bold text-slate-600 italic block py-4 text-center">
                        아직 실행 결과가 반환되지 않았거나 가동 대기 중입니다.
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* 푸터 */}
              <div className="border-t border-white/5 pt-6 flex justify-end shrink-0 z-10 relative">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                >
                  확인 완료
                  <ArrowRight size={10} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
