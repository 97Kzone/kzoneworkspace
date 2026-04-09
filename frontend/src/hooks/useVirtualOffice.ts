import { useState, useEffect, useCallback } from "react";
import { 
  Agent, Task, ChatMessage, Skill, ActivityLog, ScheduledTask, Memory, 
  CodeReviewResult, OfficeItem, CodebaseChunk, TechPulse, ProjectHealth, 
  ActionableStrategy, TeamPerformance, AgentLesson, CognitiveTrace, 
  MaintenanceIssue, MissionContext, agentService, taskService, chatService, 
  skillService, activityService, schedulingService, codeReviewService, 
  memoryService, officeService, codebaseService, briefingService, 
  techPulseService, projectHealthService, lessonService, shadowService, 
  cognitiveService, janitorService, missionIntelligenceService 
} from "../app/apiService";

export const useVirtualOffice = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSkillInventoryOpen, setIsSkillInventoryOpen] = useState(false);

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "", assignedSkills: [] as string[] });
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const [activityPanelSize, setActivityPanelSize] = useState({ width: 680, height: 240 });
  const [activeConnections, setActiveConnections] = useState<{ from: string, to: string, timestamp: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'REASONING' | 'STATS' | 'SCHEDULER' | 'KANBAN' | 'TECH_PULSE' | 'ANALYTICS' | 'MISSION' | 'CODE_REVIEW' | 'JANITOR' | 'MISSION_CONTROL'>('LOGS');
  const [janitorIssues, setJanitorIssues] = useState<MaintenanceIssue[]>([]);
  const [isJanitorScanning, setIsJanitorScanning] = useState(false);
  const [isJanitorLoading, setIsJanitorLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'PROCESS' | 'INTELLIGENCE' | 'METRICS'>('PROCESS');
  const [openNavMenu, setOpenNavMenu] = useState<'INSIGHT' | 'ANALYSIS' | 'TOOLS' | null>(null);
  const [codeReviews, setCodeReviews] = useState<CodeReviewResult[]>([]);
  const [showHealingToast, setShowHealingToast] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<TeamPerformance | null>(null);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeCollaborations, setActiveCollaborations] = useState<Record<string, string | null>>({});

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [newScheduledTask, setNewScheduledTask] = useState({ description: "", agentId: 0, command: "", cronExpression: "0 0/1 * * * ?" });

  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardContent, setWhiteboardContent] = useState<string | null>(null);
  const [isFullscreenWhiteboard, setIsFullscreenWhiteboard] = useState(false);

  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string>("");
  const [browserScreenshot, setBrowserScreenshot] = useState<string | null>(null);

  const [isKnowledgeExplorerOpen, setIsKnowledgeExplorerOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);
  const [activePreviews, setActivePreviews] = useState<Record<string, { toolName: string, target: string, agentName: string } | null>>({});
  
  const [officeItems, setOfficeItems] = useState<OfficeItem[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const [isCodebaseExplorerOpen, setIsCodebaseExplorerOpen] = useState(false);
  const [codebaseResults, setCodebaseResults] = useState<CodebaseChunk[]>([]);
  const [isCodebaseLoading, setIsCodebaseLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingContent, setBriefingContent] = useState("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isIntelligenceBoosted, setIsIntelligenceBoosted] = useState<Record<string, boolean>>({});

  const [techPulses, setTechPulses] = useState<TechPulse[]>([]);
  const [isTechPulseLoading, setIsTechPulseLoading] = useState(false);

  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [healthReport, setHealthReport] = useState<ProjectHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [cognitiveTraces, setCognitiveTraces] = useState<CognitiveTrace[]>([]);
  const [isCognitiveLoading, setIsCognitiveLoading] = useState(false);

  const [isShadowModeActive, setIsShadowModeActive] = useState(false);
  const [isShadowPreviewOpen, setIsShadowPreviewOpen] = useState(false);
  const [shadowDiff, setShadowDiff] = useState("");
  const [lessons, setLessons] = useState<AgentLesson[]>([]);
  const [isWisdomVaultOpen, setIsWisdomVaultOpen] = useState(false);
  const [isShadowLoading, setIsShadowLoading] = useState(false);
  const [missionIntelligence, setMissionIntelligence] = useState<MissionContext[]>([]);
  const [isMissionIntelligenceLoading, setIsMissionIntelligenceLoading] = useState(false);

  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const [commanderQuery, setCommanderQuery] = useState("");

  const fetchInitialData = useCallback(async () => {
    try {
      const [agentRes, taskRes, historyRes, skillRes, activityRes, scheduledRes, pulseRes] = await Promise.all([
        agentService.getAll(),
        taskService.getByRoom("default"),
        chatService.getHistory("default"),
        skillService.getAll(),
        activityService.getAll(),
        schedulingService.getAll(),
        techPulseService.getAll()
      ]);
      setAgents(agentRes.data);
      setTasks(taskRes.data);
      setMessages(historyRes.data);
      setSkills(skillRes.data);
      setActivities(activityRes.data);
      setScheduledTasks(scheduledRes.data);
      setTechPulses(pulseRes.data);
      
      try {
        const perfRes = await agentService.getPerformance();
        setPerformanceData(perfRes.data);
      } catch (e) {
        console.error("성능 데이터 로드 실패:", e);
      }
      
      const officeRes = await officeService.getAll();
      setOfficeItems(officeRes.data);
      
      if (agentRes.data.length > 0) {
        setNewScheduledTask(prev => ({ ...prev, agentId: agentRes.data[0].id }));
      }

      const lessonRes = await lessonService.getAll();
      setLessons(lessonRes.data);

      const missionRes = await missionIntelligenceService.get("default");
      setMissionIntelligence(missionRes.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  }, []);

  const fetchMissionIntelligence = useCallback(async () => {
    try {
      const res = await missionIntelligenceService.get("default");
      setMissionIntelligence(res.data);
    } catch (err) {
      console.error("Mission Intelligence fetch failed:", err);
    }
  }, []);

  return {
    agents, setAgents,
    tasks, setTasks,
    messages, setMessages,
    skills, setSkills,
    inputValue, setInputValue,
    isSkillInventoryOpen, setIsSkillInventoryOpen,
    isDeployModalOpen, setIsDeployModalOpen,
    newAgent, setNewAgent,
    editingAgentId, setEditingAgentId,
    isDeploying, setIsDeploying,
    showActivityPanel, setShowActivityPanel,
    activityPanelSize, setActivityPanelSize,
    activeConnections, setActiveConnections,
    activeTab, setActiveTab,
    janitorIssues, setJanitorIssues,
    isJanitorScanning, setIsJanitorScanning,
    isJanitorLoading, setIsJanitorLoading,
    activeCategory, setActiveCategory,
    openNavMenu, setOpenNavMenu,
    codeReviews, setCodeReviews,
    showHealingToast, setShowHealingToast,
    performanceData, setPerformanceData,
    isPerformanceLoading, setIsPerformanceLoading,
    isReviewing, setIsReviewing,
    activeCollaborations, setActiveCollaborations,
    activities, setActivities,
    scheduledTasks, setScheduledTasks,
    isSchedulerModalOpen, setIsSchedulerModalOpen,
    newScheduledTask, setNewScheduledTask,
    isWhiteboardOpen, setIsWhiteboardOpen,
    whiteboardContent, setWhiteboardContent,
    isFullscreenWhiteboard, setIsFullscreenWhiteboard,
    isBrowserOpen, setIsBrowserOpen,
    browserUrl, setBrowserUrl,
    browserScreenshot, setBrowserScreenshot,
    isKnowledgeExplorerOpen, setIsKnowledgeExplorerOpen,
    memories, setMemories,
    isMemoriesLoading, setIsMemoriesLoading,
    activePreviews, setActivePreviews,
    officeItems, setOfficeItems,
    isShopOpen, setIsShopOpen,
    isCodebaseExplorerOpen, setIsCodebaseExplorerOpen,
    codebaseResults, setCodebaseResults,
    isCodebaseLoading, setIsCodebaseLoading,
    isIndexing, setIsIndexing,
    isBriefingOpen, setIsBriefingOpen,
    briefingContent, setBriefingContent,
    isBriefingLoading, setIsBriefingLoading,
    isIntelligenceBoosted, setIsIntelligenceBoosted,
    techPulses, setTechPulses,
    isTechPulseLoading, setIsTechPulseLoading,
    isHealthModalOpen, setIsHealthModalOpen,
    healthReport, setHealthReport,
    isHealthLoading, setIsHealthLoading,
    cognitiveTraces, setCognitiveTraces,
    isCognitiveLoading, setIsCognitiveLoading,
    isShadowModeActive, setIsShadowModeActive,
    isShadowPreviewOpen, setIsShadowPreviewOpen,
    shadowDiff, setShadowDiff,
    lessons, setLessons,
    isWisdomVaultOpen, setIsWisdomVaultOpen,
    isShadowLoading, setIsShadowLoading,
    missionIntelligence, setMissionIntelligence,
    isMissionIntelligenceLoading, setIsMissionIntelligenceLoading,
    isCommanderOpen, setIsCommanderOpen,
    commanderQuery, setCommanderQuery,
    fetchInitialData,
    fetchMissionIntelligence,
    activeChat, setActiveChat
  };
};
