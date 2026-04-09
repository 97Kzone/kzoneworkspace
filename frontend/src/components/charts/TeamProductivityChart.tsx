import { motion } from "framer-motion";
import { Loader2, Target, Zap, Activity, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { TeamPerformance } from "../apiService";

export const TeamProductivityChart = ({ performance }: { performance: TeamPerformance | null }) => {
  if (!performance) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
      <p className="text-[10px] font-black uppercase tracking-widest text-center">분석 데이터를 불러오는 중...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 animate-in fade-in duration-700 bg-black/20">
      <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
        {[
          { label: "완료 태스크", value: performance.totalTasksCompleted, icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "평균 성공률", value: `${performance.averageSuccessRate.toFixed(1)}%`, icon: Zap, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "활동 지수", value: performance.dailyStats.reduce((acc, curr) => acc + curr.activityCount, 0), icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <div key={i} className={`p-3 rounded-2xl ${stat.bg} border border-white/5 flex flex-col items-center justify-center text-center shadow-inner`}>
            <stat.icon size={14} className={`${stat.color} mb-1.5`} />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</span>
            <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[0] relative mt-2">
        <span className="text-[9px] text-slate-500 uppercase font-black mb-4 flex items-center gap-2">
          <BarChart3 size={12} className="text-indigo-400" />
          최근 7일 생산성 트렌드
        </span>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance.dailyStats}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.split('-').slice(1).join('/')} 
              />
              <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} 
                itemStyle={{ padding: '0' }}
              />
              <Area 
                type="monotone" 
                dataKey="taskCount" 
                name="완료 태스크"
                stroke="#818cf8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTasks)" 
              />
              <Area 
                type="monotone" 
                dataKey="activityCount" 
                name="에이전트 활동"
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorActivities)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 overflow-y-auto custom-scrollbar pr-1">
        <span className="text-[9px] text-slate-500 uppercase font-black mb-3 block">에이전트별 누적 공헌도</span>
        <div className="space-y-2 pb-2">
          {performance.agentPerformance.map((agent, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="w-16 truncate text-[10px] font-bold text-slate-300">{agent.agentName}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(agent.completedTasks / Math.max(1, ...performance.agentPerformance.map(d => d.completedTasks))) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400 w-12 text-right">{agent.completedTasks} tasks</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
