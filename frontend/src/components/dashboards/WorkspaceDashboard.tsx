import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Bot, Send, Terminal } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { getAgentColor } from "../../utils/agentColors";
import { TeamProductivityChart } from "../charts/TeamProductivityChart";

interface WorkspaceDashboardProps {
  vo: any;
  scrollRef: React.RefObject<HTMLDivElement>;
  consoleScrollRef: React.RefObject<HTMLDivElement>;
  onSendMessage: () => Promise<void>;
  onExecuteCommand: (command: string) => Promise<void>;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ 
  vo, scrollRef, consoleScrollRef, onSendMessage, onExecuteCommand 
}) => {
  return (
    <div className="flex-1 flex gap-8 h-full overflow-hidden">
      <div className="flex-1 flex flex-col rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
              <MessageSquare size={16} />
            </div>
            <h3 className="font-black text-slate-800 tracking-tight text-sm uppercase">워크스페이스</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">실시간 동기화 중</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar scroll-smooth" ref={scrollRef}>
          {vo.messages.map((msg: any, i: number) => (
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.sender === 'User' ? '마스터' : msg.sender}</span>
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
                placeholder="전역 메시지 또는 명령어를 입력하세요..."
                className="w-full bg-slate-50 border border-slate-100/50 rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100/30 transition-all font-mono"
                value={vo.inputValue}
                onChange={(e) => vo.setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (vo.inputValue.startsWith('/')) onExecuteCommand(vo.inputValue.substring(1));
                    else onSendMessage();
                  }
                }}
              />
              <button 
                onClick={onSendMessage}
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">내부 활동 로그</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar-dark font-mono text-[11px]" ref={consoleScrollRef}>
            {vo.activities.map((act: any) => (
              <motion.div initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} key={act.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-500">[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                  <span className={`${getAgentColor(act.agentName).soft} font-bold`}>{act.agentName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${act.type === 'PLANNING' ? 'bg-indigo-500' : act.type === 'TOOL' ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                      {act.type === 'PLANNING' ? '전략수립' : act.type === 'TOOL' ? '도구사용' : '사고과정'}
                  </span>
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
  );
};
