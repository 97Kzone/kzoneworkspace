"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Target, ChevronDown, CheckCircle2, 
  PlayCircle, AlertCircle, RefreshCw, Layers, ArrowRight, Bot
} from 'lucide-react';
import { workstreamService, taskService, MissionSession, Task } from '../app/apiService';

interface WorkstreamGanttChartProps {
  roomId: string;
  getAgentColor: (name: string) => { bg: string; soft: string; border: string };
}

export const WorkstreamGanttChart: React.FC<WorkstreamGanttChartProps> = ({ roomId, getAgentColor }) => {
  const [missions, setMissions] = useState<MissionSession[]>([]);
  const [selectedMission, setSelectedMission] = useState<MissionSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // 데이터 로드
  const fetchData = async () => {
    try {
      const res = await workstreamService.getMissions(roomId);
      setMissions(res.data);
      if (res.data.length > 0 && !selectedMission) {
        setSelectedMission(res.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch missions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async (missionId: number) => {
    try {
      const res = await taskService.getByMission(missionId);
      // createdAt 기준으로 정렬
      const sortedTasks = [...res.data].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setTasks(sortedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roomId]);

  useEffect(() => {
    if (selectedMission) {
      fetchTasks(selectedMission.id);
    }
  }, [selectedMission]);

  // 실시간 갱신 (활성 미션인 경우)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      if (selectedMission && (selectedMission.status === 'ACTIVE' || selectedMission.status === 'PENDING')) {
        fetchTasks(selectedMission.id);
        // 미션 상태도 갱신
        workstreamService.getMission(selectedMission.id).then(res => {
            setSelectedMission(res.data);
        });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedMission]);

  // 타임라인 계산 유틸리티
  const timelineData = useMemo(() => {
    if (tasks.length === 0) return null;

    const startTs = new Date(tasks[0].createdAt).getTime();
    
    // 종료 시간 결정 (완료된 마지막 태스크의 completedAt 또는 현재 시간)
    let endTs = now.getTime();
    const completedTasks = tasks.filter(t => t.completedAt);
    if (selectedMission?.status === 'COMPLETED' && completedTasks.length > 0) {
        const lastCompletedTs = Math.max(...completedTasks.map(t => new Date(t.completedAt!).getTime()));
        endTs = lastCompletedTs + 2000; // 여유분 2초
    } else {
        // 진행 중인 경우 현재 시간과 비교하여 가장 늦은 시간 선택
        const lastUpdateTs = Math.max(...tasks.map(t => new Date(t.updatedAt).getTime()));
        endTs = Math.max(now.getTime(), lastUpdateTs) + 1000;
    }

    const duration = endTs - startTs;
    const totalSeconds = Math.ceil(duration / 1000);

    return { startTs, endTs, duration, totalSeconds };
  }, [tasks, now, selectedMission]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'RUNNING': return <PlayCircle className="text-indigo-500 animate-pulse" size={16} />;
      case 'HEALING': return <RefreshCw className="text-orange-500 animate-spin" size={16} />;
      case 'FAILED': return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Clock className="text-slate-300" size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">워크스트림 로드 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <Layers size={24} />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">미션 선택</p>
                <h3 className="text-sm font-black text-slate-800 truncate max-w-[200px]">
                  {selectedMission ? selectedMission.goal : "미션이 없습니다"}
                </h3>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[50] overflow-hidden p-2"
                >
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {missions.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => { setSelectedMission(m); setIsDropdownOpen(false); }}
                        className={`w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-all mb-1 last:mb-0 flex items-center justify-between group ${selectedMission?.id === m.id ? 'bg-indigo-50 border border-indigo-100' : ''}`}
                      >
                        <div className="overflow-hidden">
                           <p className={`text-[11px] font-bold truncate ${selectedMission?.id === m.id ? 'text-indigo-600' : 'text-slate-700'}`}>{m.goal}</p>
                           <p className="text-[9px] text-slate-400 font-medium">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                        {m.status === 'COMPLETED' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                        {m.status === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0"></div>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {selectedMission && (
          <div className="flex items-center gap-6 px-6 py-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">상태</span>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(selectedMission.status)}
                <span className="text-[10px] font-black uppercase text-slate-700">{selectedMission.status}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">진행률</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedMission.completedTasks / selectedMission.totalTasks) * 100}%` }}
                    className="h-full bg-indigo-500" 
                   />
                </div>
                <span className="text-[10px] font-black text-slate-700">{Math.round((selectedMission.completedTasks / (selectedMission.totalTasks || 1)) * 100)}%</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">태스크</span>
              <span className="text-[10px] font-black text-slate-700">{selectedMission.completedTasks} / {selectedMission.totalTasks}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gantt Chart Content */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
             <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center"><Target size={40} /></div>
             <p className="text-xs font-black uppercase tracking-widest">표시할 태스크가 없습니다</p>
          </div>
        ) : timelineData && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline Header (Seconds Scale) */}
            <div className="h-12 border-b border-slate-100 flex items-center bg-slate-50/30 shrink-0">
               <div className="w-64 border-r border-slate-100 h-full flex items-center px-8 shrink-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">태스크 리스트</span>
               </div>
               <div className="flex-1 h-full relative overflow-hidden">
                  <div className="absolute inset-0 flex">
                     {Array.from({ length: 11 }).map((_, i) => {
                        const seconds = Math.round((timelineData.totalSeconds / 10) * i);
                        return (
                          <div key={i} className="flex-1 border-r border-slate-100/50 relative">
                             <span className="absolute bottom-1 left-1 text-[8px] font-bold text-slate-400">+{seconds}s</span>
                          </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Chart Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {tasks.map((task, idx) => {
                  const taskStart = new Date(task.startedAt || task.createdAt).getTime();
                  const taskEnd = task.completedAt ? new Date(task.completedAt).getTime() : (task.status === 'RUNNING' || task.status === 'HEALING' ? now.getTime() : taskStart);
                  
                  const leftPercent = ((taskStart - timelineData.startTs) / timelineData.duration) * 100;
                  const widthPercent = Math.max(((taskEnd - taskStart) / timelineData.duration) * 100, 0.5); // 최소 0.5% 너비 보장
                  
                  const agentColor = task.agent ? getAgentColor(task.agent.name) : { bg: 'bg-slate-500', soft: 'text-slate-400', border: 'border-slate-300' };

                  return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="h-16 flex border-b border-slate-50 hover:bg-slate-50/50 transition-all group"
                    >
                      {/* Left: Task Info */}
                      <div className="w-64 border-r border-slate-100 flex items-center px-6 gap-3 shrink-0">
                         <div className={`w-8 h-8 rounded-lg ${agentColor.bg} flex items-center justify-center text-white shadow-sm shrink-0`}>
                            <Bot size={16} />
                         </div>
                         <div className="overflow-hidden">
                            <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight uppercase">{task.command.length > 30 ? task.command.substring(0, 30) + '...' : task.command}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               {getStatusIcon(task.status)}
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{task.agent?.name || 'Unknown'}</span>
                            </div>
                         </div>
                      </div>

                      {/* Right: Timeline Bar */}
                      <div className="flex-1 relative overflow-hidden bg-slate-50/10">
                         {/* Background Grid Lines */}
                         <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-100/30"></div>
                            ))}
                         </div>

                         {/* Task Bar */}
                         <div 
                           className="absolute top-1/2 -translate-y-1/2 h-8 flex items-center"
                           style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '40px' }}
                         >
                            <motion.div 
                              layoutId={`task-bar-${task.id}`}
                              className={`w-full h-full rounded-xl ${agentColor.bg} shadow-lg relative flex items-center px-3 group-hover:ring-4 ring-indigo-500/10 transition-all overflow-hidden`}
                            >
                               {/* Shimmer Effect for Running Tasks */}
                               {(task.status === 'RUNNING' || task.status === 'HEALING') && (
                                 <motion.div 
                                   animate={{ x: ['-100%', '200%'] }}
                                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
                                 />
                               )}
                               
                               <span className="text-[9px] font-black text-white truncate drop-shadow-sm z-10">
                                  {task.status === 'COMPLETED' ? `${Math.round((taskEnd - taskStart)/1000)}s` : task.status}
                               </span>

                               {/* Tooltip on Hover */}
                               <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[60]">
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[10px] w-48 border border-slate-700">
                                     <p className="font-black text-indigo-400 uppercase mb-1">Task Info</p>
                                     <p className="line-clamp-3 mb-2 font-medium">{task.command}</p>
                                     <div className="flex justify-between border-t border-slate-700 pt-2 text-slate-400 font-bold">
                                        <span>Duration:</span>
                                        <span>{Math.round((taskEnd - taskStart)/1000)}s</span>
                                     </div>
                                     {task.dependsOnIds && (
                                       <div className="flex justify-between mt-1 text-slate-400 font-bold">
                                          <span>Depends on:</span>
                                          <span className="text-orange-400">ID {task.dependsOnIds}</span>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </motion.div>

                            {/* Dependency Lines (Simplified: Indicator at the start of bar) */}
                            {task.dependsOnIds && (
                              <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center">
                                 <div className="w-3 h-px bg-slate-300"></div>
                                 <ArrowRight size={10} className="text-slate-300 -ml-1" />
                              </div>
                            )}
                         </div>
                      </div>
                    </motion.div>
                  );
               })}
            </div>
            
            {/* Footer / Legend */}
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
               <div className="flex gap-4">
                  {[
                    { label: 'Completed', color: 'bg-emerald-500' },
                    { label: 'Running', color: 'bg-indigo-500 animate-pulse' },
                    { label: 'Healing', color: 'bg-orange-500' },
                    { label: 'Failed', color: 'bg-rose-500' },
                    { label: 'Pending', color: 'bg-slate-300' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                       <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{item.label}</span>
                    </div>
                  ))}
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time sync active</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
