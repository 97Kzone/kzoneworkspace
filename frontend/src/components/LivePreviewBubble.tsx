import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * 에이전트가 사고 중이거나 도구를 사용 중일 때 실시간으로 보여주는 프리뷰 거품
 */
export const LivePreviewBubble = ({ 
  preview, 
  getAgentColor 
}: { 
  preview: { toolName: string, target: string, agentName: string }, 
  getAgentColor: (name: string) => any 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-start gap-3 bg-indigo-50/50 border border-indigo-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
         <Sparkles size={40} className="text-indigo-400" />
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${getAgentColor(preview.agentName).bg} text-white flex items-center justify-center shadow-lg relative overflow-hidden`}>
           <Sparkles size={20} className="animate-pulse" />
           <div className="absolute inset-0 bg-white/20 animate-ping"></div>
        </div>
        <div>
          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{preview.agentName} 사고 진행 중...</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">실시간 추론 스트리밍</span>
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
           <span>수행 도구: {preview.toolName}</span>
           <span className="text-indigo-500">진행도: 분석 중</span>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-600 italic shadow-inner">
           "{preview.target}"
        </div>
      </div>
    </motion.div>
  );
};
