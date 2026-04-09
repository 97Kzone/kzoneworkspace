import { motion } from "framer-motion";
import { Zap, TrendingUp, ShieldAlert, BarChart3, Activity } from "lucide-react";
import { TechPulse } from "../app/apiService";

/**
 * 개별 기술 트렌드 및 영향도를 표시하는 카드 컴포넌트
 */
export const TechPulseCard = ({ pulse }: { pulse: TechPulse }) => {
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
        if (score >= 80) return "text-rose-500 bg-rose-50 border-rose-100";
        if (score >= 50) return "text-amber-500 bg-amber-50 border-amber-100";
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

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
      >
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                {getCategoryIcon(pulse.category)}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categoryLabels[pulse.category] || pulse.category}</span>
           </div>
           <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getImpactColor(pulse.impactScore)}`}>
              영향도 {pulse.impactScore}
           </div>
        </div>
        
        <h4 className="text-sm font-black text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors uppercase">{pulse.techName}</h4>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">{pulse.description}</p>
        
        <div className="space-y-3 pt-4 border-t border-slate-50">
           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>트렌드 성장률</span>
              <span className="text-indigo-500">+{pulse.trendGrowth}%</span>
           </div>
           <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${pulse.trendGrowth}%` }} 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-400" 
              />
           </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1">
                <TrendingUp size={10} className="text-emerald-500" />
                <span>관심도 점수: {pulse.interestScore}</span>
            </div>
            <span>{new Date(pulse.updatedAt).toLocaleDateString()}</span>
        </div>
      </motion.div>
    );
};
