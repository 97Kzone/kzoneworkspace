"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, MessageSquare, Plus, X, Users, Terminal, Code2, Layout, Database, Send, Command, Loader2, Sparkles, Coffee, GripVertical, Presentation, Maximize2, BarChart3, Calendar, Activity, ChevronRight, Pause, Play, Trash2, Search, Leaf, ShoppingBag } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, AreaChart, Area } from 'recharts';
import { Agent, Task, ChatMessage, Skill, ActivityLog, ScheduledTask, Memory, OfficeItem, CodebaseChunk, agentService, taskService, chatService, skillService, activityService, schedulingService, createWebSocketClient, codeReviewService, memoryService, officeService, codebaseService } from "./apiService";

const EmotionBubble = ({ 
  emotion, 
  agentName,
  getAgentColor 
}: { 
  emotion: string, 
  agentName: string,
  getAgentColor: (name: string) => any 
}) => {
  const emojis: Record<string, string> = {
    "HAPPY": "🎉",
    "SAD": "😫",
    "THINKING": "🤔",
    "ANGRY": "💢",
    "SUCCESS": "✅",
    "ERROR": "❌"
  };

  return (
    <motion.div
      initial={{ scale: 0, y: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 1], y: -50, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute left-1/2 -translate-x-1/2 z-[100] text-3xl filter drop-shadow-lg"
    >
      {emojis[emotion] || emotion}
    </motion.div>
  );
};

const KnowledgeExplorer = ({ 
  isOpen, 
  onClose, 
  memories, 
  onSearch, 
  isLoading,
  getAgentColor
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  memories: Memory[]; 
  onSearch: (query: string) => void;
  isLoading: boolean;
  getAgentColor: (name: string) => any;
}) => {
  const [query, setQuery] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 w-[450px] h-full bg-white/80 backdrop-blur-2xl border-l border-indigo-100/50 z-[150] shadow-[-20px_0_60px_rgba(0,0,0,0.05)] flex flex-col"
        >
          <div className="h-20 border-b border-slate-100/50 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">지식 탐색기</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">에이전트 메모리 탐색</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 border-b border-slate-100/50 bg-white/50">
            <div className="relative">
              <input
                type="text"
                placeholder="어떤 지식을 찾으시나요? (예: 코드 리뷰 결과)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
              />
              <button 
                onClick={() => onSearch(query)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
            {memories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-60">
                <Database size={40} className="mb-2" />
                <p className="text-sm font-bold text-center">검색 결과가 없거나<br/>아직 지식이 축적되지 않았습니다.</p>
              </div>
            ) : (
              memories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${getAgentColor(memory.agentName).light} flex items-center justify-center border border-indigo-50`}>
                        <Bot size={14} className={getAgentColor(memory.agentName).text} />
                      </div>
                      <span className={`text-[11px] font-black ${getAgentColor(memory.agentName).soft}`}>{memory.agentName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-3">
                    <ReactMarkdown>{memory.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CodebaseExplorer = ({ 
  isOpen, 
  onClose, 
  results, 
  onSearch, 
  onIndex,
  isLoading,
  isIndexing
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  results: CodebaseChunk[]; 
  onSearch: (query: string) => void;
  onIndex: () => void;
  isLoading: boolean;
  isIndexing: boolean;
}) => {
  const [query, setQuery] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed top-0 right-0 w-[550px] h-full bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700 z-[150] shadow-[-20px_0_60px_rgba(0,0,0,0.2)] flex flex-col text-slate-200"
        >
          <div className="h-20 border-b border-slate-700/50 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Search size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">시맨틱 코드 탐색</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">코드베이스 지능형 검색</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onIndex}
                disabled={isIndexing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${isIndexing ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
              >
                {isIndexing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                {isIndexing ? "인덱싱 중..." : "인덱싱 갱신"}
              </button>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-slate-700/50 bg-slate-800/20">
            <div className="relative">
              <input
                type="text"
                placeholder="어떤 코드를 찾으시나요? (예: '로그인 검증 로직')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all shadow-inner"
              />
              <button 
                onClick={() => onSearch(query)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-60">
                <Code2 size={40} className="mb-2" />
                <p className="text-sm font-bold text-center">의미 기반 검색을 지원합니다.<br/>궁금한 코드 로직을 물어보세요.</p>
              </div>
            ) : (
              results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all group"
                >
                  <div className="bg-slate-800/60 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Code2 size={14} className="text-emerald-400" />
                       <span className="text-xs font-mono text-slate-300 truncate max-w-[300px]">{result.filePath}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      L{result.startLine} - L{result.endLine}
                    </span>
                  </div>
                  <div className="p-4 overflow-x-auto custom-scrollbar">
                    <pre className="text-[11px] font-mono text-emerald-50/80 leading-relaxed">
                      <code>{result.content}</code>
                    </pre>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MermaidRenderer = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      }).catch(err => {
        console.error("Mermaid Render Error:", err);
      });
    }
  }, [chart]);

  return <div ref={containerRef} className="flex justify-center w-full my-6 p-4 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]" />;
};

const LivePreviewBubble = ({ 
  preview, 
  getAgentColor 
}: { 
  preview: { toolName: string, target: string, agentName: string },
  getAgentColor: (name: string) => any 
}) => {
  const Icon = preview.toolName.includes('write') ? Code2 : 
               preview.toolName.includes('command') ? Terminal : 
               preview.toolName.includes('search') ? Search : 
               preview.toolName.includes('browse') ? Layout : Bot;
  
  const color = getAgentColor(preview.agentName);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 15 }}
      className={`absolute -top-32 left-1/2 -translate-x-1/2 w-52 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-3 shadow-[0_15px_45px_rgba(0,0,0,0.08)] z-[60] overflow-hidden group`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color.light} opacity-30 -z-10`} />
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color.bg} text-white shadow-md`}>
          <Icon size={12} className={preview.toolName.includes('thinking') ? "animate-spin" : "animate-pulse"} />
        </div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${color.soft}`}>
            {preview.toolName.replace('_', ' ')}
          </span>
          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">실시간 업무 중</span>
        </div>
      </div>
      <div className="text-[9px] font-mono text-slate-600 bg-white/60 rounded-xl p-2.5 border border-white/90 break-all line-clamp-2 shadow-inner">
        {preview.target}
      </div>
      
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 0.1, 0.2].map((delay, i) => (
            <motion.div 
              key={i}
              animate={{ 
                height: [4, 12, 4],
                opacity: [0.3, 1, 0.3]
              }} 
              transition={{ repeat: Infinity, duration: 0.8, delay }}
              className={`w-0.5 ${color.bg} rounded-full`} 
            />
          ))}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${color.bg} animate-ping opacity-60`} />
      </div>
    </motion.div>
  );
};

export default function VirtualOfficeBright() {
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
  const [activeTab, setActiveTab] = useState<'LOGS' | 'REASONING' | 'STATS' | 'SCHEDULER'>('LOGS');
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeCollaborations, setActiveCollaborations] = useState<Record<string, string | null>>({});

  // Stats & Scheduler State
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [newScheduledTask, setNewScheduledTask] = useState({ description: "", agentId: 0, command: "", cronExpression: "0 0/1 * * * ?" });


  // Whiteboard State
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardContent, setWhiteboardContent] = useState<string | null>(null);
  const [isFullscreenWhiteboard, setIsFullscreenWhiteboard] = useState(false);

  // Browser Preview State
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string>("");
  const [browserScreenshot, setBrowserScreenshot] = useState<string | null>(null);

  // Knowledge Explorer State
  const [isKnowledgeExplorerOpen, setIsKnowledgeExplorerOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);
  const [activePreviews, setActivePreviews] = useState<Record<string, { toolName: string, target: string, agentName: string } | null>>({});
  
  // Office Decorator State
  const [officeItems, setOfficeItems] = useState<OfficeItem[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Codebase Explorer State
  const [isCodebaseExplorerOpen, setIsCodebaseExplorerOpen] = useState(false);
  const [codebaseResults, setCodebaseResults] = useState<CodebaseChunk[]>([]);
  const [isCodebaseLoading, setIsCodebaseLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  const stompClient = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = async () => {
    try {
      const [agentRes, taskRes, historyRes, skillRes, activityRes, scheduledRes] = await Promise.all([
        agentService.getAll(),
        taskService.getByRoom("default"),
        chatService.getHistory("default"),
        skillService.getAll(),
        activityService.getAll(),
        schedulingService.getAll()
      ]);
      setAgents(agentRes.data);
      setTasks(taskRes.data);
      setMessages(historyRes.data);
      setSkills(skillRes.data);
      setActivities(activityRes.data);
      setScheduledTasks(scheduledRes.data);
      
      // 오피스 아이템 로드
      const officeRes = await officeService.getAll();
      setOfficeItems(officeRes.data);
      
      if (agentRes.data.length > 0) {
        setNewScheduledTask(prev => ({ ...prev, agentId: agentRes.data[0].id }));
      }

      // 지식 이력 초기 로드
      const memoryRes = await memoryService.getAll(20);
      setMemories(memoryRes.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  };

  const handleSearchMemories = async (query: string) => {
    if (!query.trim()) {
      const res = await memoryService.getAll(20);
      setMemories(res.data);
      return;
    }
    setIsMemoriesLoading(true);
    try {
      const res = await memoryService.search(query);
      setMemories(res.data);
    } catch (err) {
      console.error("지식 검색 실패:", err);
    } finally {
      setIsMemoriesLoading(false);
    }
  };

  const handleSearchCodebase = async (query: string) => {
    if (!query.trim()) return;
    setIsCodebaseLoading(true);
    try {
      const res = await codebaseService.search(query);
      setCodebaseResults(res.data);
    } catch (err) {
      console.error("코드 탐색 실패:", err);
    } finally {
      setIsCodebaseLoading(false);
    }
  };

  const handleIndexCodebase = async () => {
    setIsIndexing(true);
    try {
      await codebaseService.index();
      alert("코드베이스 인덱싱이 시작되었습니다. (백엔드 로그에서 진행 상황을 확인하세요)");
    } catch (err) {
      console.error("인덱싱 요청 실패:", err);
      alert("인덱싱 요청에 실패했습니다.");
    } finally {
      setIsIndexing(false);
    }
  };

  const handleBuyItem = async (itemType: string, price: number) => {
    if (agents.length === 0) return;
    
    // 가장 포인트가 많은 에이전트로 구매 시도 (또는 선택 로직 추가 가능)
    const buyer = [...agents].sort((a,b) => b.points - a.points)[0];
    
    if (buyer.points < price) {
      alert(`${buyer.name} 요원의 포인트가 부족합니다! (필요: ${price}, 보유: ${buyer.points})`);
      return;
    }

    try {
      const res = await officeService.buyItem({
        agentId: buyer.id,
        name: itemType.replace('_', ' '),
        type: itemType,
        x: Math.floor(Math.random() * 600) + 100, // 랜덤 위치
        y: Math.floor(Math.random() * 400) + 100,
        price: price
      });
      setOfficeItems(prev => [...prev, res.data]);
      setAgents(prev => prev.map(a => a.id === buyer.id ? { ...a, points: a.points - price } : a));
      setIsShopOpen(false);
    } catch (e) {
      console.error("Failed to buy item", e);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const client = createWebSocketClient((msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some(m => m.timestamp === msg.timestamp && m.content === msg.content)) return prev;
        return [...prev, msg];
      });

      if (msg.type === 'AGENT') {
        taskService.getByRoom("default").then(res => setTasks(res.data));
        // 활동 로그도 갱신
        activityService.getAll().then(res => setActivities(res.data));
      }
      
      // ... (기존 로직)

      // Connection Line Logic
      if (msg.type === 'AGENT' || msg.type === 'CHAT') {
        const mentionMatch = msg.content.match(/@([\w가-힣]+)/);
        if (mentionMatch) {
          const targetName = mentionMatch[1];
          setActiveConnections(prev => [...prev, { from: msg.senderName, to: targetName, timestamp: Date.now() }]);
          setTimeout(() => {
            setActiveConnections(prev => prev.filter(conn => conn.timestamp > Date.now() - 3000));
          }, 3000);
        }
      }

      // Whiteboard Logic
      if (msg.type === 'WHITEBOARD_UPDATE') {
        setWhiteboardContent(msg.content);
        if (!isWhiteboardOpen) {
          setIsWhiteboardOpen(true);
        }
      }

      // Browser Update Logic
      if (msg.type === 'BROWSER_UPDATE') {
        try {
          const payload = JSON.parse(msg.content);
          setBrowserUrl(payload.url || "");
          setBrowserScreenshot(payload.screenshot || null);
          if (!isBrowserOpen) {
            setIsBrowserOpen(true);
          }
        } catch (e) {
          console.error("Failed to parse BROWSER_UPDATE payload", e);
        }
      }

      // Collaboration Logic
      if (msg.type === 'COLLABORATION') {
        try {
          const payload = JSON.parse(msg.content);
          const { from, to, status } = payload;
          setActiveCollaborations(prev => ({
            ...prev,
            [from]: status === 'START' ? to : null
          }));
        } catch (e) {
          console.error("Failed to parse COLLABORATION payload", e);
        }
      }

      // Live Working Preview Logic
      if (msg.type === 'LIVE_WORKING') {
        try {
          const payload = JSON.parse(msg.content);
          const { agentName, toolName, target, status } = payload;
          setActivePreviews(prev => ({
            ...prev,
            [agentName]: status === 'START' ? { toolName, target, agentName } : null
          }));
        } catch (e) {
          console.error("Failed to parse LIVE_WORKING payload", e);
        }
      }

      // Agent Status Update Logic (Points/Emotions)
      if (msg.type === 'SYSTEM') {
        try {
          const payload = JSON.parse(msg.content);
          if (payload.agentId && (payload.points !== undefined || payload.lastEmotion !== undefined)) {
            setAgents(prev => prev.map(a => 
              a.id === payload.agentId 
                ? { ...a, points: payload.points ?? a.points, lastEmotion: payload.lastEmotion ?? a.lastEmotion } 
                : a
            ));
            
            // 감정 표현 후 일정 시간 뒤 초기화 (선택 사항)
            if (payload.lastEmotion) {
              setTimeout(() => {
                setAgents(prev => prev.map(a => 
                  a.id === payload.agentId ? { ...a, lastEmotion: null } : a
                ));
              }, 5000);
            }
          }
        } catch (e) {
          // 일반 시스템 메시지는 무시하거나 처리
        }
      }
    });

    stompClient.current = client;
    client.activate();

    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChat]);

  // 채팅방 변경 시 이력 가져오기
  useEffect(() => {
    if (!activeChat) return;
    const currentRoomId = activeChat === '라운지 미팅' ? "default" : `agent-${activeChat}`;

    chatService.getHistory(currentRoomId).then(res => {
      setMessages(prev => {
        const newMessages = res.data;
        // 기존 메시지와 중복 제거 후 합치기
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
        return [...prev, ...uniqueNew].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });
      });
    });
  }, [activeChat]);

  useEffect(() => {
    if (consoleScrollRef.current) consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
  }, [messages, tasks]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !stompClient.current?.connected) return;

    const currentRoomId = activeChat === '라운지 미팅' ? "default" : `agent-${activeChat}`;

    const chatMsg: ChatMessage = {
      roomId: currentRoomId,
      senderId: "user-1",
      senderName: "사용자",
      content: activeChat && activeChat !== '라운지 미팅' && !inputValue.startsWith('@')
        ? `@${activeChat} ${inputValue}`
        : inputValue,
      type: "CHAT"
    };

    stompClient.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(chatMsg)
    });

    setInputValue("");
  };

  const handleStartCodeReview = async () => {
    const reviewer = agents.find(a => a.name === "Reviewer") || agents[0];
    if (!reviewer) return;

    setIsReviewing(true);
    const roomId = activeChat === '라운지 미팅' ? "default" : `agent-${activeChat}`;
    try {
      await codeReviewService.perform(roomId, reviewer.name);
    } catch (err) {
      console.error("리뷰 요청 실패:", err);
      alert("코드 리뷰 요청에 실패했습니다.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDeployAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name || !newAgent.role) return;
    setIsDeploying(true);

    let provider = "ANTHROPIC";
    if (newAgent.model.includes("gemini")) provider = "GOOGLE";
    else if (newAgent.model.includes("gpt")) provider = "OPENAI";

    try {
      if (editingAgentId) {
        await agentService.updateAgent(editingAgentId, { ...newAgent, provider });
      } else {
        await agentService.createAgent({ ...newAgent, provider });
      }
      await fetchInitialData();
      setIsDeployModalOpen(false);
      setNewAgent({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "", assignedSkills: [] });
      setEditingAgentId(null);
    } catch (err) {
      console.error("작업 실패:", err);
      alert("에이전트 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleOpenEditModal = (agent: any) => {
    setNewAgent({
      name: agent.name,
      role: agent.role,
      model: agent.model,
      systemPrompt: agent.systemPrompt || "",
      assignedSkills: agent.assignedSkills || []
    });
    setEditingAgentId(agent.id);
    setIsDeployModalOpen(true);
  };

  const handleCreateScheduledTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newScheduledTask.agentId || !newScheduledTask.command || !newScheduledTask.cronExpression) return;
      await schedulingService.create({ ...newScheduledTask, roomId: "default" });
      const res = await schedulingService.getAll();
      setScheduledTasks(res.data);
      setIsSchedulerModalOpen(false);
      setNewScheduledTask({ description: "", agentId: agents[0]?.id || 0, command: "", cronExpression: "0 0/1 * * * ?" });
    } catch (err) {
      console.error("스케줄 생성 실패:", err);
    }
  };

  const handleToggleScheduledTask = async (id: number) => {
    try {
      await schedulingService.toggle(id);
      const res = await schedulingService.getAll();
      setScheduledTasks(res.data);
    } catch (err) {
      console.error("스케줄 토글 실패:", err);
    }
  };
  
  const handleRunScheduledTask = async (id: number) => {
    try {
      await schedulingService.runNow(id);
      const res = await schedulingService.getAll();
      setScheduledTasks(res.data);
      // 알림 (임시로 콘솔에 기록하거나 시스템 메시지로 추가 가능)
      console.log(`Task ${id} triggered manually.`);
    } catch (err) {
      console.error("스케줄 즉시 실행 실패:", err);
    }
  };

  const handleDeleteScheduledTask = async (id: number) => {
    if (!confirm("이 예약 작업을 삭제하시겠습니까?")) return;
    try {
      await schedulingService.delete(id);
      const res = await schedulingService.getAll();
      setScheduledTasks(res.data);
    } catch (err) {
      console.error("스케줄 삭제 실패:", err);
    }
  };

  const getActivityChartData = () => {
    const now = new Date();
    const last24h = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now);
      d.setHours(d.getHours() - (23 - i));
      d.setMinutes(0, 0, 0);
      return {
        time: `${d.getHours()}시`,
        count: 0
      };
    });

    activities.forEach(log => {
      const logDate = new Date(log.timestamp);
      const hourDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60));
      if (hourDiff < 24) {
        const index = 23 - hourDiff;
        if (index >= 0 && index < 24) {
          last24h[index].count++;
        }
      }
    });
    return last24h;
  };

  const getToolUsageData = () => {
    const usage: Record<string, number> = {};
    activities.filter(a => a.activityType === 'TOOL_CALL' && a.toolName).forEach(log => {
      const name = log.toolName || 'Unknown';
      usage[name] = (usage[name] || 0) + 1;
    });
    return Object.entries(usage).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const getAgentColor = (name: string) => {
    const colors = [
      { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-50", border: "border-indigo-100", soft: "text-indigo-600" },
      { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-50", border: "border-rose-100", soft: "text-rose-600" },
      { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-50", border: "border-emerald-100", soft: "text-emerald-600" },
      { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-50", border: "border-amber-100", soft: "text-amber-600" },
      { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-50", border: "border-violet-100", soft: "text-violet-600" },
      { bg: "bg-sky-500", text: "text-sky-500", light: "bg-sky-50", border: "border-sky-100", soft: "text-sky-600" },
    ];

    if (name === "시스템") return { bg: "bg-slate-500", text: "text-slate-500", light: "bg-slate-50", border: "border-slate-100", soft: "text-slate-600" };

    // Hash based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getAgentPosition = (agent: Agent, index: number): { top: number, left: number } => {
    // 1. 협업 이동: 호출한 에이전트가 대상 에이전트 옆으로 이동
    const collidingWith = activeCollaborations[agent.name];
    if (collidingWith) {
      const targetAgent = agents.find(a => a.name === collidingWith);
      if (targetAgent) {
        const targetIdx = agents.indexOf(targetAgent);
        const targetPos = getBaseAgentPosition(targetAgent, targetIdx);
        return { top: targetPos.top + 20, left: targetPos.left - 70 };
      }
    }
    return getBaseAgentPosition(agent, index);
  };

  const getBaseAgentPosition = (agent: Agent, index: number) => {
    // Default positions (Lounge area)
    const loungeBase = { top: 450, left: 150 };

    // Check if agent is running a task
    const isRunning = tasks.some(t => t.agent?.id === agent.id && t.status === 'RUNNING');
    if (!isRunning) {
      // Idle agents stay in the lounge but spread out
      const cols = 3;
      const row = Math.floor(index / cols);
      const col = index % cols;
      return { top: loungeBase.top + (row * 100), left: loungeBase.left + (col * 120) };
    }

    // Agent is active, determine zone based on last tool message
    const lastToolMsg = [...messages].reverse().find(m => m.senderName === agent.name && m.type === 'TOOL');
    const content = lastToolMsg?.content || "";

    if (content.includes('write_file') || content.includes('read_file') || content.includes('search_files') || content.includes('git_')) {
      // Coding Desk (Top Right Area)
      return { top: 150 + (index * 80), left: 600 + (Math.random() * 50) };
    } else if (content.includes('call_agent') || content.includes('request_code_review')) {
      // Meeting/Brainstorm Zone (Left Middle)
      return { top: 250 + (Math.random() * 60), left: 100 + (Math.random() * 60) };
    } else if (content.includes('run_command')) {
      // Terminal execution zone (Center Right)
      return { top: 300 + (index * 60), left: 500 };
    } else if (content.includes('web_search') || content.includes('browse')) {
      // Research/Idea zone (Top Left)
      return { top: 120 + (Math.random() * 50), left: 60 + (Math.random() * 50) };
    }

    // Default active position (thinking, no tool yet)
    return { top: 350, left: 350 + (index * 80) };
  };

  const getRecentFiles = () => {
    const toolMsgs = messages.filter(m => m.type === 'TOOL' && (m.content.includes('write_file') || m.content.includes('delete_file') || m.content.includes('read_file')));
    const files = new Set<string>();
    toolMsgs.forEach(m => {
      const match = m.content.match(/(?:"path":"([^"]+)"|'([^']+)')/);
      if (match) {
        const path = match[1] || match[2];
        files.add(path);
      }
    });
    return Array.from(files).slice(-5).reverse();
  };

  const getFileName = (content: string) => {
    const match = content.match(/(?:"path":"([^"]+)"|'([^']+)')/);
    if (match) {
      const path = match[1] || match[2];
      return path.split(/[\\/]/).pop();
    }
    return null;
  };

  return (
    <div className="flex bg-[#fcfdfe] text-slate-700 h-screen w-full font-sans overflow-hidden selection:bg-indigo-100">

      {/* 1. Left Panel: Activity Feed (Glassmorphism) */}
      <div className="w-[420px] border-r border-indigo-50/50 bg-white/70 backdrop-blur-2xl flex flex-col shrink-0 relative z-20 shadow-[10px_0_40px_rgba(0,0,0,0.02)] transition-all duration-500">
        <div className="h-16 border-b border-slate-100/50 flex items-center px-6 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center mr-3 shadow-inner">
            <Terminal size={18} className="text-indigo-400" />
          </div>
          <span className="text-[11px] font-black tracking-[0.2em] text-slate-500 uppercase">활동 기록</span>
          <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-pulse"></span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">실시간</span>
          </div>
        </div>

        <div ref={consoleScrollRef} className="flex-1 overflow-y-auto p-6 text-[11px] leading-relaxed space-y-5 custom-scrollbar bg-white/30">
          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-100/30 rounded-2xl p-4 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-indigo-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 mb-1 font-mono">K-Zone 워크스페이스</h4>
              <p className="text-slate-400 font-medium leading-normal">AI 오케스트레이션 준비 완료. 캔버스에서 에이전트와 소통하세요.</p>
            </div>
          </div>

          {messages.slice(-50).map((msg, i) => (
            <div key={i} className={`flex gap-2.5 items-start ${msg.type === 'SYSTEM' ? 'text-slate-400' : msg.type === 'THINKING' ? 'text-indigo-400/80' : ''}`}>
              <span className="text-slate-400 shrink-0 font-mono text-[10px] mt-0.5">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : '방금'}
              </span>
              <div>
                <span className={`font-semibold mr-1.5 ${msg.senderId === 'user-1' ? 'text-blue-500' : msg.type === 'AGENT' ? 'text-indigo-500' : msg.type === 'THINKING' ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {msg.senderId === 'user-1' ? '나' : msg.senderName}
                  {msg.type === 'THINKING' && <span className="ml-1 text-[8px] font-black uppercase tracking-tighter opacity-50">[Thinking]</span>}
                </span>
                <div className={`prose prose-sm max-w-none ${msg.type === 'THINKING' ? 'text-indigo-400/70 italic bg-indigo-50/30 px-2 py-0.5 rounded-lg border border-indigo-100/20' : 'text-slate-600 italic'}`}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span className="inline">{children}</span>,
                      code: ({ node, ...props }) => (
                        <code className="bg-slate-200 text-pink-500 px-1 rounded font-mono text-[10px]" {...props} />
                      ),
                    }}
                  >
                    {msg.type === 'AGENT' && msg.content.length > 50
                      ? `${msg.senderName}님이 답변을 완료했습니다. (우측 채팅창에서 확인 가능)`
                      : msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {tasks.filter(t => t.status === 'RUNNING').map(task => (
            <motion.div
              key={`task-${task.id}`}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2 text-indigo-700 shadow-sm"
            >
              <Loader2 size={14} className="animate-spin mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px] mb-0.5">{task.agent?.name} 업무 중</span>
                <span className="text-xs text-indigo-600/80 line-clamp-2">"{task.command}"</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. Center: Virtual Office Canvas */}
      <div className="flex-1 bg-[#f8fafc] relative overflow-hidden flex flex-col">
        {/* Office Top Bar */}
        <div className="absolute top-0 left-0 w-full h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/50 z-10 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-200">
              <Command size={18} className="text-white" />
            </div>
            가상 오피스
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBrowserOpen(!isBrowserOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-xs ${isBrowserOpen ? 'bg-sky-500 text-white border-sky-600 shadow-md' : 'bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-100'}`}
            >
              <Layout size={16} /> 브라우저 뷰어
              {browserScreenshot && !isBrowserOpen && <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
            </button>
            <button
              onClick={() => setIsWhiteboardOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-100 transition-all font-bold text-xs"
            >
              <Presentation size={16} /> 화이트보드
              {whiteboardContent && !isWhiteboardOpen && <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
            </button>
            <button
              onClick={() => setIsSkillInventoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 transition-all font-bold text-xs"
            >
              <Database size={16} /> 기술 인벤토리
            </button>
            <button
              onClick={() => setIsKnowledgeExplorerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl border border-purple-100 transition-all font-bold text-xs"
            >
              <Sparkles size={16} /> 지식 탐색기
            </button>
            <button
              onClick={() => setIsShopOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl border border-amber-100 transition-all font-bold text-xs"
            >
              <ShoppingBag size={16} /> 오피스 상점
            </button>
            <button
              onClick={() => setIsCodebaseExplorerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 transition-all font-bold text-xs"
            >
              <Search size={16} /> 코드 익스플로러
            </button>
            <button
              onClick={handleStartCodeReview}
              disabled={isReviewing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 transition-all font-bold text-xs disabled:opacity-50"
            >
              <Code2 size={16} className={isReviewing ? "animate-pulse" : ""} />
              {isReviewing ? "리뷰 분석 중..." : "코드 리뷰 시작"}
            </button>
          </div>
        </div>

        {/* The 2D Map Floor (Very subtle cute grid) */}
        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.08) 1.5px, transparent 1.5px)`,
            backgroundSize: '48px 48px',
            backgroundPosition: '0 0'
          }}
        >
          {/* Subtle Glow Orbs for depth */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-200/20 blur-[100px] rounded-full -z-10"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 blur-[100px] rounded-full -z-10"></div>

          {/* Environment Props - Work Zones (Glassmorphism) */}
          {/* 1. Idea/Research Zone (Top Left) */}
          <div className="absolute top-[80px] left-[40px] w-48 h-56 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl flex flex-col items-center p-4 justify-center gap-4 shadow-[0_8px_32px_rgba(31,38,135,0.05)] rotate-[-2deg] hover:rotate-0 transition-transform duration-500 group">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform shadow-inner">
              <Sparkles size={24} />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold tracking-[0.2em] uppercase">리서치 센터</span>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-200 to-transparent rounded-full opacity-50"></div>
            <div className="text-[9px] text-slate-400 text-center font-medium mt-2">인터넷 검색 및 분석</div>
          </div>

          {/* 2. Coding Desk Zone (Top Right) */}
          <div className="absolute top-[100px] right-[400px] w-64 h-72 bg-slate-800/5 backdrop-blur-md border border-slate-800/10 rounded-3xl flex flex-col items-center p-6 justify-center gap-4 shadow-[0_8px_32px_rgba(31,38,135,0.05)] rotate-[1deg] hover:rotate-0 transition-transform duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-lg">
              <Code2 size={28} />
            </div>
            <span className="text-[11px] text-slate-600 font-extrabold tracking-[0.2em] uppercase">개발 스튜디오</span>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent rounded-full opacity-50"></div>
            <div className="text-[9px] text-slate-500 text-center font-medium mt-2">파일 편집 및 깃허브 리뷰</div>
          </div>

          <div className="absolute bottom-[100px] left-[100px] w-72 h-44 bg-indigo-50/40 backdrop-blur-lg border border-indigo-100/60 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/60 transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.03)] group"
            onClick={() => setActiveChat('라운지 미팅')}>
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-400/10 rounded-full blur-xl group-hover:bg-indigo-400/20 transition-colors"></div>
              <Coffee size={40} className="text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-xs text-indigo-500 mt-5 font-black uppercase tracking-widest">미팅 라운지</span>
            <div className="text-[9px] text-indigo-300 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Plus size={10} /> 클릭하여 브레인스토밍
            </div>
          </div>

          {/* Connection Lines (Pulse Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
                <stop offset="50%" stopColor="rgba(99, 102, 241, 0.5)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
              </linearGradient>
              <linearGradient id="collabGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.4)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
              </linearGradient>
            </defs>
            <AnimatePresence>
              {/* 1. 일시적 채팅 연결선 (Mentions) */}
              {activeConnections.map((conn, i) => {
                const fromAgent = agents.find(a => a.name === conn.from);
                const toAgent = agents.find(a => a.name === conn.to);

                // If 'from' is user/lounge, use fixed position
                const fromPos = fromAgent ? getAgentPosition(fromAgent, agents.indexOf(fromAgent)) : { top: 480, left: 240 }; 
                const toPos = toAgent ? getAgentPosition(toAgent, agents.indexOf(toAgent)) : null;

                if (!toPos) return null;

                const x1 = fromPos.left + 32;
                const y1 = fromPos.top + 32;
                const x2 = toPos.left + 32;
                const y2 = toPos.top + 32;

                return (
                  <motion.path
                    key={`conn-${i}-${conn.timestamp}`}
                    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 50} ${x2} ${y2}`}
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                );
              })}

              {/* 2. 지속적 협업 연결선 (Collaboration) */}
              {Object.entries(activeCollaborations).map(([from, to]) => {
                if (!to) return null;
                const fromAgent = agents.find(a => a.name === from);
                const toAgent = agents.find(a => a.name === to);
                if (!fromAgent || !toAgent) return null;

                const fromPos = getAgentPosition(fromAgent, agents.indexOf(fromAgent));
                const toPos = getAgentPosition(toAgent, agents.indexOf(toAgent));

                const x1 = fromPos.left + 32;
                const y1 = fromPos.top + 32;
                const x2 = toPos.left + 32;
                const y2 = toPos.top + 32;

                return (
                  <motion.path
                    key={`collab-${from}-${to}`}
                    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 50} ${x2} ${y2}`}
                    stroke="url(#collabGradient)"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1, 
                      opacity: 1,
                      strokeDashoffset: [-20, 0] 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      pathLength: { duration: 0.8 },
                      strokeDashoffset: { repeat: Infinity, duration: 2, ease: "linear" }
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Office Decorations */}
          {officeItems.map((item) => {
            const Icon = item.type === "COFFEE_MACHINE" ? Coffee : 
                        item.type === "PLANT" ? Leaf : 
                        item.type === "SERVER_RACK" ? Database : 
                        item.type === "GAMING_CHAIR" ? User : Layout;
            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute z-0 pointer-events-none opacity-40 hover:opacity-80 transition-opacity"
                style={{ top: item.y, left: item.x }}
              >
                <div className="bg-white/20 backdrop-blur-sm border border-white/40 p-3 rounded-2xl shadow-sm">
                  <Icon size={32} className="text-slate-400" />
                </div>
              </motion.div>
            );
          })}

          {/* Agents */}
          {agents.map((agent, i) => {
            const pos = getAgentPosition(agent, i);
            const isRunning = tasks.some(t => t.agent?.id === agent.id && t.status === 'RUNNING');

            return (
              <motion.div
                key={agent.id}
                className="absolute flex flex-col items-center cursor-pointer group"
                initial={{ top: pos.top, left: pos.left }}
                animate={{ top: pos.top, left: pos.left }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                onClick={() => setActiveChat(agent.name)}
                 whileHover={{ scale: 1.05, zIndex: 40 }}
                style={{ zIndex: isRunning ? 30 : 20 }}
              >
                {/* Live Working Preview Bubble */}
                <AnimatePresence>
                  {activePreviews[agent.name] && (
                    <LivePreviewBubble 
                      preview={activePreviews[agent.name]!} 
                      getAgentColor={getAgentColor} 
                    />
                  )}
                  {agent.lastEmotion && (
                    <EmotionBubble 
                      emotion={agent.lastEmotion} 
                      agentName={agent.name} 
                      getAgentColor={getAgentColor} 
                    />
                  )}
                </AnimatePresence>

                {/* Status bubble */}
                <div className="absolute -top-7 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg shadow-slate-200/50 transform -translate-y-2 group-hover:translate-y-0">
                  {agent.role} (⭐ {agent.points || 0})
                </div>

                {/* Activity indicator / Status Bubble */}
                <AnimatePresence>
                  {isRunning && (() => {
                    const lastToolMsg = [...messages].reverse().find(m => m.senderName === agent.name && m.type === 'TOOL');
                    let statusText = "업무 중...";
                    let Icon = Loader2;

                    if (lastToolMsg?.content.includes('write_file')) { statusText = "파일 작성 중"; Icon = Code2; }
                    else if (lastToolMsg?.content.includes('run_command')) { statusText = "명령어 실행 중"; Icon = Terminal; }
                    else if (lastToolMsg?.content.includes('call_agent')) { statusText = "협업 중"; Icon = Users; }
                    else if (lastToolMsg?.content.includes('read_file')) { statusText = "파일 읽는 중"; Icon = Database; }

                    return (
                      <motion.div
                        className={`absolute -top-14 px-4 py-2 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-30 flex items-center gap-2.5 border border-white/60 bg-white/80 backdrop-blur-md ${getAgentColor(agent.name).soft} font-extrabold text-[10px] whitespace-nowrap tracking-tight`}
                        initial={{ y: 15, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 10, opacity: 0, scale: 0.9 }}
                      >
                        <Icon size={14} className={Icon === Loader2 ? "animate-spin" : "animate-pulse"} />
                        <div className="flex flex-col">
                          <span className="uppercase">{statusText}</span>
                          {getFileName(lastToolMsg?.content || "") && (
                            <span className="text-[8px] opacity-70 truncate max-w-[100px]">{getFileName(lastToolMsg?.content || "")}</span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/80 border-r border-b border-white/60`}></div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Animated Avatar */}
                <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                  {/* Character Glow */}
                  {(isRunning || agent.lastEmotion === 'HAPPY') && (
                    <motion.div
                      className={`absolute inset-0 rounded-full blur-2xl ${agent.lastEmotion === 'HAPPY' ? 'bg-amber-400' : getAgentColor(agent.name).bg} opacity-30`}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}

                  {/* Cute Desk Base */}
                  <div className="absolute bottom-0 w-24 h-12 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white/80 shadow-sm -z-10 transform perspective-[500px] rotateX-[30deg]"></div>

                  {/* Avatar Character */}
                  <motion.div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-2xl transition-colors duration-500 ${isRunning ? `${getAgentColor(agent.name).bg} border-white` : agent.lastEmotion === 'HAPPY' ? 'bg-amber-400 border-white' : 'bg-white border-slate-100'}`}
                    animate={isRunning ? {
                      y: [0, -8, 0],
                    } : agent.lastEmotion === 'HAPPY' ? {
                      y: [0, -25, 0],
                      rotate: [0, 15, -15, 15, -15, 0]
                    } : agent.lastEmotion === 'SAD' ? {
                      x: [0, -5, 5, -5, 5, 0],
                      scale: 0.9
                    } : {
                      y: [0, -2, 0]
                    }}
                    transition={{
                      repeat: isRunning ? Infinity : 0,
                      duration: isRunning ? 0.6 : agent.lastEmotion === 'HAPPY' ? 1 : 0.4,
                      ease: "easeInOut"
                    }}
                  >
                    {agent.lastEmotion === 'HAPPY' ? <span className="text-xl">😎</span> : 
                     agent.lastEmotion === 'SAD' ? <span className="text-xl">😫</span> :
                     <Bot size={28} className={isRunning ? 'text-white' : 'text-slate-300'} />}
                  </motion.div>
                </div>

                {/* Nameplate */}
                <div className={`mt-2 bg-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border ${isRunning ? 'border-indigo-200' : 'border-slate-100'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300'}`}></span>
                  <span className="text-xs font-bold tracking-wide text-slate-700">{agent.name}</span>
                </div>
              </motion.div>
            );
          })}
          {/* Activity Dashboard (Draggable Bottom Panel) */}
          <motion.div
            drag
            dragMomentum={false}
            className="absolute bottom-10 left-10 z-[45] flex flex-col"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div
              style={{ width: activityPanelSize.width, height: activityPanelSize.height }}
              className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col cursor-move active:scale-[0.99] transition-transform relative"
            >
              <div className="h-9 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-slate-500" />
                  <Terminal size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">실시간 활동 대시보드</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => setActiveTab('LOGS')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${activeTab === 'LOGS' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      LOGS
                    </button>
                    <button
                      onClick={() => setActiveTab('REASONING')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${activeTab === 'REASONING' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      REASONING
                    </button>
                    <button
                      onClick={() => setActiveTab('STATS')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${activeTab === 'STATS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      STATS
                    </button>
                    <button
                      onClick={() => setActiveTab('SCHEDULER')}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${activeTab === 'SCHEDULER' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      SCHEDULER
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold text-emerald-400/80 uppercase">시스템 가동 중</span>
                  </div>
                </div>
              </div>
                <div className="flex-1 flex overflow-hidden">
                  {/* Log Terminal / Stats / Scheduler content */}
                  <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 custom-scrollbar bg-black/20 text-slate-300">
                    {activeTab === 'LOGS' ? (
                      messages.filter(m => m.type === 'TOOL' || m.type === 'COMMAND').slice(-50).map((msg, i) => (
                        <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                          <span className={`${getAgentColor(msg.senderName).soft} font-bold shrink-0`}>{msg.senderName}:</span>
                          <span className="text-emerald-400/90 italic truncate">{msg.content.replace('🔍 **도구 사용**:', '').replace('✨ **도구 실행 완료**:', '')}</span>
                        </div>
                      ))
                    ) : activeTab === 'REASONING' ? (
                      messages.filter(m => m.type === 'THINKING' || m.type === 'AGENT').slice(-30).map((msg, i) => (
                        <div key={i} className={`flex gap-3 p-2 rounded-lg border ${msg.type === 'THINKING' ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-slate-800/50 border-slate-700/50'} animate-in zoom-in-95 duration-500`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.type === 'THINKING' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {msg.type === 'THINKING' ? <Sparkles size={10} className="animate-pulse" /> : <Bot size={10} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-bold ${getAgentColor(msg.senderName).soft}`}>{msg.senderName}</span>
                              <span className="text-[8px] text-slate-500">{msg.type}</span>
                            </div>
                            <p className={`leading-relaxed ${msg.type === 'THINKING' ? 'text-indigo-200/90 italic' : 'text-slate-200'}`}>{msg.content}</p>
                          </div>
                        </div>
                      ))
                    ) : activeTab === 'STATS' ? (
                      <div className="h-full flex flex-col gap-6 p-2">
                        <div className="h-32 w-full">
                          <span className="text-[9px] text-slate-500 uppercase font-black mb-2 block">최근 24시간 활동량</span>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getActivityChartData()}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                              <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-500 uppercase font-black mb-3 block">도구 사용 비중</span>
                          <div className="space-y-2">
                            {getToolUsageData().map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="w-16 truncate text-slate-400">{item.name}</span>
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${(item.value / Math.max(...getToolUsageData().map(d => d.value))) * 100}%` }}
                                    className="h-full bg-indigo-500"
                                  />
                                </div>
                                <span className="text-emerald-400 font-bold">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                          <span className="text-[9px] font-bold text-slate-400">자율 예약 작업 목록</span>
                          <button 
                            onClick={() => setIsSchedulerModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus size={10} /> 작업 추가
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                          {scheduledTasks.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-600 italic">등록된 예약 작업이 없습니다.</div>
                          ) : (
                            scheduledTasks.map(task => (
                              <div key={task.id} className="bg-slate-800/30 border border-slate-700/50 p-2 rounded-lg flex items-center justify-between group">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${task.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                                      {task.status}
                                    </span>
                                    <span className="font-bold text-slate-200">{task.description}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 text-[8px] flex-wrap mt-0.5">
                                    <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                                      <Calendar size={8} className="text-amber-400" /> 
                                      <span className="font-mono">{task.cronExpression}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                                      <Play size={8} className="text-emerald-400" /> 
                                      <span>다음: {task.nextRun ? new Date(task.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '대기 중'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                                      <Activity size={8} className="text-indigo-400" /> 
                                      <span>최근: {task.lastRun ? new Date(task.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '없음'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-4">
                                  <button 
                                    onClick={() => handleRunScheduledTask(task.id)}
                                    title="지금 바로 실행"
                                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all active:scale-95"
                                  >
                                    <Play size={12} fill="currentColor" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleScheduledTask(task.id)}
                                    title={task.status === 'ACTIVE' ? '일시 정지' : '다시 시작'}
                                    className={`p-2 rounded-lg border transition-all active:scale-95 ${task.status === 'ACTIVE' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                                  >
                                    {task.status === 'ACTIVE' ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteScheduledTask(task.id)}
                                    title="삭제"
                                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    <div className="h-1" ref={consoleScrollRef}></div>
                  </div>
                {/* Modified Files Side */}
                <div className="w-[180px] border-l border-slate-700 bg-slate-800/30 p-3 flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1">최근 변경 파일</span>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 text-slate-300">
                    {getRecentFiles().length > 0 ? getRecentFiles().map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-[9px] text-slate-300 group cursor-default">
                        <Code2 size={10} className="text-indigo-400" />
                        <span className="truncate" title={file}>{file.split('/').pop()}</span>
                      </div>
                    )) : (
                      <div className="text-[9px] text-slate-600 italic mt-2">변경 이력 없음</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resize Handle */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-slate-400"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = activityPanelSize.width;
                  const startHeight = activityPanelSize.height;

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    setActivityPanelSize({
                      width: Math.max(400, startWidth + (moveEvent.clientX - startX)),
                      height: Math.max(150, startHeight + (moveEvent.clientY - startY))
                    });
                  };

                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                  };

                  document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="rotate-90">
                  <path d="M1 9L9 1M4 9L9 4M7 9L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Floating Chat Window (Messenger Style) */}
          <AnimatePresence>
            {activeChat && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-8 right-8 w-[600px] h-[650px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col overflow-hidden z-50 transition-all duration-300"
              >
                {/* Fake Window Header */}
                <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeChat === '라운지 미팅' ? 'bg-indigo-50' : getAgentColor(activeChat).light} ${activeChat === '라운지 미팅' ? 'text-indigo-500' : getAgentColor(activeChat).text}`}>
                      {activeChat === '라운지 미팅' ? <Users size={20} /> : <Bot size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{activeChat}</h3>
                      <div className={`${activeChat === '라운지 미팅' ? 'text-emerald-500' : getAgentColor(activeChat).soft} text-[10px] font-bold flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${activeChat === '라운지 미팅' ? 'bg-emerald-400' : getAgentColor(activeChat).bg}`}></span> 접속 중
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveChat(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
                  {(() => {
                    const currentRoomId = activeChat === '라운지 미팅' ? "default" : `agent-${activeChat}`;
                    const roomMessages = messages.filter(msg => msg.roomId === currentRoomId);

                    if (roomMessages.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                          <MessageSquare size={32} className="text-slate-300" />
                          <p className="text-xs font-medium">인사를 나누어 보세요!</p>
                        </div>
                      );
                    }

                    return roomMessages.map((msg, i) => {
                      const isMe = msg.senderId === 'user-1';
                      const isSystem = msg.type === 'SYSTEM';
                      const isCollaborating = msg.content.includes('🤝 [협업 요청 수신]');
                      const agentColor = getAgentColor(msg.senderName);

                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && !isSystem && (
                            <div className={`w-8 h-8 rounded-full ${agentColor.light} ${agentColor.text} flex items-center justify-center shrink-0 mr-2 mt-auto mb-1 border ${agentColor.border}`}>
                              {msg.type === 'AGENT' ? <Bot size={14} /> : <User size={14} />}
                            </div>
                          )}

                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            {!isMe && !isSystem && (
                              <span className={`text-[10px] ${agentColor.soft} mb-1 ml-1 font-bold`}>{msg.senderName}</span>
                            )}
                            <div className={`px-4 py-2.5 text-sm ${isMe
                              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md'
                              : isSystem
                                ? 'bg-transparent text-slate-400 font-medium text-xs w-full text-center'
                                : msg.type === 'TOOL'
                                  ? 'bg-slate-50 border border-slate-200 text-slate-600 rounded-lg font-mono text-[11px] w-full'
                                  : isCollaborating
                                    ? `bg-gradient-to-br from-white to-${agentColor.light.split('-')[1]}-50 border-2 ${agentColor.border} shadow-lg rounded-2xl rounded-tl-sm`
                                    : `bg-white border-2 ${agentColor.border} text-slate-700 rounded-2xl rounded-tl-sm shadow-sm`
                              }`}>
                              <div className="prose prose-sm max-w-none">
                                {isSystem ? (
                                  <div className="italic">{msg.content}</div>
                                ) : msg.type === 'TOOL' ? (
                                  <div className="flex items-center gap-2 py-1">
                                    {msg.content.includes('🛠️') ? <Terminal size={12} className="text-indigo-500" /> : <Code2 size={12} className="text-emerald-500" />}
                                    <span>{msg.content}</span>
                                  </div>
                                ) : (
                                  <div className={isCollaborating ? 'font-medium' : ''}>
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                        code: ({ node, ...props }) => (
                                          <code className={`${isMe ? 'bg-blue-400/30 text-white' : 'bg-slate-100 text-pink-500'} px-1.5 py-0.5 rounded-md font-mono text-[13px]`} {...props} />
                                        ),
                                        pre: ({ node, ...props }) => (
                                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg my-2 overflow-x-auto font-mono text-xs shadow-inner border border-slate-800" {...props} />
                                        ),
                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 border-b pb-1">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-base font-bold mb-1.5">{children}</h2>,
                                        strong: ({ children }) => <strong className={`font-bold ${isMe ? 'text-blue-100' : agentColor.soft}`}>{children}</strong>,
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-5 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                      placeholder="메시지를 입력하세요..."
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      autoFocus
                    />
                    <button
                      onClick={handleSendMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-md shadow-blue-500/20 text-white"
                    >
                      <Send size={15} className="ml-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Right Panel: Crew Deck (Glassmorphism) */}
      <div className="w-[320px] border-l border-indigo-50/50 bg-white/70 backdrop-blur-2xl flex flex-col shrink-0 relative z-20 shadow-[-10px_0_40px_rgba(0,0,0,0.02)]">
        <div className="h-16 border-b border-slate-100/50 flex items-center justify-between px-6 shrink-0">
          <h2 className="font-black text-[11px] text-slate-500 flex items-center gap-3 uppercase tracking-[0.2em]">
            <Users size={18} className="text-blue-400" /> 크루 명단
          </h2>
          <span className="text-[9px] bg-blue-50/80 text-blue-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-blue-100/50">
            {agents.length} 온라인
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white/30">
          {agents.map(agent => (
            <div key={agent.id}
              className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-4 hover:border-blue-200/50 hover:bg-white/80 hover:shadow-[0_10px_25px_rgba(0,0,0,0.03)] transition-all cursor-pointer group shadow-sm"
              onClick={() => setActiveChat(agent.name)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-11 h-11 rounded-2xl ${getAgentColor(agent.name).light} flex items-center justify-center group-hover:scale-105 transition-transform border border-white shrink-0 shadow-sm`}>
                    {agent.role.toLowerCase().includes('front') ? <Layout size={18} className="text-pink-400" /> :
                      agent.role.toLowerCase().includes('back') ? <Database size={18} className="text-emerald-400" /> :
                        <Code2 size={18} className={getAgentColor(agent.name).text} />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${getAgentColor(agent.name).soft} flex items-center gap-1.5`}>
                      {agent.name}
                      {tasks.some(t => t.agent?.id === agent.id && t.status === 'RUNNING') && (
                        <span className={`w-1.5 h-1.5 rounded-full ${getAgentColor(agent.name).bg} animate-pulse shadow-[0_0_8px_currentColor]`}></span>
                      )}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-medium">{agent.role}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(agent);
                  }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-all"
                  title="정보 수정"
                >
                  <Sparkles size={14} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between bg-slate-50/50 border border-slate-100/50 rounded-lg py-1.5 px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">모델</span>
                <span className={`text-[10px] font-bold ${getAgentColor(agent.name).soft} uppercase tracking-widest`}>
                  {agent.model.includes('claude') ? 'CLAUDE 3.5' : 'GEMINI 2.5'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Deploy Button */}
        <div className="p-5 border-t border-slate-100 bg-white">
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            <Plus size={18} /> 새 에이전트 배치
          </button>
        </div>
      </div>

      {/* 4. Deploy New Agent Modal */}
      <AnimatePresence>
        {isDeployModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="text-lg font-extrabold text-slate-800">
                  {editingAgentId ? "에이전트 정보 수정" : "새 에이전트 배치"}
                </h3>
                <button onClick={() => {
                  setIsDeployModalOpen(false);
                  setEditingAgentId(null);
                  setNewAgent({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "", assignedSkills: [] });
                }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDeployAgent} className="p-7 space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">에이전트 이름</label>
                    <input
                      required
                      type="text"
                      value={newAgent.name}
                      onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                      placeholder="예: 조이"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">모델</label>
                    <select
                      value={newAgent.model}
                      onChange={e => setNewAgent({ ...newAgent, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                    >
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gpt-4o" disabled>OpenAI GPT-4o (준비 중)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">역할 / 직함</label>
                  <input
                    required
                    type="text"
                    value={newAgent.role}
                    onChange={e => setNewAgent({ ...newAgent, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                    placeholder="예: 마스터 플래너"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">시스템 프롬프트 (페르소나)</label>
                  <textarea
                    value={newAgent.systemPrompt}
                    onChange={e => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all h-24 resize-none placeholder:text-slate-300"
                    placeholder="밝고 활기차며 창의적인 플래너로 활동하세요..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">할당된 기술 (Skills)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {skills.map(skill => (
                      <label key={skill.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={newAgent.assignedSkills.includes(skill.name)}
                          onChange={e => {
                            const updated = e.target.checked
                              ? [...newAgent.assignedSkills, skill.name]
                              : newAgent.assignedSkills.filter(s => s !== skill.name);
                            setNewAgent({ ...newAgent, assignedSkills: updated });
                          }}
                          className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-400"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{skill.name}</span>
                          <span className="text-[9px] text-slate-400 truncate w-32">{skill.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeployModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {isDeploying ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {editingAgentId ? "정보 반영" : "에이전트 고용"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSkillInventoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-[700px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">기술 인벤토리</h3>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">현재 시스템에 설치된 기술 리스트</p>
                  </div>
                </div>
                <button onClick={() => setIsSkillInventoryOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                <div className="grid grid-cols-2 gap-6">
                  {skills.map(skill => (
                    <div key={skill.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Code2 size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-50/50 px-2 py-1 rounded-md">
                          Skill ID: {skill.id}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-2">{skill.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{skill.description}</p>
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="text-[9px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded truncate flex-1">
                          {skill.path}
                        </div>
                      </div>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center h-64 text-slate-400">
                      <Loader2 size={32} className="animate-spin mb-4 opacity-20" />
                      <p className="text-sm font-medium">설치된 기술을 불러오는 중이거나 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} className="text-indigo-400" /> 새로운 기슬은 .agent/skills 에 clone 하세요
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Whiteboard Modal */}
      <AnimatePresence>
        {isWhiteboardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`bg-white rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col transition-all duration-300 ${isFullscreenWhiteboard ? 'w-full h-full' : 'w-[1000px] h-[750px] max-h-full'}`}
            >
              <div className="px-8 py-5 border-b border-indigo-50 bg-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-inner">
                    <Presentation size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">에이전트 화이트보드</h3>
                    <p className="text-sm text-slate-500 font-medium">요원들의 기획안과 다이어그램이 실시간으로 그려집니다.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsFullscreenWhiteboard(!isFullscreenWhiteboard)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                    <Maximize2 size={18} />
                  </button>
                  <button onClick={() => setIsWhiteboardOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto w-full h-full bg-[#fafbfd] custom-scrollbar p-8">
                {whiteboardContent ? (
                  <div className="prose prose-slate max-w-none prose-h1:text-3xl prose-h1:font-black prose-h2:text-2xl prose-h3:text-xl prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-xl prose-img:rounded-xl prose-img:shadow-md prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown
                      components={{
                        code: ({ node, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isMermaid = match && match[1] === 'mermaid';

                          if (isMermaid) {
                            return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
                          }

                          return !className ? (
                            <code className="bg-slate-200 text-pink-500 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {whiteboardContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                      <Presentation size={48} className="text-slate-300 opacity-50" />
                    </div>
                    <p className="text-lg font-bold">화이트보드가 비어있습니다.</p>
                    <p className="text-sm font-medium text-slate-400">요원에게 마크다운이나 다이어그램 작성을 요청해 보세요.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Browser Preview (Floating Modal) */}
      <AnimatePresence>
        {isBrowserOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag
            dragMomentum={false}
            className="absolute bottom-10 right-[650px] w-[500px] bg-white/90 backdrop-blur-3xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200/60 flex flex-col overflow-hidden z-[60]"
          >
            {/* Fake Browser Header */}
            <div className="h-14 bg-slate-100/80 border-b border-slate-200/50 flex items-center px-4 shrink-0 cursor-grab active:cursor-grabbing justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
                </div>
                
                {/* Live Badge */}
                <div className="flex items-center gap-1.5 bg-sky-500 px-2 py-0.5 rounded-md border border-sky-600 shadow-sm animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-white"></span>
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">LIVE</span>
                </div>

                {/* URL Bar */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 w-[240px] truncate shadow-inner font-medium">
                  <Layout size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{browserUrl || "브라우저 대기 중..."}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (stompClient.current?.connected) {
                       const chatMsg: ChatMessage = {
                        roomId: activeChat === '라운지 미팅' ? "default" : `agent-${activeChat}`,
                        senderId: "user-1",
                        senderName: "사용자",
                        content: "@Browser browser_close",
                        type: "CHAT"
                      };
                      stompClient.current.publish({ destination: "/app/chat.send", body: JSON.stringify(chatMsg) });
                    }
                    setIsBrowserOpen(false);
                  }} 
                  className="p-2 rounded-lg bg-slate-200/50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-all"
                  title="세션 종료 및 닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px] max-h-[500px] bg-[#f8fafc] overflow-y-auto custom-scrollbar flex flex-col relative w-full">
              {browserScreenshot ? (
                <img src={browserScreenshot} alt="Browser screenshot" className="w-full h-auto object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 py-20 w-full">
                  <Loader2 size={32} className="animate-spin text-sky-400" />
                  <p className="text-sm font-medium">실시간 화면을 가져오는 중...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* Scheduler Modal */}
        <AnimatePresence>
          {isSchedulerModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              onClick={() => setIsSchedulerModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <Calendar size={24} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800">예약 작업 등록</h2>
                    </div>
                    <button onClick={() => setIsSchedulerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateScheduledTask} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">작업 설명</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-300"
                        placeholder="예: 매 분마다 시스템 상태 체크"
                        value={newScheduledTask.description}
                        onChange={e => setNewScheduledTask({ ...newScheduledTask, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">담당 에이전트</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                          value={newScheduledTask.agentId}
                          onChange={e => setNewScheduledTask({ ...newScheduledTask, agentId: Number(e.target.value) })}
                        >
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">크론 표현식</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                          placeholder="0 0/1 * * * ?"
                          value={newScheduledTask.cronExpression}
                          onChange={e => setNewScheduledTask({ ...newScheduledTask, cronExpression: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                          { label: "매 분 마다", cron: "0 * * * * ?" },
                          { label: "5분 마다", cron: "0 0/5 * * * ?" },
                          { label: "1시간 마다", cron: "0 0 * * * ?" },
                          { label: "매일 자정", cron: "0 0 0 * * ?" }
                        ].map(helper => (
                          <button
                            key={helper.label}
                            type="button"
                            onClick={() => setNewScheduledTask({ ...newScheduledTask, cronExpression: helper.cron })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${newScheduledTask.cronExpression === helper.cron ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                          >
                            {helper.label}
                          </button>
                        ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">수행할 명령 (Prompt)</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-300 resize-none"
                        placeholder="에이전트에게 내릴 구체적인 지시를 입력하세요."
                        value={newScheduledTask.command}
                        onChange={e => setNewScheduledTask({ ...newScheduledTask, command: e.target.value })}
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 group"
                      >
                        <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                        스케줄 등록하기
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* 6. Office Shop Modal */}
      <AnimatePresence>
        {isShopOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">오피스 상점</h3>
                    <p className="text-xs text-slate-400 font-medium">에이전트 포인트로 오피스를 꾸며보세요!</p>
                  </div>
                </div>
                <button onClick={() => setIsShopOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-2 gap-6 bg-slate-50/30 overflow-y-auto max-h-[500px] custom-scrollbar">
                {[
                  { type: "COFFEE_MACHINE", name: "고급 커피 머신", price: 50, icon: Coffee, desc: "요원들의 집중력을 높여줍니다." },
                  { type: "PLANT", name: "공기정화 식물", price: 30, icon: Leaf, desc: "쾌적한 사무 환경을 조성합니다." },
                  { type: "SERVER_RACK", name: "슈퍼 서버 랙", price: 150, icon: Database, desc: "연산 능력이 상승할 것만 같아요." },
                  { type: "GAMING_CHAIR", name: "인체공학 체어", price: 80, icon: User, desc: "장시간 업무에도 끄떡없습니다." },
                ].map(item => {
                  const buyer = [...agents].sort((a,b) => b.points - a.points)[0];
                  const canAfford = buyer && buyer.points >= item.price;
                  
                  return (
                    <div key={item.type} className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-amber-200 transition-all group flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <item.icon size={24} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Price</span>
                          <span className="text-lg font-black text-amber-500">⭐ {item.price}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 mb-6 font-medium leading-tight">{item.desc}</p>
                      
                      <button
                        disabled={!canAfford}
                        onClick={() => handleBuyItem(item.type, item.price)}
                        className={`mt-auto py-2.5 rounded-xl text-xs font-black transition-all ${canAfford ? 'bg-slate-900 text-white hover:bg-amber-500 shadow-lg shadow-slate-200 hover:shadow-amber-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        {canAfford ? '구매하기' : '포인트 부족'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-center items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">최고 보유 포인트:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                    {[...agents].sort((a,b) => b.points - a.points)[0]?.name[0]}
                  </div>
                  <span className="text-sm font-black text-slate-700">⭐ {[...agents].sort((a,b) => b.points - a.points)[0]?.points || 0}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CodebaseExplorer 
        isOpen={isCodebaseExplorerOpen} 
        onClose={() => setIsCodebaseExplorerOpen(false)} 
        results={codebaseResults} 
        onSearch={handleSearchCodebase}
        onIndex={handleIndexCodebase}
        isLoading={isCodebaseLoading}
        isIndexing={isIndexing}
      />

      <KnowledgeExplorer 
        isOpen={isKnowledgeExplorerOpen} 
        onClose={() => setIsKnowledgeExplorerOpen(false)} 
        memories={memories} 
        onSearch={handleSearchMemories}
        isLoading={isMemoriesLoading}
        getAgentColor={getAgentColor}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
