"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, Calendar, TrendingUp, BrainCircuit, Users, Zap, 
  ChevronLeft, ChevronRight, Sparkles, Search, RefreshCw, 
  FileText, History, Quote, ArrowUpRight, BarChart3
} from 'lucide-react';
import { swarmJournalService, SwarmJournal } from '../app/apiService';
import ReactMarkdown from 'react-markdown';

export const SwarmJournalDashboard: React.FC = () => {
  const [journals, setJournals] = useState<SwarmJournal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await swarmJournalService.getAll();
      // 최신순 정렬
      const sorted = [...res.data].sort((a, b) => 
        new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime()
      );
      setJournals(sorted);
      if (sorted.length > 0) setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch journals', err);
    } finally {
      setLoading(false);
    }
  };

  const generateToday = async () => {
    setIsGenerating(true);
    try {
      await swarmJournalService.generate();
      await fetchJournals();
    } catch (err) {
      console.error('Failed to generate journal', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextJournal = () => {
    if (currentIndex < journals.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prevJournal = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const currentJournal = journals[currentIndex];

  if (loading && journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
        <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">군집의 연대기 아카이브 동기화 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-hidden p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[3rem] border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 border border-white/10">
            <Book size={32} />
          </div>
          <div>
            <h3 className="text-white text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
              Hive Daily Journal
              <span className="text-white/20 font-light">|</span>
              <span className="text-indigo-400">하이브 데일리 저널</span>
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">군집의 진화 과정과 주요 사건에 대한 AI 기반 아카이브</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           <button 
             onClick={generateToday}
             disabled={isGenerating}
             className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-indigo-500/30"
           >
             {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
             {isGenerating ? 'GENERATING...' : 'GENERATE TODAY'}
           </button>
        </div>
      </div>

      {!currentJournal ? (
        <div className="flex-1 bg-white/5 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-slate-500 gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border border-white/5"><Search size={48} strokeWidth={1} /></div>
          <div className="text-center">
            <h4 className="text-white text-lg font-black uppercase tracking-widest mb-2">아직 기록된 일지가 없습니다</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">군집의 첫 번째 활동 일지를 생성하여 아카이브를 시작하세요</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-hidden">
          
          {/* Main Journal Page (Left/Center) */}
          <div className="xl:col-span-8 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJournal.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="flex-1 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative"
              >
                {/* Journal Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
                {/* Date & Sentiment Banner */}
                <div className="h-40 bg-gradient-to-r from-indigo-900/30 via-slate-900/30 to-purple-900/30 relative flex items-end p-10 border-b border-white/5">
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
                         <Calendar size={14} />
                         {currentJournal.journalDate}
                      </div>
                      <div className={`px-4 py-2 backdrop-blur-md border rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest ${
                         currentJournal.sentiment.includes('POSITIVE') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                         <TrendingUp size={14} />
                         {currentJournal.sentiment}
                      </div>
                   </div>
                   <div className="absolute top-10 right-10 opacity-10">
                      <Quote size={80} className="text-white" />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-10 lg:p-14">
                  <div className="max-w-3xl mx-auto space-y-10">
                    {/* Summary Headline */}
                    <header className="space-y-4">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 block">Daily Summary Report</span>
                      <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight italic">
                        {currentJournal.summary}
                      </h2>
                    </header>

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                    {/* Markdown Body */}
                    <article className="prose prose-invert max-w-none 
                      prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium
                      prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                      prose-strong:text-indigo-400 prose-strong:font-black
                      prose-li:text-slate-400 prose-li:font-medium
                      prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-r-2xl prose-blockquote:p-6
                    ">
                      <ReactMarkdown>{currentJournal.content}</ReactMarkdown>
                    </article>
                    
                    <div className="pt-10 flex items-center gap-4 text-slate-600 italic">
                       <FileText size={16} />
                       <span className="text-xs font-bold">End of Log — Synchronized at {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stats & Navigation Sidebar (Right) */}
          <div className="xl:col-span-4 flex flex-col gap-8 overflow-y-auto custom-scrollbar-dark pr-2">
            {/* Stats Overview */}
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 space-y-8 shadow-xl">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-400" />
                Collective Metrics
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Tasks Done", val: currentJournal.taskCount, icon: <Zap size={18} />, color: "text-blue-400", bg: "bg-blue-400/10" },
                  { label: "Memories Formed", val: currentJournal.memoryCount, icon: <BrainCircuit size={18} />, color: "text-purple-400", bg: "bg-purple-400/10" },
                  { label: "Resonances", val: currentJournal.resonanceCount, icon: <Sparkles size={18} />, color: "text-pink-400", bg: "bg-pink-400/10" },
                  { label: "Synergy Score", val: currentJournal.synergyScore, icon: <Users size={18} />, color: "text-orange-400", bg: "bg-orange-400/10" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-black/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                        <p className="text-2xl font-black text-white italic">{stat.val}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-700 group-hover:text-white transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6 shadow-xl">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <History size={16} className="text-indigo-400" />
                 Archive Navigation
               </h4>
               
               <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={prevJournal}
                    disabled={currentIndex === journals.length - 1}
                    className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Archive Entry</p>
                    <p className="text-lg font-black text-white italic leading-none">{journals.length - currentIndex} <span className="text-slate-600 text-xs font-bold not-italic mx-1">/</span> {journals.length}</p>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={nextJournal}
                    disabled={currentIndex === 0}
                    className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
               </div>
               
               <p className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-tighter italic">
                  * 각 기록은 군집의 지식 베이스(Memory)에 영구 저장됩니다.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
