import React from "react";
import { motion } from "framer-motion";
import { 
  FileText, Sparkles, TrendingUp, ShieldCheck, 
  Lightbulb, AlertTriangle, ChevronRight, BarChart 
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface MissionPostMortemProps {
  report: string;
}

export const MissionPostMortem: React.FC<MissionPostMortemProps> = ({ report }) => {
  if (!report) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-10"
    >
      {/* Visual Header */}
      <div className="relative h-48 rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center px-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">전역 미션 지능 상호작용 분석</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Hive Synthesis: Autonomous post-mortem report</p>
          </div>
        </div>
        <div className="ml-auto relative z-10 hidden md:flex gap-4">
           {[
             { label: "분석 수준", val: "Depth 5", icon: ShieldCheck },
             { label: "신뢰 지수", val: "98.2%", icon: Sparkles }
           ].map((stat, i) => (
             <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                   <stat.icon size={12} className="text-indigo-400" />
                   <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-white text-xs font-black">{stat.val}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-xl shadow-slate-200/50">
              <div className="prose prose-slate max-w-none 
                prose-h1:text-3xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-h1:mb-8
                prose-h2:text-xl prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tight prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:mt-12 prose-h2:mb-6
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-sm
                prose-li:text-slate-600 prose-li:text-sm prose-li:my-1
                prose-strong:text-slate-900 prose-strong:font-black
                prose-code:bg-slate-100 prose-code:text-indigo-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/30 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl prose-blockquote:italic
              ">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mb-16 -mr-16"></div>
              <TrendingUp size={40} className="mb-6 opacity-40" />
              <h3 className="text-lg font-black uppercase tracking-tighter italic mb-2 leading-tight">지능형 회복력 요약</h3>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80">
                이번 미션에서 에이전트 그룹은 예상치 못한 오류에 대해 자율적인 치유 전략을 적용하여 성공적으로 성과를 달성했습니다.
              </p>
              <div className="mt-8 pt-8 border-t border-white/20">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">협업 시너지율</span>
                    <span className="text-sm font-black">94%</span>
                 </div>
                 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-white" />
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">추천 개선 액션</h4>
              <div className="space-y-4">
                 {[
                   { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50", text: "Planner 에이전트의 목표 분해 정밀도 향상 추천" },
                   { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50", text: "Reviewer 에이전트의 코드 보안 검토 단계 강화" },
                   { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50", text: "의존성 충돌 방지를 위한 병렬 실행 로직 최적화" }
                 ].map((action, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group cursor-default">
                       <div className={`shrink-0 w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}>
                          <action.icon size={18} />
                       </div>
                       <p className="text-[11px] font-bold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors uppercase italic">{action.text}</p>
                    </div>
                 ))}
              </div>
              <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2">
                 상세 지표 분석 더보기 <ChevronRight size={12} />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
