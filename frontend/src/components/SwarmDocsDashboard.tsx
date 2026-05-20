"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, RefreshCw, FileText, CheckCircle2, 
    Cpu, Code, Database, Clock, ChevronRight, AlertCircle, AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { swarmDocsService, SwarmDocsReport } from '../app/apiService';

export const SwarmDocsDashboard: React.FC = () => {
    const [report, setReport] = useState<SwarmDocsReport | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadLatestReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await swarmDocsService.getLatest();
            setReport(res.data);
        } catch (err: any) {
            console.error("아키텍처 문서 로드 실패:", err);
            setError("백엔드로부터 아키텍처 데이터를 가져오는데 실패했습니다. 서버가 켜져 있는지 확인하세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await swarmDocsService.generate();
            setReport(res.data);
            setSuccessMessage("프로젝트 루트에 'PROJECT_ARCHITECTURE_KOREAN.md' 파일이 성공적으로 갱신되었습니다!");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            console.error("아키텍처 문서 갱신 실패:", err);
            setError("자율 아키텍처 갱신 중 실패가 발생했습니다. AI 엔지니어링 에이전트 로그를 확인하세요.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        loadLatestReport();
    }, []);

    return (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden pr-2">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">하이브 아키텍처 문서실</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">코드베이스 스캔 및 RAG 기반 자율 한국어 명세서 자동 관리</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        disabled={isGenerating || isLoading}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "아키텍처 자율 갱신 중..." : "아키텍처 자율 분석 및 갱신"}
                    </motion.button>
                </div>
            </div>

            {/* Notification Bar */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-50 border border-rose-100 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold"
                    >
                        <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold"
                    >
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                {[
                    { label: "스캔된 소스 파일 수", value: report?.totalFiles ?? "-", desc: "프로젝트 코드 및 설정 파일", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50/50" },
                    { label: "분석된 컴포넌트 수", value: report?.indexedSignatures ?? "-", desc: "클래스 및 함수 시그니처 맵", icon: Code, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { label: "RAG 군집 지식 수", value: report?.agentInsightsCount ?? "-", desc: "미션 컨텍스트 및 복구 로그 이력", icon: Database, color: "text-amber-500", bg: "bg-amber-50/50" },
                    { label: "아키텍처 문서 최종 업데이트", value: report ? report.lastUpdatedAt.split(' ')[1] : "-", desc: report ? report.lastUpdatedAt.split(' ')[0] : "분석 대기 중", icon: Clock, color: "text-slate-500", bg: "bg-slate-50/50" }
                ].map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md hover:shadow-lg transition-all"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{card.label}</span>
                            <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon size={16} />
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{card.value}</h4>
                        <p className="text-[9px] font-bold text-slate-400 truncate">{card.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Document Viewer */}
            <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PROJECT_ARCHITECTURE_KOREAN.md</span>
                    </div>
                    {report && (
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100">UTF-8 한글 명세서</span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 opacity-60">
                            <Cpu size={40} className="animate-spin text-indigo-500" />
                            <p className="text-xs font-black uppercase tracking-widest animate-pulse">프로젝트 아키텍처 데이터를 분석하여 로딩 중...</p>
                        </div>
                    ) : isGenerating ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-slate-400">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <span className="absolute w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></span>
                                <Cpu size={24} className="text-indigo-500 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-700">군집 지능 아키텍트 분석 엔진 가동 중</p>
                                <p className="text-[10px] font-bold text-slate-400 animate-pulse">코드 구조 스캔 및 에이전트 RAG 지식 분석을 종합하고 있습니다...</p>
                            </div>
                        </div>
                    ) : report ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="prose max-w-none prose-slate prose-headings:font-black prose-h1:text-xl prose-h2:text-sm prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-indigo-600 prose-h2:border-b prose-h2:pb-2 prose-h2:mt-8 prose-p:text-xs prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-xs prose-li:text-slate-600 prose-strong:text-slate-800 prose-code:text-[11px] prose-code:font-mono prose-code:bg-slate-50 prose-code:p-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:rounded-2xl"
                        >
                            <ReactMarkdown>{report.content}</ReactMarkdown>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300 py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                            <AlertCircle size={40} />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">아키텍처 정보가 아직 생성되지 않았습니다</p>
                            <button 
                                onClick={handleGenerate}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                분석 프로세스 수동 시작
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
