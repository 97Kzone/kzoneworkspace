'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Calendar, 
  TrendingUp, 
  BrainCircuit, 
  Users, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Search,
  RefreshCw
} from 'lucide-react';
import { swarmJournalService, SwarmJournal } from '@/app/apiService';
import ReactMarkdown from 'react-markdown';

export default function SwarmJournalDashboard() {
  const [journals, setJournals] = useState<SwarmJournal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const res = await swarmJournalService.getAll();
      setJournals(res.data);
      if (res.data.length > 0) setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch journals', err);
    } finally {
      setLoading(false);
    }
  };

  const generateToday = async () => {
    setLoading(true);
    try {
      await swarmJournalService.generate();
      await fetchJournals();
    } catch (err) {
      console.error('Failed to generate journal', err);
    } finally {
      setLoading(false);
    }
  };

  const nextJournal = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const prevJournal = () => {
    if (currentIndex < journals.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentJournal = journals[currentIndex];

  if (loading && journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={40} />
        </motion.div>
        <p className="text-sm font-medium animate-pulse">군집의 기록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
            <Book size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hive Daily Journal</h1>
            <p className="text-slate-400 text-sm font-medium">군집의 진화 과정과 일일 활동 기록</p>
          </div>
        </div>
        
        <button 
          onClick={generateToday}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Sparkles size={16} />
          {loading ? '기록 생성 중...' : '오늘의 일지 생성'}
        </button>
      </div>

      {!currentJournal ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-20 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
            <Search size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">아직 기록된 일지가 없습니다.</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              군집의 활동을 수집하여 첫 번째 일지를 작성해 보세요. 에이전트들이 수행한 모든 작업이 이곳에 기록됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJournal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
              >
                {/* Journal Header Image/Pattern */}
                <div className="h-32 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 relative">
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white flex items-center gap-2">
                      <Calendar size={14} />
                      {currentJournal.journalDate}
                    </div>
                    <div className="px-4 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-full text-xs font-bold text-indigo-300 flex items-center gap-2">
                      <TrendingUp size={14} />
                      {currentJournal.sentiment}
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Summary Section */}
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white leading-tight">
                      {currentJournal.summary}
                    </h2>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-li:text-slate-300">
                    <ReactMarkdown>{currentJournal.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Stats Cards */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Daily Swarm Metrics</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasks Done</p>
                      <p className="text-xl font-black text-white">{currentJournal.taskCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <BrainCircuit size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Memories Formed</p>
                      <p className="text-xl font-black text-white">{currentJournal.memoryCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Neural Resonances</p>
                      <p className="text-xl font-black text-white">{currentJournal.resonanceCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Synergy Score</p>
                      <p className="text-xl font-black text-white">{currentJournal.synergyScore}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
              <button 
                onClick={prevJournal}
                disabled={currentIndex === journals.length - 1}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry</p>
                <p className="text-sm font-black text-white">{journals.length - currentIndex} / {journals.length}</p>
              </div>

              <button 
                onClick={nextJournal}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
