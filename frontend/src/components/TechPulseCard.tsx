import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Leaf, Layout, Activity, Sparkles, Database, Bot, ChevronRight, Search } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { TechPulse } from "../apiService";

export const TechPulseCard = ({ pulse }: { pulse: TechPulse }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const categoryColors: Record<string, { bg: string, text: string, border: string, icon: any }> = {
    "KOTLIN": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: Code2 },
    "SPRING": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: Leaf },
    "REACT": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", icon: Layout },
    "NEXTJS": { bg: "bg-slate-700/30", text: "text-slate-300", border: "border-slate-600/30", icon: Activity },
    "AI": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", icon: Sparkles },
    "SECURITY": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: Database },
    "GENERAL": { bg: "bg-slate-700/20", text: "text-slate-400", border: "border-slate-700/50", icon: Bot }
  };

  const status = categoryColors[pulse.category.toUpperCase()] || categoryColors["GENERAL"];
  const Icon = status.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800/40 border ${status.border} rounded-2xl overflow-hidden shadow-lg transition-all group hover:bg-slate-800/60`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${status.bg} ${status.text} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${status.text}`}>{pulse.category}</span>
                <span className="text-slate-700 font-black">/</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Impact Score:</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-3 h-1 rounded-full ${i < (pulse.impactScore / 2) ? status.bg.replace('/10', '').replace('/30', '').replace('700', '400') : 'bg-slate-800'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <h4 className="text-[13px] font-black text-white leading-tight mt-1 tracking-tight">{pulse.title}</h4>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
          >
            <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
        
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2">{pulse.description}</p>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t border-slate-700/50 space-y-3">
                <div className="bg-indigo-500/5 rounded-xl p-3 border border-indigo-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={12} className="text-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Project Impact Analysis</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed font-medium prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{pulse.projectImpact}</ReactMarkdown>
                  </div>
                </div>
                
                {pulse.sourceUrl && (
                  <a 
                    href={pulse.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                  >
                   <Search size={10} />
                   View Detailed Source
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
