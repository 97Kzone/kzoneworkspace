"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, TrendingUp, ShieldAlert, BarChart3, Activity, 
  ChevronDown, ChevronUp, Rocket, Check, Loader2 
} from "lucide-react";
import { TechPulse } from "../app/apiService";
import ReactMarkdown from "react-markdown";

interface TechPulseCardProps {
  pulse: TechPulse;
  onLaunchMission?: (id: number) => Promise<void>;
  onViewMission?: (missionId: number) => void;
}

/**
 * 개별 기술 트렌드 및 영향도를 표시하는 카드 컴포넌트
 */
export const TechPulseCard: React.FC<TechPulseCardProps> = ({ 
  pulse, 
  onLaunchMission, 
  onViewMission 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);

    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'FRAMEWORK': return <BarChart3 size={14} />;
        case 'LIBRARY': return <Activity size={14} />;
        case 'SECURITY': return <ShieldAlert size={14} />;
        case 'PERFORMANCE': return <Zap size={14} />;
        default: return <TrendingUp size={14} />;
      }
    };

    const getImpactColor = (score: number) => {
        if (score >= 8) return "text-rose-500 bg-rose-50 border-rose-100";
        if (score >= 5) return "text-amber-500 bg-amber-50 border-amber-100";
        return "text-emerald-500 bg-emerald-50 border-emerald-100";
    };

    // 카테고리 표시용 한글 매핑
    const categoryLabels: Record<string, string> = {
        'FRAMEWORK': '프레임워크',
        'LIBRARY': '라이브러리',
        'SECURITY': '보안',
        'PERFORMANCE': '성능/최적화',
        'GENERAL': '일반'
    };

    const handleLaunch = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onLaunchMission) return;
      setIsLaunching(true);
      try {
        await onLaunchMission(pulse.id);
      } finally {
        setIsLaunching(false);
      }
    };

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-fit"
      >
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                {getCategoryIcon(pulse.category)}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {categoryLabels[pulse.category] || pulse.category}
              </span>
           </div>
           <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getImpactColor(pulse.impactScore)}`}>
              영향도 {pulse.impactScore}/10
           </div>
        </div>
        
        <h4 className="text-sm font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase">
          {pulse.title}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
          {pulse.description}
        </p>
        
        <div className="space-y-3 pt-4 border-t border-slate-50">
           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>프로젝트 영향 진단 점수</span>
              <span className="text-indigo-500">{pulse.impactScore * 10}%</span>
           </div>
           <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${pulse.impactScore * 10}%` }} 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-400" 
              />
           </div>
        </div>

        {/* expandable detail view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  구체적 영향 및 대응 지침 (AI 분석)
                </span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 prose max-w-none text-[11px] text-slate-600 leading-relaxed font-medium">
                  <ReactMarkdown>{pulse.projectImpact}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons / Controls */}
        <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-slate-50">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100/80 text-slate-500 hover:text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-100"
          >
            {isExpanded ? (
              <>
                상세 분석 닫기
                <ChevronUp size={12} />
              </>
            ) : (
              <>
                상세 분석 보기
                <ChevronDown size={12} />
              </>
            )}
          </button>

          {pulse.missionId ? (
            <button
              onClick={() => onViewMission?.(pulse.missionId!)}
              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/50"
            >
              <Check size={12} />
              대응 미션 진행 중 (#{pulse.missionId})
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={isLaunching || !onLaunchMission}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
            >
              {isLaunching ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <Rocket size={12} />
              )}
              대응 미션 개시
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>영향 스코어: {pulse.impactScore}</span>
            <span>{new Date(pulse.createdAt).toLocaleDateString()}</span>
        </div>
      </motion.div>
    );
};
