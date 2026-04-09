"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, User, MessageSquare, Plus, X, Users, Terminal, Code2, Layout, Database, 
  Send, Command, Loader2, Sparkles, Coffee, GripVertical, Presentation, Maximize2, 
  BarChart3, BarChart2, Brain, Calendar, Activity, ChevronRight, Pause, Play, 
  Trash2, Search, Leaf, ShoppingBag, Zap, Target, Heart, ShieldAlert, TrendingUp, History 
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

// Types and Services
import { 
  agentService, taskService, chatService, skillService, activityService, 
  schedulingService, codeReviewService, memoryService, officeService, 
  codebaseService, briefingService, techPulseService, projectHealthService, 
  lessonService, shadowService, cognitiveService, janitorService, 
  missionIntelligenceService, ActionableStrategy 
} from "./apiService";

// Utilities
import { getAgentColor } from "../utils/agentColors";

// Hooks
import { useVirtualOffice } from "../hooks/useVirtualOffice";
import { useStompWS } from "../hooks/useStompWS";

// Components
import { EmotionBubble } from "../components/EmotionBubble";
import { KnowledgeExplorer } from "../components/KnowledgeExplorer";
import { WisdomVault } from "../components/WisdomVault";
import { CodebaseExplorer } from "../components/CodebaseExplorer";
import { ProjectHealthModal } from "../components/modals/ProjectHealthModal";
import { TeamProductivityChart } from "../components/charts/TeamProductivityChart";
import { DailyBriefingModal } from "../components/modals/DailyBriefingModal";
import { MissionMap } from "../components/MissionMap";
import { MissionIntelligenceBoard } from "../components/MissionIntelligenceBoard";
import { TechPulseCard } from "../components/TechPulseCard";
import { CognitiveTraceTimeline } from "../components/CognitiveTraceTimeline";
import { CommandPalette } from "../components/CommandPalette";
import { LivePreviewBubble } from "../components/LivePreviewBubble";

export default function VirtualOfficeBright() {
  const vo = useVirtualOffice();
  const stompClient = useRef<any>(null);

  // Initialize WebSocket and Data
  useStompWS(
    stompClient,
    vo.setMessages,
    vo.setTasks,
    vo.setAgents,
    vo.setActivities,
    vo.setPerformanceData,
    vo.setActiveConnections,
    vo.setActiveChat,
    vo.setActivePreviews,
    vo.setShowHealingToast,
    vo.setCognitiveTraces,
    vo.setActiveCollaborations,
    vo.setIsIntelligenceBoosted,
    vo.fetchInitialData
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [vo.messages]);

  useEffect(() => {
    if (consoleScrollRef.current) {
      consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [vo.activities]);

  // Handlers (Simplified for extraction in next phase)
  const handleSendMessage = async () => {
    if (!vo.inputValue.trim()) return;
    try {
      await chatService.send("default", "User", vo.inputValue);
      vo.setInputValue("");
    } catch (err) {
      console.error("메시지 전송 실패:", err);
    }
  };

  const handleCreateAgent = async () => {
    vo.setIsDeploying(true);
    try {
      if (vo.editingAgentId) {
        await agentService.update(vo.editingAgentId, vo.newAgent);
      } else {
        await agentService.create(vo.newAgent);
      }
      vo.setIsDeployModalOpen(false);
      vo.setEditingAgentId(null);
      vo.setNewAgent({ name: "", role: "", model: vo.newAgent.model, systemPrompt: "", assignedSkills: [] });
      vo.fetchInitialData();
    } catch (err) {
      console.error("에이전트 처리 실패:", err);
    } finally {
      vo.setIsDeploying(false);
    }
  };

  const handleDeleteAgent = async (id: number) => {
    if (!confirm("정말 이 에이전트를 해제하시겠습니까?")) return;
    try {
      await agentService.delete(id);
      vo.fetchInitialData();
    } catch (err) {
      console.error("에이전트 해제 실패:", err);
    }
  };

  const handleExecuteCommand = async (command: string) => {
    try {
      await taskService.execute("default", command);
      vo.setInputValue("");
    } catch (err) {
      console.error("명령 실행 실패:", err);
    }
  };

  const handleStartReview = async () => {
    vo.setIsReviewing(true);
    try {
        await codeReviewService.analyze();
        const res = await codeReviewService.getAll();
        vo.setCodeReviews(res.data);
    } catch (e) {
        console.error("리뷰 실패:", e);
    } finally {
        vo.setIsReviewing(false);
    }
  };

  const handleApplyFix = async (reviewId: number) => {
    try {
      await codeReviewService.applyFix(reviewId);
      alert("AI 제안 코드가 반영되었습니다.");
      const res = await codeReviewService.getAll();
      vo.setCodeReviews(res.data);
    } catch (e) {
      console.error("Refactor failed:", e);
    }
  };

  const handleStartJanitor = async () => {
    vo.setIsJanitorScanning(true);
    try {
      await janitorService.scan();
      const res = await janitorService.getIssues();
      vo.setJanitorIssues(res.data);
    } catch (e) {
      console.error("Scanning failed:", e);
    } finally {
      vo.setIsJanitorScanning(false);
    }
  };

  const handleJanitorFix = async (issueId: number) => {
    vo.setIsJanitorLoading(true);
    try {
      await janitorService.fix(issueId);
      const res = await janitorService.getIssues();
      vo.setJanitorIssues(res.data);
    } catch (e) {
      console.error("Fix failed:", e);
    } finally {
      vo.setIsJanitorLoading(false);
    }
  };

  const handleCreateScheduledTask = async () => {
    try {
      await schedulingService.create(vo.newScheduledTask);
      vo.setIsSchedulerModalOpen(false);
      const res = await schedulingService.getAll();
      vo.setScheduledTasks(res.data);
    } catch (err) {
      console.error("Scheduler failed:", err);
    }
  };

  const handleToggleScheduler = async (id: number) => {
    try {
      await schedulingService.toggle(id);
      const res = await schedulingService.getAll();
      vo.setScheduledTasks(res.data);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleOpenWhiteboard = async (agentName: string) => {
    try {
      const res = await agentService.getWhiteboard(agentName);
      vo.setWhiteboardContent(res.data);
      vo.setIsWhiteboardOpen(true);
    } catch (err) {
      console.error("Whiteboard load failed:", err);
    }
  };

  const handleBrowse = async (url: string) => {
    try {
      vo.setIsBrowserOpen(true);
      vo.setBrowserUrl(url);
      const res = await agentService.browse(url);
      vo.setBrowserScreenshot(res.data);
    } catch (err) {
      console.error("Browse failed:", err);
    }
  };

  const handleAdoptStrategy = async (strategy: ActionableStrategy) => {
    try {
      await projectHealthService.adopt(strategy);
      vo.fetchInitialData();
    } catch (err) {
      console.error("Strategy adoption failed:", err);
    }
  };

  const handleCommanderAction = (id: string) => {
    vo.setIsCommanderOpen(false);
    if (id.startsWith('NAV_')) {
      vo.setActiveTab(id.replace('NAV_', '') as any);
      if (['STATS', 'ANALYTICS'].includes(id.replace('NAV_', ''))) {
          vo.setActiveCategory('METRICS');
      } else if (['REASONING', 'CODE_REVIEW', 'JANITOR', 'MISSION_CONTROL'].includes(id.replace('NAV_', ''))) {
          vo.setActiveCategory('INTELLIGENCE');
      } else {
          vo.setActiveCategory('PROCESS');
      }
    }
    if (id === 'ACTION_DAILY_BRIEFING') {
      vo.setIsBriefingOpen(true);
    }
    if (id === 'ACTION_PROJECT_HEALTH') {
      vo.setIsHealthModalOpen(true);
    }
  };

  const commanderActions = [
    { id: 'NAV_LOGS', label: 'Go to Activity Logs', icon: Terminal, category: 'NAVIGATION' },
    { id: 'NAV_REASONING', label: 'Go to Reasoning Trace', icon: Brain, category: 'NAVIGATION' },
    { id: 'NAV_MISSION_CONTROL', label: 'Go to Mission Control', icon: Target, category: 'NAVIGATION' },
    { id: 'NAV_JANITOR', label: 'Go to Technical Janitor', icon: Trash2, category: 'NAVIGATION' },
    { id: 'NAV_CODE_REVIEW', label: 'Go to Code Review', icon: ShieldAlert, category: 'NAVIGATION' },
    { id: 'NAV_STATS', label: 'Go to Stats Center', icon: BarChart2, category: 'NAVIGATION' },
    { id: 'NAV_ANALYTICS', label: 'Go to Team Analytics', icon: BarChart3, category: 'NAVIGATION' },
    { id: 'NAV_TECH_PULSE', label: 'Go to Tech Pulse', icon: Activity, category: 'NAVIGATION' },
    { id: 'ACTION_DAILY_BRIEFING', label: 'Open Daily Briefing', icon: Sparkles, category: 'ACTIONS' },
    { id: 'ACTION_PROJECT_HEALTH', label: 'Run Project Health Audit', icon: Heart, category: 'ACTIONS' },
    { id: 'TOOL_SEARCH', label: 'Semantic Code Search', icon: Search, category: 'TOOLS' },
    { id: 'TOOL_KNOWLEDGE', label: 'Knowledge Explorer', icon: Database, category: 'TOOLS' },
  ];

  // Render Logic
  return (
    <main className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-[family-name:var(--font-geist-sans)] selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence>
        {vo.showHealingToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] bg-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-orange-400 font-black tracking-tight"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse"><Zap size={16} fill="white" /></div>
            {vo.showHealingToast}
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette 
        isOpen={vo.isCommanderOpen}
        onClose={() => vo.setIsCommanderOpen(false)}
        actions={commanderActions}
        onAction={handleCommanderAction}
        query={vo.commanderQuery}
        onQueryChange={(q) => vo.setCommanderQuery(q)}
      />

      <KnowledgeExplorer 
        isOpen={vo.isKnowledgeExplorerOpen}
        onClose={() => vo.setIsKnowledgeExplorerOpen(false)}
        memories={vo.memories}
        onSearch={(q) => vo.setMemories([]) || vo.fetchInitialData()} // Simplified for now
        isLoading={vo.isMemoriesLoading}
        getAgentColor={getAgentColor}
      />

      <WisdomVault 
        isOpen={vo.isWisdomVaultOpen}
        onClose={() => vo.setIsWisdomVaultOpen(false)}
        lessons={vo.lessons}
        getAgentColor={getAgentColor}
      />

      <CodebaseExplorer 
        isOpen={vo.isCodebaseExplorerOpen}
        onClose={() => vo.setIsCodebaseExplorerOpen(false)}
        results={vo.codebaseResults}
        onSearch={async (q) => {
            vo.setIsCodebaseLoading(true);
            const res = await codebaseService.search(q);
            vo.setCodebaseResults(res.data);
            vo.setIsCodebaseLoading(false);
        }}
        onIndex={async () => {
            vo.setIsIndexing(true);
            await codebaseService.index();
            vo.setIsIndexing(false);
        }}
        isLoading={vo.isCodebaseLoading}
        isIndexing={vo.isIndexing}
      />

      <ProjectHealthModal 
        isOpen={vo.isHealthModalOpen}
        onClose={() => vo.setIsHealthModalOpen(false)}
        report={vo.healthReport}
        isLoading={vo.isHealthLoading}
        onAdopt={handleAdoptStrategy}
      />

      <DailyBriefingModal 
        isOpen={vo.isBriefingOpen}
        onClose={() => vo.setIsBriefingOpen(false)}
        content={vo.briefingContent}
        isLoading={vo.isBriefingLoading}
      />

      {/* Sidebar */}
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
              onClick={async () => {
                vo.setIsHealthLoading(true);
                vo.setIsHealthModalOpen(true);
                const res = await projectHealthService.getReport();
                vo.setHealthReport(res.data);
                vo.setIsHealthLoading(false);
              }}
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
                  placeholder="Quick command (Ctrl+K)..." 
                  className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-full placeholder:text-slate-400"
                  onFocus={() => vo.setIsCommanderOpen(true)}
                  readOnly
                />
             </div>
          </div>
          
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Workspace</span>
             </div>
             <div className="flex items-center gap-2">
                <button 
                   onClick={() => vo.setIsKnowledgeExplorerOpen(true)}
                   className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                >
                   <Database size={14} />
                </button>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Agents</h2>
              <button 
                onClick={() => vo.setIsDeployModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black transition-all border border-indigo-100 shadow-sm"
              >
                <Plus size={12} strokeWidth={3} /> DEPLOY
              </button>
            </div>
            <div className="space-y-3">
              {vo.agents.map((agent) => (
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
                          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{agent.role}</p>
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
                    >
                      <Code2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id);
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
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
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Streams</h2>
              <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">{(vo.tasks.filter(t => t.status === 'RUNNING').length)} ACTIVE</span>
            </div>
            <div className="space-y-2">
              {vo.tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3 group hover:bg-white hover:shadow-md transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-500' : task.status === 'HEALING' ? 'bg-orange-50 text-orange-500' : task.status === 'FAILED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                    {task.status === 'RUNNING' ? <Activity size={14} className="animate-pulse" /> : <Terminal size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{task.command}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{task.agent?.name}</span>
                       <span className="text-[8px] text-slate-300">•</span>
                       <span className={`text-[8px] font-black uppercase ${task.status === 'RUNNING' ? 'text-indigo-500' : task.status === 'HEALING' ? 'text-orange-500' : 'text-slate-500'}`}>{task.status}</span>
                    </div>
                  </div>
                  {task.status === 'RUNNING' && (
                    <button 
                      onClick={() => handleStartShadow(task.id)}
                      className="p-1.5 hover:bg-indigo-600 hover:text-white text-indigo-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Shadow Coding"
                    >
                        <ShieldAlert size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-white">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            <nav className="flex gap-1 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
              {[
                { id: 'PROCESS', label: 'WORKSTATION', icon: Terminal },
                { id: 'INTELLIGENCE', label: 'INTELLIGENCE', icon: Brain },
                { id: 'METRICS', label: 'ANALYTICS', icon: BarChart3 },
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
                    {['LOGS', 'SCHEDULER', 'KANBAN', 'MISSION'].map(tab => (
                      <button key={tab} onClick={() => vo.setActiveTab(tab as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
               )}
               {vo.activeCategory === 'INTELLIGENCE' && (
                  <div className="flex gap-1">
                    {['REASONING', 'CODE_REVIEW', 'JANITOR', 'MISSION_CONTROL'].map(tab => (
                      <button key={tab} onClick={() => vo.setActiveTab(tab as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
               )}
               {vo.activeCategory === 'METRICS' && (
                  <div className="flex gap-1">
                    {['STATS', 'ANALYTICS', 'TECH_PULSE'].map(tab => (
                      <button key={tab} onClick={() => vo.setActiveTab(tab as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${vo.activeTab === tab ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                        {tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
               )}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex -space-x-3 mr-4">
                {vo.agents.slice(0, 4).map(agent => (
                   <div key={agent.id} className={`w-8 h-8 rounded-full border-2 border-white ${getAgentColor(agent.name).bg} flex items-center justify-center text-white text-[10px] font-bold shadow-sm relative group cursor-pointer tooltip`}>
                      <span className="uppercase">{agent.name[0]}</span>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {agent.name}
                      </div>
                   </div>
                ))}
             </div>
             
             <button 
                onClick={async () => {
                  vo.setIsBriefingLoading(true);
                  vo.setIsBriefingOpen(true);
                  const res = await briefingService.get();
                  vo.setBriefingContent(res.data.content);
                  vo.setIsBriefingLoading(false);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-95"
             >
                <Sparkles size={14} /> DAY BRIEFING
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-8 gap-8 bg-slate-50/30">
          {vo.activeCategory === 'PROCESS' && vo.activeTab === 'LOGS' && (
             <div className="flex-1 flex gap-8">
                <div className="flex-1 flex flex-col rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
                   <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                          <MessageSquare size={16} />
                        </div>
                        <h3 className="font-black text-slate-800 tracking-tight text-sm uppercase">Global Communication</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Syncing</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar scroll-smooth" ref={scrollRef}>
                      {vo.messages.map((msg, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-5 ${msg.sender === 'User' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white shadow-lg ${msg.sender === 'User' ? 'bg-slate-800' : getAgentColor(msg.sender).bg}`}>
                            {msg.sender === 'User' ? <User size={24} /> : <Bot size={24} />}
                          </div>
                          <div className={`max-w-[80%] flex flex-col ${msg.sender === 'User' ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.sender}</span>
                              <span className="text-[9px] text-slate-300 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className={`px-6 py-4 rounded-[1.5rem] text-[13px] font-medium leading-relaxed ${msg.sender === 'User' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border border-slate-100/50 text-slate-700'}`}>
                              <ReactMarkdown 
                                 components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  code: ({ node, ...props }) => <code className="bg-black/5 px-1 rounded font-mono text-[11px]" {...props} />,
                                  pre: ({ children }) => <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl my-3 overflow-x-auto text-[11px] font-mono leading-relaxed">{children}</pre>
                                 }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                   </div>

                   <div className="p-8 border-t border-slate-50 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.012)]">
                      <div className="relative group">
                         <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform"></div>
                         <div className="flex gap-4">
                            <input
                              type="text"
                              placeholder="Type a global message or command..."
                              className="w-full bg-slate-50 border border-slate-100/50 rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100/30 transition-all font-mono"
                              value={vo.inputValue}
                              onChange={(e) => vo.setInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (vo.inputValue.startsWith('/')) handleExecuteCommand(vo.inputValue.substring(1));
                                  else handleSendMessage();
                                }
                              }}
                            />
                            <button 
                              onClick={handleSendMessage}
                              disabled={!vo.inputValue.trim()}
                              className="px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-400 text-white rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center group"
                            > 
                              <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="w-96 flex flex-col gap-8">
                   <div className="flex-1 flex flex-col rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-black/20">
                         <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                         </div>
                         <div className="flex items-center gap-2">
                           <Terminal size={14} className="text-slate-500" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Activity</span>
                         </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar-dark font-mono text-[11px]" ref={consoleScrollRef}>
                         {vo.activities.map((act, i) => (
                           <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} key={act.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-500">[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                                <span className={`${getAgentColor(act.agentName).soft} font-bold`}>{act.agentName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${act.type === 'PLANNING' ? 'bg-indigo-500' : act.type === 'TOOL' ? 'bg-emerald-600' : 'bg-slate-600'}`}>{act.type}</span>
                              </div>
                              <div className="pl-4 border-l border-slate-800 py-1 text-slate-300 leading-relaxed break-all">
                                {act.content}
                              </div>
                           </motion.div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="h-64 rounded-[2rem] bg-white border border-slate-100 shadow-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer relative overflow-hidden overflow-y-auto custom-scrollbar">
                      <TeamProductivityChart performance={vo.performanceData} />
                   </div>
                </div>
             </div>
          )}

          {vo.activeTab === 'SCHEDULER' && vo.activeCategory === 'PROCESS' && (
             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
                <motion.div 
                  onClick={() => vo.setIsSchedulerModalOpen(true)}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                >
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center mb-4 transition-all shadow-sm">
                      <Plus size={32} />
                   </div>
                   <p className="text-sm font-black uppercase tracking-widest">New Automated Task</p>
                </motion.div>
                
                {vo.scheduledTasks.map((task) => (
                  <motion.div 
                    key={task.id} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-500 shadow-inner">
                           <Calendar size={24} />
                        </div>
                        <button 
                          onClick={() => handleToggleScheduler(task.id)}
                          className={`w-12 h-6 rounded-full relative transition-all duration-300 ease-in-out ${task.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${task.active ? 'left-7' : 'left-1'}`}></div>
                        </button>
                     </div>
                     <h4 className="text-sm font-black text-slate-800 mb-2 truncate leading-tight uppercase">{task.description}</h4>
                     <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-4 truncate italic">{task.command}</p>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                           <div className={`w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400`}>A</div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vo.agents.find(a => a.id === task.agentId)?.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{task.cronExpression}</span>
                     </div>
                  </motion.div>
                ))}
             </div>
          )}

          {vo.activeTab === 'MISSION' && vo.activeCategory === 'PROCESS' && (
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pb-10">
               {vo.tasks.filter(t => t.status === 'RUNNING' || t.status === 'HEALING').map(task => (
                 <MissionMap key={task.id} parentTask={task} subTasks={vo.tasks.filter(st => st.parentId === task.id)} getAgentColor={getAgentColor} />
               ))}
               {vo.tasks.filter(t => t.status === 'RUNNING' || t.status === 'HEALING').length === 0 && (
                  <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50 py-20">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center"><Target size={40} /></div>
                    <p className="text-sm font-black uppercase tracking-widest">No active missions to track</p>
                  </div>
               )}
            </div>
          )}

          {vo.activeTab === 'REASONING' && vo.activeCategory === 'INTELLIGENCE' && (
             <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 pr-4">
                <CognitiveTraceTimeline traces={vo.cognitiveTraces} getAgentColor={getAgentColor} agents={vo.agents} />
             </div>
          )}

          {vo.activeTab === 'CODE_REVIEW' && vo.activeCategory === 'INTELLIGENCE' && (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Autonomous QA Center</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AI 기반 코드 시맨틱 결함 관측 서비스</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleStartReview}
                        disabled={vo.isReviewing}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vo.isReviewing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-rose-600 shadow-xl active:scale-95'}`}
                    >
                        {vo.isReviewing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        {vo.isReviewing ? 'Analyzing...' : 'Execute Comprehensive Review'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4 pb-10">
                    {vo.codeReviews.length === 0 && !vo.isReviewing ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                                <Code2 size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black uppercase tracking-widest mb-2 text-slate-500">지능형 코드 리뷰 대기 중</p>
                                <p className="text-[11px] font-bold text-slate-400 max-w-sm leading-relaxed">에이전트들이 코드베이스를 분석하여 잠재적 버그, 보안 취약점, 성능 저하 요인을 발견하고 해결책을 제시합니다.</p>
                            </div>
                        </div>
                    ) : (
                        vo.codeReviews.map((review) => (
                            <motion.div 
                                key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-lg group hover:border-rose-200 transition-all"
                            >
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${review.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : review.severity === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'}`}>
                                            {review.severity}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Code2 size={14} className="text-slate-400" />
                                            <span className="text-xs font-mono font-bold text-slate-700">{review.fileName}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(review.generatedAt).toLocaleString()}</span>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight uppercase">{review.reason}</h4>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{review.description}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Current Implementation</span>
                                            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner overflow-x-auto">
                                                <pre className="text-[11px] font-mono text-rose-300 leading-relaxed"><code>{review.originalSnippet}</code></pre>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] px-2 italic">AI Recommendation</span>
                                            <div className="bg-indigo-900/10 rounded-2xl p-5 border border-indigo-500/20 shadow-inner overflow-x-auto relative">
                                                <pre className="text-[11px] font-mono text-indigo-600 leading-relaxed"><code>{review.suggestedFix}</code></pre>
                                                <div className="absolute top-4 right-4"><Sparkles size={16} className="text-indigo-400 animate-pulse" /></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                                        <button className="px-6 py-2.5 rounded-xl border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Ignore</button>
                                        <button 
                                            onClick={() => handleApplyFix(review.id)}
                                            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                        >
                                            Apply AI Patch
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
          )}

          {vo.activeTab === 'JANITOR' && vo.activeCategory === 'INTELLIGENCE' && (
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Autonomous AI Janitor</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">실시간 기술 부채 스캔 및 자동 해소 시스템</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleStartJanitor}
                        disabled={vo.isJanitorScanning}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vo.isJanitorScanning ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-xl active:scale-95'}`}
                    >
                        {vo.isJanitorScanning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        {vo.isJanitorScanning ? 'Scanning...' : 'Start Full System Scan'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-4 pb-10">
                    {vo.isJanitorScanning && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-16 h-16 border-4 border-t-indigo-500 border-indigo-100 rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center text-indigo-500"><Search size={24} /></div>
                            </div>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">코드베이스 전체 기술 부채 실시간 분석 중...</p>
                        </div>
                    )}
                    {vo.janitorIssues.length === 0 && !vo.isJanitorScanning ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center"><Bot size={40} /></div>
                            <p className="text-sm font-black uppercase tracking-widest">No critical maintenance issues detected</p>
                        </div>
                    ) : (
                        vo.janitorIssues.map((issue) => (
                            <motion.div key={issue.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${issue.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
                                    <ShieldAlert size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${issue.status === 'FIXED' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}>{issue.status}</span>
                                        <span className="text-[10px] font-black text-slate-400 font-mono italic">{issue.filePath}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 mb-1 leading-tight uppercase">{issue.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-1">{issue.description}</p>
                                </div>
                                <button
                                    onClick={() => handleJanitorFix(issue.id)}
                                    disabled={vo.isJanitorLoading || issue.status === 'FIXED'}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    {issue.status === 'FIXED' ? 'Resolved' : 'Auto Fix'}
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
             </div>
          )}

          {vo.activeTab === 'MISSION_CONTROL' && vo.activeCategory === 'INTELLIGENCE' && (
              <div className="flex-1 overflow-hidden bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col">
                  <div className="p-8 border-b border-slate-800 bg-black/20 shrink-0">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg">
                                <Presentation size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase">전역 미션 지능 보드</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Session: Default Alpha</span>
                                    {vo.isMissionIntelligenceLoading && <Loader2 size={12} className="animate-spin text-slate-600" />}
                                </div>
                            </div>
                         </div>
                         <div className="flex gap-3">
                             {['CORE', 'ANOMALY', 'STRATEGY'].map(tag => (
                                 <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black tracking-widest uppercase border border-slate-700">{tag}</span>
                             ))}
                         </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                      <MissionIntelligenceBoard intelligence={vo.missionIntelligence} isLoading={vo.isMissionIntelligenceLoading} />
                  </div>
              </div>
          )}

          {vo.activeTab === 'TECH_PULSE' && vo.activeCategory === 'METRICS' && (
             <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between shrink-0 px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                         <Zap size={20} />
                      </div>
                      <div>
                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Tech Pulse</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AI 기반 기술 트렌드 및 프로젝트 영향도 실시간 관측</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">Last Updated: {new Date().toLocaleTimeString()}</span>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vo.techPulses.map(pulse => (
                         <TechPulseCard key={pulse.id} pulse={pulse} />
                      ))}
                      {vo.techPulses.length === 0 && (
                        <div className="col-span-full h-64 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 gap-4">
                           <Loader2 size={32} className="animate-spin" />
                           <p className="text-xs font-black uppercase tracking-widest">트렌드 레이더 가동 중...</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {vo.activeCategory === 'METRICS' && vo.activeTab === 'STATS' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pb-10">
              <div className="lg:col-span-2 flex flex-col gap-8">
                 <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Agent Productivity Trends</h4>
                    <TeamProductivityChart performance={vo.performanceData} />
                 </div>
              </div>
              <div className="flex flex-col gap-8">
                 <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex-1 flex flex-col overflow-hidden">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">System Morale & Health</h4>
                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                       <div className="relative w-48 h-48 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                             <circle cx="96" cy="96" r="80" stroke="#1e293b" strokeWidth="16" fill="transparent" />
                             <motion.circle 
                                cx="96" cy="96" r="80" stroke="#818cf8" strokeWidth="16" fill="transparent" 
                                strokeDasharray={502.4} 
                                initial={{ strokeDashoffset: 502.4 }}
                                animate={{ strokeDashoffset: 502.4 - (502.4 * 0.85) }}
                                transition={{ duration: 2, ease: "easeOut" }}
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-5xl font-black text-white">85</span>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Condition</span>
                          </div>
                       </div>
                       <div className="w-full space-y-5">
                          {[
                            { label: "Memory Retention", val: 92, color: "bg-emerald-500" },
                            { label: "Task Throughput", val: 78, color: "bg-indigo-500" },
                            { label: "Logic Consistency", val: 88, color: "bg-violet-500" },
                          ].map((stat, i) => (
                             <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                   <span>{stat.label}</span>
                                   <span>{stat.val}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: `${stat.val}%` }} transition={{ delay: i * 0.1 }} className={`h-full ${stat.color}`} />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {vo.activeChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`fixed bottom-10 right-10 w-[420px] bg-white rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 overflow-hidden flex flex-col z-[50] border border-slate-100`}
          >
            <div className={`px-8 py-6 ${getAgentColor(vo.activeChat).bg} flex items-center justify-between shadow-lg relative overflow-hidden`}>
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
              
              <div className="flex items-center gap-4 text-white relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight capitalize">{vo.activeChat} <span className="text-[10px] opacity-70 font-normal ml-1">Direct Console</span></h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Synchronized</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                 <button onClick={() => vo.setActiveChat(null)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
                   <X size={18} />
                 </button>
              </div>
            </div>
            
            <div className="flex-1 h-[450px] overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20 relative">
               {vo.activePreviews[vo.activeChat] && <LivePreviewBubble preview={vo.activePreviews[vo.activeChat]!} getAgentColor={getAgentColor} />}
               {vo.messages.filter(m => m.sender === vo.activeChat || (m.sender === 'User' && m.content.includes(`@${vo.activeChat}`))).length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 italic text-sm">
                    No private records found.
                 </div>
               ) : (
                 vo.messages.filter(m => m.sender === vo.activeChat || (m.sender === 'User' && m.content.includes(`@${vo.activeChat}`))).map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3.5 rounded-2xl text-[12px] font-medium leading-relaxed ${msg.sender === 'User' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </motion.div>
                 ))
               )}
            </div>
            
            <div className="p-8 bg-white border-t border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 flex items-center gap-3 group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all">
                    <Command size={14} className="text-slate-400 group-focus-within:text-indigo-500" />
                    <input 
                      type="text" 
                      placeholder={`Message ${vo.activeChat}...`}
                      className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-full placeholder:text-slate-400 uppercase tracking-tighter" 
                      value={vo.inputValue}
                      onChange={(e) => vo.setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          chatService.send("default", "User", `@${vo.activeChat} ${vo.inputValue}`);
                          vo.setInputValue("");
                        }
                      }}
                    />
                  </div>
                  <button 
                  onClick={() => {
                     chatService.send("default", "User", `@${vo.activeChat} ${vo.inputValue}`);
                     vo.setInputValue("");
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl ${getAgentColor(vo.activeChat).bg} text-white shadow-lg shadow-indigo-100 active:scale-90 transition-all`}>
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {vo.isDeployModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-xl border border-white/20 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Bot size={24} /></div>
                     <div>
                        <h3 className="text-xl font-black italic tracking-tight uppercase">Agent Deployment</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">New Intelligence Registration</p>
                     </div>
                  </div>
                  <button onClick={() => vo.setIsDeployModalOpen(false)} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={20} /></button>
               </div>
               
               <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
                     <input type="text" placeholder="E.g. Analyst, Coder..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase" value={vo.newAgent.name} onChange={e => vo.setNewAgent({...vo.newAgent, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                     <input type="text" placeholder="Describe agent responsibility..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all" value={vo.newAgent.role} onChange={e => vo.setNewAgent({...vo.newAgent, role: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Skills</label>
                     <div className="flex gap-2 flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[60px]">
                        {vo.skills.map((skill: any) => (
                           <button 
                             key={skill.id} 
                             onClick={() => {
                                const exists = vo.newAgent.assignedSkills.includes(skill.id);
                                const nextSkills = exists ? vo.newAgent.assignedSkills.filter((s: any) => s !== skill.id) : [...vo.newAgent.assignedSkills, skill.id];
                                vo.setNewAgent({...vo.newAgent, assignedSkills: nextSkills});
                             }}
                             className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${vo.newAgent.assignedSkills.includes(skill.id) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}
                           >
                              {skill.name}
                           </button>
                        ))}
                     </div>
                  </div>
                  <button onClick={handleCreateAgent} disabled={vo.isDeploying} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                     {vo.isDeploying ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                     {vo.editingAgentId ? 'Update Identity' : 'Initiate Deployment'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {vo.isSchedulerModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg border border-white/20 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Calendar size={24} /></div>
                    <div><h3 className="text-xl font-black tracking-tight uppercase">Automated Routine</h3></div>
                  </div>
                  <button onClick={() => vo.setIsSchedulerModalOpen(false)} className="p-2"><X size={20} /></button>
                </div>
                <div className="space-y-6">
                   <input placeholder="Task Description" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold" value={vo.newScheduledTask.description} onChange={e => vo.setNewScheduledTask({...vo.newScheduledTask, description: e.target.value})} />
                   <select className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold" value={vo.newScheduledTask.agentId} onChange={e => vo.setNewScheduledTask({...vo.newScheduledTask, agentId: Number(e.target.value)})}>
                      {vo.agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                   </select>
                   <input placeholder="Command (e.g. check logs)" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold font-mono" value={vo.newScheduledTask.command} onChange={e => vo.setNewScheduledTask({...vo.newScheduledTask, command: e.target.value})} />
                   <input placeholder="Cron (e.g. 0 0/1 * * * ?)" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold font-mono" value={vo.newScheduledTask.cronExpression} onChange={e => vo.setNewScheduledTask({...vo.setNewScheduledTask, cronExpression: e.target.value})} />
                   <button onClick={handleCreateScheduledTask} className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl">Activate Schedule</button>
                </div>
              </motion.div>
           </div>
        )}

        {vo.isWhiteboardOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-10">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden transition-all border border-white/20 ${vo.isFullscreenWhiteboard ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'}`}>
               <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg"><Presentation size={24} /></div>
                    <div><h3 className="text-xl font-black tracking-tight uppercase">Agent Collaborative Canvas</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Memory Visualizer</p></div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => vo.setIsFullscreenWhiteboard(!vo.isFullscreenWhiteboard)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500"><Maximize2 size={18} /></button>
                     <button onClick={() => vo.setIsWhiteboardOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-500 transition-colors"><X size={20} /></button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/20">
                  <div className="prose prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:p-8 prose-pre:rounded-[2rem] prose-pre:shadow-2xl prose-h1:text-4xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-p:text-lg prose-p:leading-relaxed">
                     <ReactMarkdown>{vo.whiteboardContent || ""}</ReactMarkdown>
                  </div>
               </div>
            </motion.div>
          </div>
        )}

        {vo.isBrowserOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-white/20">
               <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4 w-full mr-10">
                     <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div></div>
                     <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-500 truncate shadow-inner">{vo.browserUrl}</div>
                  </div>
                  <button onClick={() => vo.setIsBrowserOpen(false)} className="p-2"><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-auto bg-slate-100/30 p-10 flex items-center justify-center">
                  {vo.browserScreenshot ? <img src={`data:image/png;base64,${vo.browserScreenshot}`} className="shadow-2xl rounded-xl border border-slate-200 bg-white" alt="Browser view" /> : <div className="flex flex-col items-center gap-4 text-slate-400"><Loader2 size={40} className="animate-spin" /><p className="text-xs font-black uppercase tracking-widest">Streaming interface...</p></div>}
               </div>
            </motion.div>
          </div>
        )}

        {vo.isShadowPreviewOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-white/20">
               <div className="px-10 py-8 bg-indigo-600 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"><ShieldAlert size={24} /></div>
                    <div><h3 className="text-xl font-black tracking-tight uppercase">Shadow Coding Preview</h3><p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Isolated Sandbox Verification</p></div>
                  </div>
                  <button onClick={() => vo.setIsShadowPreviewOpen(false)} className="p-2 text-white/50"><X size={24} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-900 font-mono text-xs">
                  <pre className={`p-6 rounded-2xl bg-black/50 border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap`}>
                    {vo.shadowDiff || "No changes detected in sandbox."}
                  </pre>
               </div>
               <div className="p-10 border-t border-slate-100 bg-white flex justify-end gap-4 shadow-inner">
                  <button onClick={handleDiscardShadow} className="px-8 py-3 bg-slate-100 hover:bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Discard Sandbox</button>
                  <button onClick={handleCommitShadow} className="px-10 py-3 bg-indigo-600 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100">Commit Changes to Main</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
