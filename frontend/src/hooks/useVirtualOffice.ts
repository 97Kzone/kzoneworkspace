import { useState, useEffect, useCallback } from "react";
import { 
  Agent, Task, ChatMessage, Skill, ActivityLog, ScheduledTask, Memory, 
  CodeReviewResult, OfficeItem, CodebaseChunk, TechPulse, ProjectHealth, 
  ActionableStrategy, TeamPerformance, AgentLesson, CognitiveTrace, 
  MaintenanceIssue, MissionContext, BrainstormingSession, agentService, taskService, chatService, 
  skillService, activityService, schedulingService, codeReviewService, 
  memoryService, officeService, codebaseService, briefingService, 
  techPulseService, projectHealthService, lessonService, shadowService, 
  cognitiveService, janitorService, missionIntelligenceService, brainstormingService 
} from "../app/apiService";

/**
 * 프로젝트 전역 상태 및 데이터 fetching 로직을 관리하는 커스텀 훅
 */
export const useVirtualOffice = () => {
  // 채팅 관련 상태
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

  // 에이전트 및 태스크 관련 상태
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [isSkillInventoryOpen, setIsSkillInventoryOpen] = useState(false);

  // 에이전트 배포 및 수정 관련 상태
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "", assignedSkills: [] as string[] });
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // 대시보드 레이아웃 및 내비게이션 상태
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const [activityPanelSize, setActivityPanelSize] = useState({ width: 680, height: 240 });
  const [activeConnections, setActiveConnections] = useState<{ from: string, to: string, timestamp: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'REASONING' | 'STATS' | 'SCHEDULER' | 'KANBAN' | 'TECH_PULSE' | 'ANALYTICS' | 'MISSION' | 'CODE_REVIEW' | 'JANITOR' | 'MISSION_CONTROL'>('LOGS');
  const [activeCategory, setActiveCategory] = useState<'PROCESS' | 'INTELLIGENCE' | 'METRICS'>('PROCESS');
  const [openNavMenu, setOpenNavMenu] = useState<'INSIGHT' | 'ANALYSIS' | 'TOOLS' | null>(null);

  // 인텔리전스 관련 상태 (자니터, 코드 리뷰 등)
  const [janitorIssues, setJanitorIssues] = useState<MaintenanceIssue[]>([]);
  const [isJanitorScanning, setIsJanitorScanning] = useState(false);
  const [isJanitorLoading, setIsJanitorLoading] = useState(false);
  const [codeReviews, setCodeReviews] = useState<CodeReviewResult[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showHealingToast, setShowHealingToast] = useState<string | null>(null);

  // 성과 및 메트릭 관련 상태
  const [performanceData, setPerformanceData] = useState<TeamPerformance | null>(null);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // 스케줄러 관련 상태
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [newScheduledTask, setNewScheduledTask] = useState({ description: "", agentId: 0, command: "", cronExpression: "0 0/1 * * * ?" });

  // 협업 및 실시간 상호작용 관련 상태
  const [activeCollaborations, setActiveCollaborations] = useState<Record<string, string | null>>({});
  const [activePreviews, setActivePreviews] = useState<Record<string, { toolName: string, target: string, agentName: string } | null>>({});

  // 화이트보드 및 리서치 관련 상태
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardContent, setWhiteboardContent] = useState<string | null>(null);
  const [isFullscreenWhiteboard, setIsFullscreenWhiteboard] = useState(false);

  // 브라우저 및 검색 관련 상태
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string>("");
  const [browserScreenshot, setBrowserScreenshot] = useState<string | null>(null);

  // 지식 및 코드베이스 관련 상태
  const [isKnowledgeExplorerOpen, setIsKnowledgeExplorerOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);
  const [isCodebaseExplorerOpen, setIsCodebaseExplorerOpen] = useState(false);
  const [codebaseResults, setCodebaseResults] = useState<CodebaseChunk[]>([]);
  const [isCodebaseLoading, setIsCodebaseLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  // 브리핑 및 프로젝트 진단 관련 상태
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingContent, setBriefingContent] = useState("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isIntelligenceBoosted, setIsIntelligenceBoosted] = useState<Record<string, boolean>>({});
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [healthReport, setHealthReport] = useState<ProjectHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  // 테크 펄스 및 인지 추적 관련 상태
  const [techPulses, setTechPulses] = useState<TechPulse[]>([]);
  const [isTechPulseLoading, setIsTechPulseLoading] = useState(false);
  const [cognitiveTraces, setCognitiveTraces] = useState<CognitiveTrace[]>([]);
  const [isCognitiveLoading, setIsCognitiveLoading] = useState(false);

  // 섀도우 코딩 및 교훈(Lessons) 관련 상태
  const [isShadowModeActive, setIsShadowModeActive] = useState(false);
  const [isShadowPreviewOpen, setIsShadowPreviewOpen] = useState(false);
  const [shadowDiff, setShadowDiff] = useState("");
  const [lessons, setLessons] = useState<AgentLesson[]>([]);
  const [isWisdomVaultOpen, setIsWisdomVaultOpen] = useState(false);
  const [isShadowLoading, setIsShadowLoading] = useState(false);

  // 미션 인텔리전스 관련 상태
  const [missionIntelligence, setMissionIntelligence] = useState<MissionContext[]>([]);
  const [isMissionIntelligenceLoading, setIsMissionIntelligenceLoading] = useState(false);

  // 커맨드 팔레트 관련 상태
  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const [commanderQuery, setCommanderQuery] = useState("");

  // 브레인스토밍 관련 상태
  const [brainstormingSessions, setBrainstormingSessions] = useState<BrainstormingSession[]>([]);
  const [isBrainstormingLoading, setIsBrainstormingLoading] = useState(false);

  // 오피스 아이템 관련 상태
  const [officeItems, setOfficeItems] = useState<OfficeItem[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);

  /**
   * 초기 데이터를 백엔드에서 가져오는 함수
   */
  const fetchInitialData = useCallback(async () => {
    try {
      const [agentRes, taskRes, historyRes, skillRes, activityRes, scheduledRes, pulseRes, brainRes] = await Promise.all([
        agentService.getAll(),
        taskService.getByRoom("default"),
        chatService.getHistory("default"),
        skillService.getAll(),
        activityService.getAll(),
        schedulingService.getAll(),
        techPulseService.getAll(),
        brainstormingService.getAll("default")
      ]);
      setAgents(agentRes.data);
      setTasks(taskRes.data);
      setMessages(historyRes.data);
      setSkills(skillRes.data);
      setActivities(activityRes.data);
      setScheduledTasks(scheduledRes.data);
      setTechPulses(pulseRes.data);
      setBrainstormingSessions(brainRes.data);
      
      try {
        const perfRes = await agentService.getPerformance();
        setPerformanceData(perfRes.data);
      } catch (e) {
        console.error("성과 데이터 로드 실패:", e);
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
      console.error("초기 데이터 로드 실패:", err);
    }
  }, []);

  /**
   * 미션 인텔리전스 데이터를 새로고침하는 함수
   */
  const fetchMissionIntelligence = useCallback(async () => {
    try {
      const res = await missionIntelligenceService.get("default");
      setMissionIntelligence(res.data);
    } catch (err) {
      console.error("미션 인텔리전스 로드 실패:", err);
    }
  }, []);

  const fetchBrainstormingSessions = useCallback(async () => {
    try {
      const res = await brainstormingService.getAll("default");
      setBrainstormingSessions(res.data);
    } catch (err) {
      console.error("브레인스토밍 세션 로드 실패:", err);
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
    brainstormingSessions, setBrainstormingSessions,
    isBrainstormingLoading, setIsBrainstormingLoading,
    fetchBrainstormingSessions,
    activeChat, setActiveChat
  };
};
