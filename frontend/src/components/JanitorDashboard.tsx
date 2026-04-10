"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2, Loader2, Play, Bot, ShieldAlert, Search } from "lucide-react";
import { MaintenanceIssue } from "../app/apiService";

interface JanitorDashboardProps {
  issues: MaintenanceIssue[];
  isScanning: boolean;
  isLoading: boolean;
  onStartScan: () => void;
  onApplyFix: (id: number) => void;
}

export const JanitorDashboard: React.FC<JanitorDashboardProps> = ({
  issues,
  isScanning,
  isLoading,
  onStartScan,
  onApplyFix,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              자율 AI 자니터
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              실시간 기술 부채 스캔 및 자동 해소 시스템
            </p>
          </div>
        </div>
        <button
          onClick={onStartScan}
          disabled={isScanning}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isScanning
              ? "bg-slate-100 text-slate-400"
              : "bg-slate-900 text-white hover:bg-emerald-600 shadow-xl active:scale-95"
          }`}
        >
          {isScanning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {isScanning ? "스캔 중..." : "시스템 전체 스캔 시작"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-4 pb-10">
        {isScanning && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-16 h-16 border-4 border-t-indigo-500 border-indigo-100 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-500">
                <Search size={24} />
              </div>
            </div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
              코드베이스 기술 부채 분석 중...
            </p>
          </div>
        )}
        {issues.length === 0 && !isScanning ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Bot size={40} />
            </div>
            <p className="text-sm font-black uppercase tracking-widest">
              감지된 유지보수 이슈가 없습니다
            </p>
          </div>
        ) : (
          issues.map((issue) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  issue.severity === "CRITICAL"
                    ? "bg-rose-50 text-rose-500 border border-rose-100"
                    : "bg-amber-50 text-amber-500 border border-amber-100"
                }`}
              >
                <ShieldAlert size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      issue.status === "FIXED"
                        ? "bg-emerald-500 text-white"
                        : "bg-indigo-500 text-white"
                    }`}
                  >
                    {issue.status === "FIXED" ? "해결됨" : "미관리"}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 font-mono italic truncate">
                    {issue.filePath}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-1 leading-tight uppercase">
                  {issue.title || issue.category}
                </h4>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  {issue.description}
                </p>
              </div>
              <button
                onClick={() => onApplyFix(issue.id)}
                disabled={isLoading || issue.status === "FIXED"}
                className={`px-6 py-3 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                    issue.status === 'FIXED' ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-emerald-500'
                }`}
              >
                {issue.status === "FIXED" ? "완료됨" : "자동 수정"}
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
