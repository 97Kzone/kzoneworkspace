import { useState, useEffect, useRef } from "react";
import { Target } from "lucide-react";
import mermaid from 'mermaid';
import { Task } from "../apiService";

export const MissionMap = ({ parentTask, subTasks, getAgentColor }: { parentTask: Task, subTasks: Task[], getAgentColor: (name: string) => any }) => {
  const [chart, setChart] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subTasks.length === 0) return;

    let mermaidGraph = "graph TD\n";
    mermaidGraph += `  P[${parentTask.command.substring(0, 30)}...]:::parent\n`;
    
    // Define nodes
    subTasks.forEach(task => {
      const statusClass = task.status === 'COMPLETED' ? 'done' : 
                          task.status === 'RUNNING' ? 'active' : 
                          task.status === 'HEALING' ? 'healing' :
                          task.status === 'FAILED' ? 'error' : 'pending';
      const agentName = task.agent?.name || "Unknown";
      const cmdShort = task.command.substring(0, 25).replace(/"/g, "'");
      mermaidGraph += `  T${task.id}["${agentName}<br/>${cmdShort}..."]:::${statusClass}\n`;
    });

    // Define edges
    subTasks.forEach(task => {
      if (task.dependsOnIds) {
          const deps = task.dependsOnIds.split(',');
          deps.forEach(depId => {
              mermaidGraph += `  T${depId} --> T${task.id}\n`;
          });
      } else {
          // If no dependency, it stems from parent (for visual clarity)
          mermaidGraph += `  P --> T${task.id}\n`;
      }
    });

    // Define Styles
    mermaidGraph += "  classDef parent fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155,font-weight:bold\n";
    mermaidGraph += "  classDef done fill:#f0fdf4,stroke:#10b981,stroke-width:2px,color:#065f46\n";
    mermaidGraph += "  classDef active fill:#eef2ff,stroke:#6366f1,stroke-width:3px,color:#312e81,font-weight:bold\n";
    mermaidGraph += "  classDef healing fill:#fff7ed,stroke:#f97316,stroke-width:3px,color:#9a3412,stroke-dasharray: 2 2\n";
    mermaidGraph += "  classDef error fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d\n";
    mermaidGraph += "  classDef pending fill:#fafafa,stroke:#e2e8f0,stroke-width:1px,color:#94a3b8,stroke-dasharray: 5 5\n";

    setChart(mermaidGraph);
  }, [parentTask, subTasks]);

  useEffect(() => {
    if (containerRef.current && chart) {
        try {
            mermaid.render(`mission-${parentTask.id}`, chart).then(({ svg }) => {
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
            });
        } catch (err) {
            console.error("Mermaid Render Error (Mission):", err);
        }
    }
  }, [chart, parentTask.id]);

  return (
    <div className="h-full flex flex-col p-4 bg-slate-900/40 rounded-xl border border-slate-800/60 transition-all">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <Target size={16} className="text-indigo-400" />
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">실시간 미션 의존 관계도</span>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"></div><span className="text-[8px] text-slate-500 uppercase font-bold">Pending</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[8px] text-indigo-400 uppercase font-bold">Running</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[8px] text-orange-400 uppercase font-bold">Healing</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] text-emerald-400 uppercase font-bold">Done</span></div>
          </div>
       </div>
       <div className="flex-1 overflow-auto bg-white/5 rounded-xl border border-white/5 flex items-center justify-center p-4">
          <div ref={containerRef} className="w-full scale-125" />
       </div>
    </div>
  );
};
