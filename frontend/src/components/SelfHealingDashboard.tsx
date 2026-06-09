"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, X, Check, Terminal, Brain, Loader2, RefreshCw } from "lucide-react";
import { selfHealingService, SelfHealingLog } from "../app/apiService";

export function SelfHealingDashboard() {
    const [logs, setLogs] = useState<SelfHealingLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<SelfHealingLog | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await selfHealingService.getLogs();
            setLogs(response.data);
        } catch (error) {
            console.error("Failed to fetch self-healing logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const retryCount = logs.filter(log => log.strategyType === "RETRY_WITH_FIX").length;
    const giveUpCount = logs.filter(log => log.strategyType === "GIVE_UP").length;
    const successRate = logs.length > 0 ? Math.round((retryCount / logs.length) * 100) : 0;

    return (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">자가 치유(Self-Healing) 대시보드</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">에이전트 장애 복구 및 자율 치유 이력 관측</p>
                    </div>
                </div>
                <button 
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    새로고침
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">총 자가 치유 시도</span>
                    <span className="text-3xl font-black text-slate-800">{logs.length} <span className="text-sm text-slate-400">건</span></span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">복구 성공률 (RETRY)</span>
                    <span className="text-3xl font-black text-emerald-500">{successRate} <span className="text-sm text-slate-400">%</span></span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">자율 복구 중단 (GIVE UP)</span>
                    <span className="text-3xl font-black text-red-500">{giveUpCount} <span className="text-sm text-slate-400">건</span></span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Logs List */}
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">이력 목록</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                        {isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-10">
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-xs font-bold">로그 로딩 중...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 py-10">
                                <Shield size={32} />
                                <span className="text-xs font-bold">기록된 자가 치유 이력이 없습니다.</span>
                            </div>
                        ) : (
                            logs.map(log => (
                                <motion.div
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        selectedLog?.id === log.id 
                                            ? "border-orange-200 bg-orange-50/50" 
                                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                    }`}
                                    whileHover={{ scale: 0.98 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${log.strategyType === "RETRY_WITH_FIX" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                                            <span className="text-xs font-black text-slate-700">{log.agentName || "Unknown Agent"}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{log.originalCommand}</p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Log Details */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">상세 분석 보고서</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <AnimatePresence mode="wait">
                            {selectedLog ? (
                                <motion.div
                                    key={selectedLog.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col gap-6"
                                >
                                    {/* Strategy Badge */}
                                    <div className="flex justify-between items-center">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            selectedLog.strategyType === "RETRY_WITH_FIX" 
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                : "bg-red-50 text-red-600 border-red-100"
                                        }`}>
                                            {selectedLog.strategyType === "RETRY_WITH_FIX" ? "자율 복구 및 재시도 (RETRY)" : "자율 복구 중단 및 보고 (GIVE UP)"}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Task ID: {selectedLog.taskId}</span>
                                    </div>

                                    {/* Agent & Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">담당 에이전트</span>
                                            <span className="text-sm font-bold text-slate-700">{selectedLog.agentName || "Unknown"}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">발생 시각</span>
                                            <span className="text-sm font-bold text-slate-700">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Original Command */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">원본 명령 (Goal)</span>
                                        <p className="text-xs text-slate-600 font-medium">{selectedLog.originalCommand}</p>
                                    </div>

                                    {/* Error */}
                                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <X size={14} className="text-red-500" />
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">발생한 에러</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-red-50 font-mono text-[11px] text-red-600 overflow-x-auto">
                                            {selectedLog.error}
                                        </div>
                                    </div>

                                    {/* Reasoning */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Brain size={14} className="text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">분석 및 복구 전략 (Reasoning)</span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium">{selectedLog.reasoning}</p>
                                    </div>

                                    {/* Suggested Command */}
                                    {selectedLog.strategyType === "RETRY_WITH_FIX" && (
                                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Check size={14} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">수정된 구체적 명령 (Suggested Command)</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-50 font-mono text-[11px] text-emerald-600 overflow-x-auto">
                                                {selectedLog.suggestedCommand}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 py-20">
                                    <Terminal size={40} />
                                    <span className="text-xs font-bold">이력을 선택하시면 상세 분석 결과를 볼 수 있습니다.</span>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
