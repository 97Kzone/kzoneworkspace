"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Code2, Loader2, Play, Sparkles, Search, 
  FileCode, Cpu, Layers, Settings, ChevronRight, Check, AlertCircle 
} from "lucide-react";
import { CodeReviewResult, codebaseService } from "../app/apiService";

interface CodeReviewDashboardProps {
  reviews: CodeReviewResult[];
  isReviewing: boolean;
  onStartReview: (filePath?: string) => void;
  onApplyFix: (id: number) => void;
}

interface DiffLine {
  type: 'common' | 'removed' | 'added' | 'empty';
  text: string;
  lineNum?: number;
}

/**
 * 원본 소스코드와 AI 추천 패치 소스코드를 LCS(Longest Common Subsequence)를 이용해 
 * 줄 단위로 분석하여 정렬 대조해주는 고정밀 경량 Diff 정합 엔진
 */
const computeDiff = (original: string, suggested: string) => {
  const a = original.split('\n');
  const b = suggested.split('\n');
  
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1].trim() === b[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diffA: DiffLine[] = [];
  const diffB: DiffLine[] = [];
  
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1].trim() === b[j - 1].trim()) {
      diffA.unshift({ type: 'common', text: a[i - 1], lineNum: i });
      diffB.unshift({ type: 'common', text: b[j - 1], lineNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffA.unshift({ type: 'empty', text: '' });
      diffB.unshift({ type: 'added', text: b[j - 1], lineNum: j });
      j--;
    } else {
      diffA.unshift({ type: 'removed', text: a[i - 1], lineNum: i });
      diffB.unshift({ type: 'empty', text: '' });
      i--;
    }
  }
  
  return { diffA, diffB };
};

export const CodeReviewDashboard: React.FC<CodeReviewDashboardProps> = ({
  reviews,
  isReviewing,
  onStartReview,
  onApplyFix,
}) => {
  const [projectFiles, setProjectFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 이슈 심각도 필터링 상태 추가
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  // 컴포넌트 마운트 시 전체 파일 목록 조회
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const res = await codebaseService.getFiles();
        setProjectFiles(res.data);
        if (res.data.length > 0) {
          // 기본 선택 파일 지정
          setSelectedFile(res.data[0]);
        }
      } catch (e) {
        console.error("파일 목록 로드 실패:", e);
      } finally {
        setIsLoadingFiles(false);
      }
    };
    fetchFiles();
  }, []);

  // 검색 쿼리에 맞는 파일 필터링
  const filteredFiles = useMemo(() => {
    return projectFiles.filter(file => 
      file.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectFiles, searchQuery]);

  // 파일 확장자에 따라 어울리는 아이콘 반환
  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'kt':
      case 'kts':
      case 'java':
        return <Cpu size={16} className="text-amber-500" />;
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <Layers size={16} className="text-indigo-500" />;
      case 'json':
      case 'yaml':
      case 'yml':
        return <Settings size={16} className="text-slate-500" />;
      default:
        return <FileCode size={16} className="text-emerald-500" />;
    }
  };

  // 현재 선택된 파일에 매칭되는 리뷰 필터링
  const activeReviews = useMemo(() => {
    if (!selectedFile) return [];
    return reviews.filter(r => r.filePath === selectedFile);
  }, [reviews, selectedFile]);

  // 심각도별 통계 계산
  const stats = useMemo(() => {
    const high = activeReviews.filter(r => r.severity === "HIGH").length;
    const medium = activeReviews.filter(r => r.severity === "MEDIUM").length;
    const low = activeReviews.filter(r => r.severity === "LOW").length;
    return { high, medium, low, total: activeReviews.length };
  }, [activeReviews]);

  // 필터링 적용된 최종 리뷰 리스트
  const filteredReviews = useMemo(() => {
    if (severityFilter === "ALL") return activeReviews;
    return activeReviews.filter(r => r.severity === severityFilter);
  }, [activeReviews, severityFilter]);

  const handleStartReviewClick = () => {
    if (!selectedFile) return;
    onStartReview(selectedFile);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden h-full">
      {/* 1. 좌측 영역: 파일 탐색 및 세션 컨트롤 */}
      <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-100 rounded-[2rem] shadow-xl flex flex-col overflow-hidden max-h-[400px] lg:max-h-full">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                분석 소스 탐색기
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                리뷰를 실행할 파일을 선택하세요
              </p>
            </div>
          </div>

          {/* 파일 검색 필드 */}
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="파일명 또는 경로 검색..."
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
          {isLoadingFiles ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">탐색기 파일 동기화 중...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-60">
              <AlertCircle size={24} className="mb-2" />
              <span className="text-[9px] font-black uppercase tracking-widest">일치하는 파일 없음</span>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFile === file;
              const hasReviews = reviews.some(r => r.filePath === file);
              const appliedCount = reviews.filter(r => r.filePath === file && r.status === 'APPLIED').length;
              const pendingCount = reviews.filter(r => r.filePath === file && r.status === 'PENDING').length;

              return (
                <button
                  key={file}
                  onClick={() => {
                    setSelectedFile(file);
                    setSeverityFilter("ALL"); // 파일 선택 시 필터 리셋
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group border relative ${
                    isSelected 
                      ? "bg-indigo-50/50 border-indigo-200 shadow-sm" 
                      : "bg-white border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-indigo-100/50" : "bg-slate-100 group-hover:bg-slate-200"}`}>
                      {getFileIcon(file)}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-[11px] font-bold truncate ${isSelected ? "text-indigo-600" : "text-slate-700"}`}>
                        {file.split('/').pop()}
                      </p>
                      <p className="text-[8px] font-mono text-slate-400 truncate tracking-tight">
                        {file.substring(0, file.lastIndexOf('/'))}
                      </p>
                    </div>
                  </div>
                  
                  {/* 배지 카운트 표시 */}
                  <div className="flex gap-1 shrink-0 ml-2">
                    {appliedCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center">
                        <Check size={8} className="mr-0.5" /> {appliedCount}
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded-md">
                        {pendingCount}
                      </span>
                    )}
                    {!hasReviews && (
                      <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity text-slate-400`} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="p-5 border-t border-slate-50 bg-slate-50/20 shrink-0">
          <button
            onClick={handleStartReviewClick}
            disabled={isReviewing || !selectedFile}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isReviewing || !selectedFile
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-indigo-600 shadow-lg hover:shadow-indigo-100 active:scale-95 cursor-pointer"
            }`}
          >
            {isReviewing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {isReviewing ? "종합 분석 중..." : "선택 파일 AI 리뷰 실행"}
          </button>
        </div>
      </div>

      {/* 2. 우측 영역: 리뷰 상세 분석 결과 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 pb-10">
          {!selectedFile ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                <Code2 size={32} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-500">
                  선택된 소스 파일 없음
                </p>
                <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed">
                  좌측 소스코드 탐색기에서 리뷰를 수행하거나 기존 결과를 확인할 파일을 선택해 주세요.
                </p>
              </div>
            </div>
          ) : activeReviews.length === 0 && !isReviewing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                <Code2 size={32} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest mb-1 text-slate-500">
                  이 파일은 리뷰 결과가 없습니다
                </p>
                <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed">
                  왼쪽 하단의 <strong>'선택 파일 AI 리뷰 실행'</strong> 버튼을 눌러 에이전트에게 지능형 결함 분석을 요청해 보세요.
                </p>
              </div>
            </div>
          ) : isReviewing && activeReviews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <span className="absolute w-full h-full rounded-full border-4 border-indigo-50 border-t-indigo-500 animate-spin"></span>
                <Code2 size={20} className="text-indigo-500 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
                  AI 에이전트 코드 정밀 진단 중
                </p>
                <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed animate-pulse">
                  코드의 잠재적 버그, 보안 취약점, 유지보수 요인을 탐색하고 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 상단 현재 파일 브리핑 헤더 & 요약 분석 바 (Defect Analytics Bar) */}
              <div className="bg-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden shrink-0 border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      정밀 진단 대상 소스
                    </span>
                    <h2 className="text-xs sm:text-sm font-mono font-black text-white mt-2 truncate max-w-lg">
                      {selectedFile}
                    </h2>
                  </div>

                  {/* 심각도 요약 분석 바 */}
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 shrink-0 self-stretch sm:self-auto justify-around">
                    <div className="text-center px-3 border-r border-white/5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">총 결함</span>
                      <span className="text-sm font-black text-white">{stats.total}건</span>
                    </div>
                    <div className="text-center px-3 border-r border-white/5">
                      <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block mb-0.5">중대(High)</span>
                      <span className="text-sm font-black text-rose-400">{stats.high}건</span>
                    </div>
                    <div className="text-center px-3 border-r border-white/5">
                      <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">경고(Medium)</span>
                      <span className="text-sm font-black text-amber-400">{stats.medium}건</span>
                    </div>
                    <div className="text-center px-3">
                      <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest block mb-0.5">정보(Low)</span>
                      <span className="text-sm font-black text-sky-400">{stats.low}건</span>
                    </div>
                  </div>
                </div>

                {/* 요약 바 아래 심각도 분포 게이지 바 시각화 */}
                {stats.total > 0 && (
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex mt-4 border border-white/5">
                    <div 
                      style={{ width: `${(stats.high / stats.total) * 100}%` }} 
                      className="h-full bg-rose-500 transition-all duration-500" 
                      title={`중대 결함: ${stats.high}건`} 
                    />
                    <div 
                      style={{ width: `${(stats.medium / stats.total) * 100}%` }} 
                      className="h-full bg-amber-500 transition-all duration-500" 
                      title={`경고 사항: ${stats.medium}건`} 
                    />
                    <div 
                      style={{ width: `${(stats.low / stats.total) * 100}%` }} 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      title={`일반 정보: ${stats.low}건`} 
                    />
                  </div>
                )}
              </div>

              {/* 이슈 심각도 필터 탭 (Severity Filter Tabs) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start border border-slate-200/20 shadow-sm">
                {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((filter) => {
                  const isActive = severityFilter === filter;
                  const label = 
                    filter === "ALL" 
                      ? `전체 (${activeReviews.length})` 
                      : filter === "HIGH" 
                      ? `중대 결함 (${stats.high})` 
                      : filter === "MEDIUM" 
                      ? `경고 사항 (${stats.medium})` 
                      : `일반 정보 (${stats.low})`;
                  
                  return (
                    <button
                      key={filter}
                      onClick={() => setSeverityFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* 리뷰 카드 리스트 */}
              <AnimatePresence mode="popLayout">
                {filteredReviews.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <AlertCircle size={32} className="text-slate-300 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">선택된 등급의 결함이 없습니다</span>
                  </div>
                ) : (
                  filteredReviews.map((review) => {
                    const isApplied = review.status === 'APPLIED';
                    
                    return (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-lg group hover:border-indigo-100 transition-all"
                      >
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                review.severity === "HIGH"
                                  ? "bg-rose-500 text-white"
                                  : review.severity === "MEDIUM"
                                  ? "bg-amber-500 text-white"
                                  : "bg-indigo-500 text-white"
                              }`}
                            >
                              {review.severity === "HIGH"
                                ? "중대"
                                : review.severity === "MEDIUM"
                                ? "경고"
                                : "정보"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                ISSUE-{review.id}
                              </span>
                            </div>
                          </div>
                          
                          {isApplied ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg flex items-center gap-1">
                              <Check size={10} strokeWidth={3} /> 적용 완료
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              대기 중
                            </span>
                          )}
                        </div>
                        
                        <div className="p-6 sm:p-8 space-y-6">
                          <div>
                            <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight">
                              {review.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
                              {review.issue}
                            </p>
                          </div>

                          {/* 비주얼 Diff 뷰어 탑재 */}
                          {(() => {
                            const { diffA, diffB } = computeDiff(
                              review.originalCode || "",
                              review.suggestedCode || ""
                            );

                            return (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                                {/* 좌측: 현재 소스코드 (삭제된 부분 하이라이트) */}
                                <div className="space-y-2 flex flex-col">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1.5 italic">
                                    현재 소스코드 (삭제/변경 대조)
                                  </span>
                                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner overflow-x-auto max-h-80 custom-scrollbar-dark font-mono text-[10px] leading-relaxed flex-1">
                                    {diffA.map((line, idx) => (
                                      <div 
                                        key={idx}
                                        className={`flex w-full min-h-[1.5rem] rounded px-1 ${
                                          line.type === 'removed' 
                                            ? "bg-rose-950/30 text-rose-300 border-l-2 border-rose-500 font-bold" 
                                            : line.type === 'empty'
                                            ? "opacity-20 select-none bg-slate-900/10"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {/* 라인 번호 */}
                                        <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-2 border-r border-slate-800/50 mr-2">
                                          {line.lineNum !== undefined ? line.lineNum : ""}
                                        </span>
                                        {/* 삭제 심볼 및 텍스트 */}
                                        <span className="w-4 shrink-0 select-none text-rose-500/70 font-black">
                                          {line.type === 'removed' ? "-" : ""}
                                        </span>
                                        <span className="whitespace-pre">{line.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 우측: AI 추천 패치 (추가된 부분 하이라이트) */}
                                <div className="space-y-2 flex flex-col relative">
                                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] px-1.5 italic flex items-center gap-1">
                                    AI 추천 패치 (추가/개선 대조) <Sparkles size={10} className="text-indigo-400 animate-pulse" />
                                  </span>
                                  <div className="bg-indigo-950/5 rounded-2xl p-4 border border-indigo-500/10 shadow-inner overflow-x-auto max-h-80 custom-scrollbar font-mono text-[10px] leading-relaxed flex-1">
                                    {diffB.map((line, idx) => (
                                      <div 
                                        key={idx}
                                        className={`flex w-full min-h-[1.5rem] rounded px-1 ${
                                          line.type === 'added' 
                                            ? "bg-emerald-950/20 text-emerald-400 border-l-2 border-emerald-500 font-bold" 
                                            : line.type === 'empty'
                                            ? "opacity-20 select-none bg-slate-900/5"
                                            : "text-slate-600"
                                        }`}
                                      >
                                        {/* 라인 번호 */}
                                        <span className="w-8 shrink-0 text-slate-500/50 select-none text-right pr-2 border-r border-indigo-500/10 mr-2">
                                          {line.lineNum !== undefined ? line.lineNum : ""}
                                        </span>
                                        {/* 추가 심볼 및 텍스트 */}
                                        <span className="w-4 shrink-0 select-none text-emerald-500 font-black">
                                          {line.type === 'added' ? "+" : ""}
                                        </span>
                                        <span className="whitespace-pre text-indigo-950/80 dark:text-indigo-100">{line.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="pt-5 border-t border-slate-50 flex justify-end gap-3">
                            <button 
                              disabled={isApplied}
                              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                isApplied
                                  ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-slate-100 text-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              무시하기
                            </button>
                            <button
                              onClick={() => onApplyFix(review.id)}
                              disabled={isApplied}
                              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                isApplied
                                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
                              }`}
                            >
                              {isApplied ? "패치 반영됨" : "AI 패치 적용"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
