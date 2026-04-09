import { motion } from "framer-motion";
import { Bot, Code2, Terminal, Search, Layout } from "lucide-react";

export const LivePreviewBubble = ({ 
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
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">실시간 업무 중</span>
        </div>
      </div>
      <div className="text-[10px] font-mono text-slate-600 bg-white/60 rounded-xl p-2.5 border border-white/90 break-all line-clamp-2 shadow-inner">
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
