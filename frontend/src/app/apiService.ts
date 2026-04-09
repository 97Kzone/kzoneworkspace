import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = 'http://localhost:9000/api';
const WS_URL = 'http://localhost:9000/ws';

export const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface Agent {
    id: number;
    name: string;
    role: string;
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    provider: string;
    model: string;
    assignedSkills: string[];
    points: number;
    lastEmotion: string | null;
}

export interface TeamPerformance {
    dailyStats: DailyStat[];
    agentPerformance: AgentPerformanceStat[];
    totalTasksCompleted: number;
    averageSuccessRate: number;
}

export interface DailyStat {
    date: string;
    taskCount: number;
    activityCount: number;
}

export interface AgentPerformanceStat {
    agentName: string;
    completedTasks: number;
    efficiency: number;
}

export interface OfficeItem {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    agentId: number | null;
    createdAt: string;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    path: string;
}

export interface Task {
    id: number;
    roomId: string;
    command: string;
    result: string | null;
    status: 'PENDING' | 'RUNNING' | 'HEALING' | 'COMPLETED' | 'FAILED';
    agent: Agent | null;
    parentId: number | null;
    dependsOnIds: string | null;
}

export interface ChatMessage {
    id?: number;
    roomId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: 'CHAT' | 'SYSTEM' | 'AGENT' | 'COMMAND' | 'TOOL' | 'THINKING' | 'WHITEBOARD_UPDATE' | 'BROWSER_UPDATE' | 'COLLABORATION' | 'LIVE_WORKING';
    timestamp?: string;
}

export interface AgentLesson {
    id: number;
    agentName: string;
    taskId: number;
    category: string;
    failPattern: string | null;
    wisdom: string;
    relatedFiles: string | null;
    importance: number;
    createdAt: string;
}

export interface ActivityLog {
    id: number;
    agentId: number;
    roomId: string;
    activityType: string;
    toolName: string | null;
    details: string | null;
    timestamp: string;
}

export interface ScheduledTask {
    id: number;
    description: string;
    agentId: number;
    roomId: string;
    command: string;
    cronExpression: string;
    lastRun: string | null;
    nextRun: string | null;
    status: 'ACTIVE' | 'PAUSED';
    createdAt: string;
}

export interface Memory {
    id: number;
    content: string;
    agentId: number;
    agentName: string;
    roomId: string;
    createdAt: string;
}

export interface CodeReviewResult {
    id: number;
    filePath: string;
    title: string;
    issue: string;
    originalCode: string | null;
    suggestedCode: string | null;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'PENDING' | 'APPLIED' | 'DISCARDED';
    createdAt: string;
}

export interface CodebaseChunk {
    id: number;
    content: string;
    filePath: string;
    startLine: number;
    endLine: number;
    language: string | null;
    createdAt: string;
}

export interface CognitiveTrace {
    id: string;
    agentId: number;
    roomId: string;
    type: 'PLANNING' | 'INFERENCE' | 'VALIDATION' | 'CORRECTION' | 'OBSERVATION';
    content: string;
    confidence: number;
    timestamp: string;
}

export interface MaintenanceIssue {
    id: number;
    filePath: string;
    category: 'UNUSED_CODE' | 'LINT_ERROR' | 'LOGIC_SMELL' | 'SECURITY' | 'PERFORMANCE';
    description: string;
    originalCode: string | null;
    suggestedCode: string | null;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    status: 'PENDING' | 'APPLIED' | 'IGNORED';
    createdAt: string;
}

export const agentService = {
    getAll: () => api.get<Agent[]>('/agents'),
    createAgent: (agentData: any) => api.post<Agent>('/agents', agentData),
    updateAgent: (id: number, agentData: any) => api.put<Agent>(`/agents/${id}`, agentData),
    getPerformance: () => api.get<TeamPerformance>('/agents/performance'),
};

export const taskService = {
    getByRoom: (roomId: String) => api.get<Task[]>(`/tasks?roomId=${roomId}`),
};

export const chatService = {
    getHistory: (roomId: String) => api.get<ChatMessage[]>(`/chat/history?roomId=${roomId}`),
};

export const skillService = {
    getAll: () => api.get<Skill[]>('/skills'),
};

export const activityService = {
    getAll: () => api.get<ActivityLog[]>('/activities'),
    getByRoom: (roomId: string) => api.get<ActivityLog[]>(`/activities/room/${roomId}`),
};

export const schedulingService = {
    getAll: () => api.get<ScheduledTask[]>('/scheduled-tasks'),
    create: (data: any) => api.post<ScheduledTask>('/scheduled-tasks', data),
    toggle: (id: number) => api.post<ScheduledTask>(`/scheduled-tasks/${id}/toggle`),
    runNow: (id: number) => api.post<ScheduledTask>(`/scheduled-tasks/${id}/run-now`),
    delete: (id: number) => api.delete(`/scheduled-tasks/${id}`),
};

export const officeService = {
    getAll: () => api.get<OfficeItem[]>('/office/items'),
    buyItem: (data: { agentId: number, name: string, type: string, x: number, y: number, price: number }) => 
        api.post<OfficeItem>('/office/items/buy', data),
    deleteItem: (id: number) => api.delete(`/office/items/${id}`),
};


export const codeReviewService = {
    getAll: () => api.get<CodeReviewResult[]>('/code-review/results'),
    perform: (filePath: string) =>
        api.post<CodeReviewResult[]>(`/code-review/perform?filePath=${filePath}`),
    applyFix: (id: number) => api.post<{success: boolean, message: string}>(`/code-review/${id}/apply`),
};

export const memoryService = {
    getAll: (limit: number = 50) => api.get<Memory[]>(`/memories?limit=${limit}`),
    search: (query: string, agentId?: number, limit: number = 10) => 
        api.get<Memory[]>(`/memories/search?query=${query}${agentId ? `&agentId=${agentId}` : ''}&limit=${limit}`),
};

export const codebaseService = {
    index: () => api.post<{status: string, message: string}>('/codebase/index'),
    search: (query: string, limit: number = 10) => 
        api.get<CodebaseChunk[]>(`/codebase/search?query=${query}&limit=${limit}`),
};

export interface TechPulse {
    id: number;
    title: string;
    category: string;
    description: string;
    impactScore: number;
    projectImpact: string;
    sourceUrl: string | null;
    createdAt: string;
}

export interface ActionableStrategy {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedEffort: string;
}

export interface ProjectHealth {
    score: number;
    status: string;
    synergyLevel: string;
    risks: string[];
    recommendations: ActionableStrategy[];
    analysisReasoning: string;
    generatedAt: string;
}

export const techPulseService = {
    getAll: () => api.get<TechPulse[]>('/tech-pulses'),
    refresh: () => api.post<TechPulse[]>('/tech-pulses/refresh'),
};

export const briefingService = {
    get: () => api.get<{content: string}>('/briefing'),
};

export const workstreamService = {
    start: (data: { roomId: string, goal: string }) => api.post<string>('/workstreams/start', data),
};

export interface MissionContext {
    id: number;
    roomId: String;
    intelKey: string;
    intelValue: string;
    importance: number;
    agentName: string;
    createdAt: string;
}

export const missionIntelligenceService = {
    get: (roomId: string) => api.get<MissionContext[]>(`/mission-intelligence/${roomId}`),
};

export const projectHealthService = {
    get: () => api.get<ProjectHealth>('/project-health'),
};

export const lessonService = {
    getAll: () => api.get<AgentLesson[]>('/lessons'),
    getByAgent: (name: string) => api.get<AgentLesson[]>(`/lessons/agent/${name}`),
};

export const shadowService = {
    start: (roomId: string, taskId: number) => 
        api.post(`/shadow/start?roomId=${roomId}&taskId=${taskId}`),
    commit: (roomId: string) => 
        api.post<string>(`/shadow/commit?roomId=${roomId}`),
    discard: (roomId: string) => 
        api.post(`/shadow/discard?roomId=${roomId}`),
    getDiff: (roomId: string) => 
        api.get<string>(`/shadow/diff?roomId=${roomId}`),
};

export const cognitiveService = {
    getTracesByRoom: (roomId: string) => api.get<CognitiveTrace[]>(`/cognitive/room/${roomId}`),
    getTracesByAgent: (agentId: number) => api.get<CognitiveTrace[]>(`/cognitive/agent/${agentId}`),
};


export const janitorService = {
    getIssues: () => api.get<MaintenanceIssue[]>('/janitor/issues'),
    triggerScan: () => api.post<{success: boolean, foundCount: number}>('/janitor/scan'),
    applyFix: (id: number) => api.post<{success: boolean, message: string}>(`/janitor/fix/${id}`),
    ignoreIssue: (id: number) => api.post<{success: boolean}>(`/janitor/ignore/${id}`),
};

export const createWebSocketClient = (onMessageReceived: (msg: ChatMessage) => void) => {
    const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        debug: (str) => {
            console.log('WS Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
        console.log('Connected to WebSocket');
        client.subscribe('/topic/public', (message) => {
            onMessageReceived(JSON.parse(message.body));
        });
    };

    client.onStompError = (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
    };

    return client;
};
