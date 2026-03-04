"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, MessageSquare, Plus, X, Users, Terminal, Code2, Layout, Database, Send, Command, Loader2, Sparkles, Coffee, GripVertical } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Agent, Task, ChatMessage, agentService, taskService, chatService, createWebSocketClient } from "./apiService";

export default function VirtualOfficeBright() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "" });
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const [activityPanelSize, setActivityPanelSize] = useState({ width: 680, height: 240 });

  const stompClient = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const consoleScrollRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = async () => {
    try {
      const [agentRes, taskRes, historyRes] = await Promise.all([
        agentService.getAll(),
        taskService.getByRoom("default"),
        chatService.getHistory("default")
      ]);
      setAgents(agentRes.data);
      setTasks(taskRes.data);
      // 초기 라운지 메시지 설정
      setMessages(historyRes.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
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
      }
    });

    stompClient.current = client;
    client.activate();

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
      setNewAgent({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "" });
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
      systemPrompt: agent.systemPrompt || ""
    });
    setEditingAgentId(agent.id);
    setIsDeployModalOpen(true);
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

  const getAgentPosition = (index: number) => {
    const cols = 4;
    const row = Math.floor(index / cols);
    const col = index % cols;
    // Adjust Y position to give more room for bottom panel if visible
    return { top: 120 + row * 160, left: 150 + col * 180 };
  };

  const getRecentFiles = () => {
    const toolMsgs = messages.filter(m => m.type === 'TOOL' && (m.content.includes('write_file') || m.content.includes('delete_file')));
    const files = new Set<string>();
    toolMsgs.forEach(m => {
      const match = m.content.match(/(?:write_file|delete_file) \({"path":"([^"]+)"/);
      if (match) files.add(match[1]);
    });
    return Array.from(files).slice(-5).reverse();
  };

  return (
    <div className="flex bg-[#f4f7fb] text-slate-700 h-screen w-full font-sans overflow-hidden selection:bg-indigo-100">

      {/* 1. Left Panel: Activity Feed (Light Theme) */}
      <div className="w-[420px] border-r border-indigo-100 bg-white flex flex-col shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-500">
        <div className="h-14 border-b border-slate-100 flex items-center px-5 shrink-0 bg-white/50 backdrop-blur-sm">
          <Terminal size={18} className="text-indigo-400 mr-2" />
          <span className="text-sm font-bold tracking-wide text-slate-700 uppercase">활동 기록</span>
          <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">실시간</span>
          </div>
        </div>

        <div ref={consoleScrollRef} className="flex-1 overflow-y-auto p-5 text-xs leading-relaxed space-y-4 custom-scrollbar bg-slate-50/50">
          <div className="text-indigo-500/70 font-medium mb-4 flex items-center gap-2">
            <Sparkles size={14} />
            <span>K-Zone AI 워크스페이스에 오신 것을 환영합니다!</span>
          </div>

          {messages.slice(-50).map((msg, i) => (
            <div key={i} className={`flex gap-2.5 items-start ${msg.type === 'SYSTEM' ? 'text-slate-400' : ''}`}>
              <span className="text-slate-400 shrink-0 font-mono text-[10px] mt-0.5">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : '방금'}
              </span>
              <div>
                <span className={`font-semibold mr-1.5 ${msg.senderId === 'user-1' ? 'text-blue-500' : msg.type === 'AGENT' ? 'text-indigo-500' : 'text-slate-500'}`}>
                  {msg.senderId === 'user-1' ? '나' : msg.senderName}
                </span>
                <div className="prose prose-sm max-w-none text-slate-600 italic">
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
        </div>

        {/* The 2D Map Floor (Very subtle cute grid) */}
        <div
          className="w-full h-full relative"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1.5px, transparent 1.5px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0'
          }}
        >
          {/* Environment Props */}
          <div className="absolute top-[100px] left-[60px] w-28 h-48 border-2 border-slate-200 bg-white rounded-xl flex flex-col items-center p-3 justify-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rotate-[-2deg]">
            <Layout size={36} className="text-sky-300" />
            <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">아이디어</span>
          </div>

          <div className="absolute bottom-[100px] left-[60px] w-56 h-36 border-2 border-dashed border-indigo-300 rounded-2xl flex flex-col items-center justify-center bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors shadow-sm group"
            onClick={() => setActiveChat('라운지 미팅')}>
            <Coffee size={36} className="text-indigo-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" />
            <span className="text-sm text-indigo-500 mt-3 font-bold uppercase tracking-widest">미팅 라운지</span>
            <div className="text-[10px] text-indigo-400/70 mt-1 font-medium">클릭하여 브레인스토밍</div>
          </div>

          {/* Agents */}
          {agents.map((agent, i) => {
            const pos = getAgentPosition(i);
            const isRunning = tasks.some(t => t.agent?.id === agent.id && t.status === 'RUNNING');

            return (
              <motion.div
                key={agent.id}
                className="absolute flex flex-col items-center cursor-pointer group"
                style={{ top: pos.top, left: pos.left }}
                onClick={() => setActiveChat(agent.name)}
                whileHover={{ scale: 1.05 }}
              >
                {/* Status bubble */}
                <div className="absolute -top-7 bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg shadow-slate-200/50 transform -translate-y-2 group-hover:translate-y-0">
                  {agent.role}
                </div>

                {/* Activity indicator / Status Bubble */}
                <AnimatePresence>
                  {isRunning && (() => {
                    const lastToolMsg = [...messages].reverse().find(m => m.senderName === agent.name && m.type === 'TOOL');
                    let statusText = "업무 수행 중...";
                    if (lastToolMsg?.content.includes('write_file')) statusText = "📝 파일 작성 중...";
                    else if (lastToolMsg?.content.includes('run_command')) statusText = "💻 명령어 실행 중...";
                    else if (lastToolMsg?.content.includes('call_agent')) statusText = "🤝 협업 요청 중...";
                    else if (lastToolMsg?.content.includes('read_file')) statusText = "📖 파일 읽는 중...";

                    return (
                      <motion.div
                        className={`absolute -top-12 px-3 py-1.5 rounded-xl shadow-xl z-30 flex items-center gap-2 border-2 ${getAgentColor(agent.name).border} ${getAgentColor(agent.name).light} ${getAgentColor(agent.name).soft} font-bold text-[11px] whitespace-nowrap`}
                        initial={{ y: 10, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 5, opacity: 0, scale: 0.8 }}
                      >
                        <Loader2 size={12} className="animate-spin" /> {statusText}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Animated Avatar */}
                <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                  {/* Cute Desk Base */}
                  <div className="absolute bottom-0 w-20 h-10 bg-white rounded-xl border border-slate-200 shadow-sm -z-10 transform perspective-100 rotateX-[25deg]"></div>

                  {/* Avatar Character */}
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-4 shadow-xl ${isRunning ? 'bg-indigo-500 border-indigo-100' : 'bg-slate-100 border-white'}`}
                    animate={isRunning ? {
                      y: [0, -6, 0],
                      rotate: [-3, 3, -3]
                    } : {
                      y: [0, -2, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: isRunning ? 0.4 : 2.5,
                      ease: "easeInOut"
                    }}
                  >
                    <Bot size={24} className={isRunning ? 'text-white' : 'text-slate-400'} />
                  </motion.div>
                </div>

                {/* Nameplate */}
                <div className={`mt-2 bg-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border ${isRunning ? 'border-indigo-200' : 'border-slate-100'}`}>
                  <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300'}`}></span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold text-emerald-400/80 uppercase">시스템 가동 중</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                {/* Log Terminal */}
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 custom-scrollbar bg-black/20 text-slate-300">
                  {messages.filter(m => m.type === 'TOOL' || m.type === 'COMMAND').slice(-20).map((msg, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span className={`${getAgentColor(msg.senderName).soft} font-bold shrink-0`}>{msg.senderName}:</span>
                      <span className="text-emerald-400/90 italic truncate">{msg.content.replace('🔍 **도구 사용**:', '').replace('✨ **도구 실행 완료**:', '')}</span>
                    </div>
                  ))}
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

      {/* 3. Right Panel: Crew Deck */}
      <div className="w-[320px] border-l border-slate-200 bg-white flex flex-col shrink-0 relative z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
          <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> 크루 명단
          </h2>
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
            {agents.length} 온라인
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
          {agents.map(agent => (
            <div key={agent.id}
              className="bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group shadow-sm"
              onClick={() => setActiveChat(agent.name)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className={`w-10 h-10 rounded-full ${getAgentColor(agent.name).light} flex items-center justify-center group-hover:bg-opacity-80 transition-colors border-2 ${getAgentColor(agent.name).border}`}>
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
                  setNewAgent({ name: "", role: "", model: "claude-3-5-sonnet-20241022", systemPrompt: "" });
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all h-28 resize-none placeholder:text-slate-300"
                    placeholder="밝고 활기차며 창의적인 플래너로 활동하세요..."
                  />
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
