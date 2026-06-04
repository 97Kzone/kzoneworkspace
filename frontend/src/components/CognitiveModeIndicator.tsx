import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Activity, Zap, Cpu } from "lucide-react";

interface CognitiveModeIndicatorProps {
  cognitiveMode: string;
}

/**
 * 에이전트의 현재 실시간 인지 런타임 모드(Cognitive Mode)를 표시하는 전문 지표 배지
 */
export const CognitiveModeIndicator: React.FC<CognitiveModeIndicatorProps> = ({ cognitiveMode }) => {
  const getModeDetails = (mode: string) => {
    switch (mode) {
      case "STABLE":
        return {
          label: "인지 정렬 안정 (STABLE)",
          color: "from-emerald-500 to-teal-600 border-emerald-500/30 text-emerald-100",
          icon: <ShieldCheck size={12} className="text-emerald-300" />,
        };
      case "ATTENTION":
        return {
          label: "인지 편차 감지 (ATTENTION)",
          color: "from-amber-500 to-orange-600 border-amber-500/30 text-amber-100",
          icon: <AlertTriangle size={12} className="text-amber-300" />,
        };
      case "HEALING":
        return {
          label: "자가 치유 가동 (HEALING)",
          color: "from-blue-500 to-indigo-600 border-blue-500/30 text-blue-100",
          icon: <Activity size={12} className="text-blue-300" />,
        };
      case "BOOSTED":
        return {
          label: "고성능 추론 가속 (BOOSTED)",
          color: "from-indigo-500 to-violet-600 border-indigo-500/30 text-indigo-100",
          icon: <Zap size={12} className="text-indigo-300 animate-pulse" />,
        };
      case "OPTIMIZING":
        return {
          label: "컨텍스트 튜닝 중 (OPTIMIZING)",
          color: "from-cyan-500 to-blue-600 border-cyan-500/30 text-cyan-100",
          icon: <Cpu size={12} className="text-cyan-300" />,
        };
      default:
        return {
          label: `동적 인지 모드 (${mode})`,
          color: "from-slate-600 to-slate-700 border-slate-500/30 text-slate-100",
          icon: <Activity size={12} className="text-slate-300" />,
        };
    }
  };

  const details = getModeDetails(cognitiveMode);

  return (
    <motion.div
      initial={{ scale: 0.8, y: 15, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.8, y: 15, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`fixed bottom-6 right-6 z-[250] bg-gradient-to-r ${details.color} border pl-3 pr-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xl shadow-slate-950/20 backdrop-blur-md pointer-events-none`}
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-black/20 shrink-0">
        {details.icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 leading-none">
          SYSTEM COGNITIVE STATE
        </span>
        <span className="text-[10px] font-black tracking-tight mt-0.5 whitespace-nowrap">
          {details.label}
        </span>
      </div>
    </motion.div>
  );
};
