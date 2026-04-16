import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Zap, CheckCircle2, Circle, Loader2, 
  ChevronRight, Brain, Boxes, Play, ArrowRight,
  ShieldCheck, AlertCircle, Info, Activity, FileText
} from "lucide-react";
import { MissionSession, Task, workstreamService, taskService } from "../app/apiService";
import { MissionPostMortem } from "./MissionPostMortem";

interface MissionHiveDashboardProps {
  activeRoom: string;
}

export const MissionHiveDashboard: React.FC<MissionHiveDashboardProps> = ({ activeRoom }) => {
  const [missions, setMissions] = useState<MissionSession[]>([]);
  const [selectedMission, setSelectedMission] = useState<MissionSession | null>(null);
  const [missionTasks, setMissionTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [activeTab, setActiveTab] = useState<'FLOW' | 'POST_MORTEM'>('FLOW');
  
  // Reset tab when mission changes
  useEffect(() => {
    setActiveTab('FLOW');
  }, [selectedMission?.id]);

  useEffect(() => {
    fetchMissions();
    const interval = setInterval(fetchMissions, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, [activeRoom]);

  useEffect(() => {
    if (selectedMission) {
        fetchMissionDetails(selectedMission.id);
        const taskInterval = setInterval(() => fetchMissionDetails(selectedMission.id), 3000);
        return () => clearInterval(taskInterval);
    }
  }, [selectedMission?.id]);

  const fetchMissions = async () => {
    try {
      const res = await workstreamService.getMissions(activeRoom);
      setMissions(res.data);
      if (res.data.length > 0 && !selectedMission) {
        setSelectedMission(res.data[0]);
      }
      
      // Update selected mission if it exists in the list to reflect latest stats
      if (selectedMission) {
        const updated = res.data.find(m => m.id === selectedMission.id);
        if (updated) setSelectedMission(updated);
      }
    } catch (e) {
      console.error("Failed to fetch missions:", e);
    }
  };

  const fetchMissionDetails = async (id: number) => {
    try {
        const res = await taskService.getByMission(id);
        setMissionTasks(res.data);
    } catch (e) {
        console.error("Failed to fetch mission tasks:", e);
    }
  };

  const handleStartMission = async () => {
    if (!goalInput.trim()) return;
    setIsStarting(true);
    try {
      await workstreamService.start({ roomId: activeRoom, goal: goalInput });
      setGoalInput("");
      fetchMissions();
    } catch (e) {
      console.error("Failed to start mission:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'FAILED': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="flex-1 flex gap-8 overflow-hidden">
      {/* Left Pane: Mission List & Creation */}
      <div className="w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">신규 그랜드 미션</h3>
          <div className="space-y-4">
            <textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="프로젝트의 최종 목표를 입력하세요..."
              className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
            />
            <button
              onClick={handleStartMission}
              disabled={isStarting || !goalInput.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              하이브 오케스트레이션 개시
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">미션 히스토리</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {missions.map((mission) => (
              <motion.div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer group ${selectedMission?.id === mission.id ? 'bg-indigo-50/50 border-indigo-200 shadow-lg' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-tighter ${getStatusColor(mission.status)}`}>
                    {mission.status}
                  </span>
                  <span className="text-[8px] font-bold text-slate-300">#{mission.id}</span>
                </div>
                <h4 className="text-[10px] font-black text-slate-700 truncate mb-2 group-hover:text-indigo-600 transition-colors uppercase italic">{mission.goal}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(mission.completedTasks / (mission.totalTasks || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-400">{mission.completedTasks}/{mission.totalTasks}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane: Mission Stage */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedMission ? (
          <>
            {/* Mission Stats Board */}
            <div className="grid grid-cols-4 gap-6 shrink-0">
               {[
                 { label: "현재 상태", val: selectedMission.status, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50" },
                 { label: "완료율", val: `${Math.round((selectedMission.completedTasks / (selectedMission.totalTasks || 1)) * 100)}%`, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50" },
                 { label: "분해된 태스크", val: selectedMission.totalTasks, icon: Boxes, color: "text-amber-500", bg: "bg-amber-50" },
                 { label: "생성일", val: new Date(selectedMission.createdAt).toLocaleTimeString(), icon: Info, color: "text-slate-400", bg: "bg-slate-50" },
               ].map((stat, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/20 flex items-center gap-4"
                 >
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-sm font-black text-slate-800 uppercase">{stat.val}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Main Stage: Strategy & Progress */}
            <div className="flex-1 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
               <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        <Brain size={20} />
                     </div>
                     <div>
                        <h2 className="text-white text-sm font-black uppercase tracking-tight italic">하이브 스웜 오퍼레이션 스테이지</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">지능형 다중 에이전트 협업 분석 및 실행 뷰</p>
                     </div>
                  </div>
                  <div className="flex gap-4 items-center">
                     <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
                        <button 
                          onClick={() => setActiveTab('FLOW')}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'FLOW' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                           오퍼레이션 맵
                        </button>
                        <button 
                          onClick={() => setActiveTab('POST_MORTEM')}
                          disabled={!selectedMission.isSynthesized}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'POST_MORTEM' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
                        >
                           사후 분석 보고서
                           {selectedMission.isSynthesized && <Sparkles size={10} className="text-amber-400" />}
                        </button>
                     </div>
                     <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">자율 최적화 경로 가동 중</span>
                  </div>
               </div>

               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar-dark relative">
                  {/* Background Accents */}
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                  {activeTab === 'FLOW' ? (
                    /* Task Flow Visualization */
                    <div className="flex flex-col gap-10 items-center relative z-10 py-10">
                       <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-5 rounded-3xl shadow-2xl">
                          <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-center">Root Goal</p>
                          <h3 className="text-white text-xs font-black uppercase tracking-tight text-center italic">{selectedMission.goal}</h3>
                       </div>

                       <div className="w-px h-12 bg-gradient-to-b from-indigo-500/50 to-transparent"></div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                          {selectedMission.decompositionStructure ? (
                            JSON.parse(selectedMission.decompositionStructure).subTasks.map((st: any, idx: number) => {
                              const realTask = missionTasks[idx]; 
                              const status = realTask?.status || 'PENDING';
                              
                              return (
                              <motion.div 
                                key={st.id}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + idx * 0.1 }}
                                className={`bg-white/5 border p-6 rounded-[2rem] hover:bg-white/[0.08] transition-all relative group ${
                                  status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 
                                  status === 'RUNNING' ? 'border-indigo-500/50 bg-indigo-500/[0.05] ring-1 ring-indigo-500/20' :
                                  status === 'HEALING' ? 'border-orange-500/50 bg-orange-500/[0.05] animate-pulse' :
                                  'border-white/10'
                                }`}
                              >
                                 <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md border uppercase ${
                                      status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' :
                                      status === 'RUNNING' ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30' :
                                      'text-slate-400 bg-slate-500/10 border-white/10'
                                    }`}>{st.id}</span>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white/50 border border-white/10 group-hover:border-indigo-500/50 transition-all ${
                                      status === 'RUNNING' ? 'text-indigo-400 border-indigo-500/50' : ''
                                    }`}>
                                       {status === 'COMPLETED' ? <CheckCircle2 size={14} className="text-emerald-500" /> : 
                                        status === 'RUNNING' ? <Loader2 size={14} className="animate-spin" /> : 
                                        status === 'HEALING' ? <Zap size={14} className="text-orange-500" /> :
                                        <Boxes size={14} />}
                                    </div>
                                 </div>
                                 <h5 className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2 truncate group-hover:text-white transition-colors">{st.description}</h5>
                                 <p className="text-slate-500 text-[9px] font-bold line-clamp-2 leading-relaxed mb-4">{st.command}</p>
                                 <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                       <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[8px] font-black text-slate-400">
                                          {realTask?.agent?.name?.[0] || st.agentName[0]}
                                       </div>
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{realTask?.agent?.name || st.agentName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       {st.dependsOn.length > 0 && <span className="text-[8px] font-black text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded uppercase">Deps: {st.dependsOn.join(',')}</span>}
                                    </div>
                                 </div>
                              </motion.div>
                              );
                            })
                          ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                               <Loader2 size={40} className="animate-spin" />
                               <p className="text-xs font-black uppercase tracking-widest">하이브 지능이 목표를 공식화하는 중...</p>
                            </div>
                          )}
                       </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                       <MissionPostMortem report={selectedMission.postMortemReport || ""} />
                    </div>
                  )}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center"><Target size={48} /></div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2 italic">No Active Mission Selected</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest">좌측 패널에서 미션을 선택하거나 새로운 목표를 부여하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
