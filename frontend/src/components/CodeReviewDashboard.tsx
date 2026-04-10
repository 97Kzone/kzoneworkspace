"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Code2, Loader2, Play, Sparkles } from "lucide-react";
import { CodeReviewResult } from "../app/apiService";

interface CodeReviewDashboardProps {
  reviews: CodeReviewResult[];
  isReviewing: boolean;
  onStartReview: () => void;
  onApplyFix: (id: number) => void;
}

export const CodeReviewDashboard: React.FC<CodeReviewDashboardProps> = ({
  reviews,
  isReviewing,
  onStartReview,
  onApplyFix,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              자율 QA 센터
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              AI 기반 코드 시맨틱 결함 분석 서비스
            </p>
          </div>
        </div>
        <button
          onClick={onStartReview}
          disabled={isReviewing}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isReviewing
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-rose-600 shadow-xl active:scale-95"
          }`}
        >
          {isReviewing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {isReviewing ? "분석 중..." : "종합 코드 리뷰 실행"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4 pb-10">
        {reviews.length === 0 && !isReviewing ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
              <Code2 size={40} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest mb-2 text-slate-500">
                지능형 코드 리뷰 대기 중
              </p>
              <p className="text-[11px] font-bold text-slate-400 max-w-sm leading-relaxed">
                에이전트들이 코드베이스를 분석하여 잠재적 버그, 보안 취약점, 성능
                요인을 발견하고 해결책을 제시합니다.
              </p>
            </div>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-lg group hover:border-rose-200 transition-all"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                      review.severity === "CRITICAL"
                        ? "bg-rose-500 text-white"
                        : review.severity === "WARNING"
                        ? "bg-amber-500 text-white"
                        : "bg-indigo-500 text-white"
                    }`}
                  >
                    {review.severity === "CRITICAL"
                      ? "중대"
                      : review.severity === "WARNING"
                      ? "경고"
                      : "정보"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-slate-400" />
                    <span className="text-xs font-mono font-bold text-slate-700 truncate max-w-[200px]">
                      {review.fileName}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(review.generatedAt).toLocaleString()}
                </span>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight uppercase">
                    {review.reason}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                    {review.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">
                      현재 코드
                    </span>
                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner overflow-x-auto">
                      <pre className="text-[11px] font-mono text-rose-300 leading-relaxed">
                        <code>{review.originalSnippet}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] px-2 italic">
                      AI 추천 패치
                    </span>
                    <div className="bg-indigo-900/10 rounded-2xl p-5 border border-indigo-500/20 shadow-inner overflow-x-auto relative">
                      <pre className="text-[11px] font-mono text-indigo-600 leading-relaxed">
                        <code>{review.suggestedFix}</code>
                      </pre>
                      <div className="absolute top-4 right-4">
                        <Sparkles
                          size={16}
                          className="text-indigo-400 animate-pulse"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                  <button className="px-6 py-2.5 rounded-xl border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                    무시하기
                  </button>
                  <button
                    onClick={() => onApplyFix(review.id)}
                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                  >
                    AI 패치 적용
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
