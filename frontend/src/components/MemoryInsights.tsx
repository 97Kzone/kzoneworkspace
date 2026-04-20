import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Tag, 
  Star, 
  Filter, 
  ChevronRight, 
  Clock, 
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Memory } from '../app/apiService';

interface MemoryInsightsProps {
  memories: Memory[];
  getAgentColor: (name: string) => { bg: string; text: string; border: string; soft: string };
}

export const MemoryInsights = ({ memories, getAgentColor }: MemoryInsightsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [minImportance, setMinImportance] = useState(0);

  // 태그 추출 및 빈도 계산
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    memories.forEach(m => {
      if (m.tags) {
        m.tags.split(',').forEach(tag => {
          const t = tag.trim();
          if (t) stats[t] = (stats[t] || 0) + 1;
        });
      }
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [memories]);

  // 필터링된 메모리
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (m.tags?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || m.tags?.includes(selectedTag);
      const matchesImportance = m.importance >= minImportance;
      return matchesSearch && matchesTag && matchesImportance;
    }).sort((a, b) => b.importance - a.importance || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [memories, searchQuery, selectedTag, minImportance]);

  // 주요 지식 (중요도 8 이상)
  const essentialKnowledge = useMemo(() => {
    return memories.filter(m => m.importance >= 8)
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                   .slice(0, 3);
  }, [memories]);

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Header Section */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Brain size={32} className="text-indigo-600" />
            MEMORY INSIGHTS
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 opacity-70">
            에이전트가 수집한 핵심 지식 및 사용자 선호도 분석
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total Knowledge</span>
            <span className="text-2xl font-black text-indigo-600 leading-none">{memories.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Filters */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Essential Knowledge Cards */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              Essential Knowledge
            </h3>
            <div className="space-y-4">
              {essentialKnowledge.length > 0 ? essentialKnowledge.map((ek, idx) => (
                <motion.div 
                  key={ek.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors group cursor-default"
                >
                  <p className="text-sm font-bold leading-relaxed mb-2 line-clamp-2">{ek.content}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${getAgentColor(ek.agentName).soft}`}>
                      {ek.agentName}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < ek.importance / 2 ? 'bg-indigo-400' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <p className="text-xs text-slate-500 font-bold text-center py-4 italic">아직 중요한 지식이 발견되지 않았습니다.</p>
              )}
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Tag size={14} />
              Hot Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${!selectedTag ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                ALL
              </button>
              {tagStats.map(([tag, count]) => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${selectedTag === tag ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {tag}
                  <span className={`text-[8px] px-1 rounded-md ${selectedTag === tag ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="지식 내용 또는 태그 검색..."
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 px-6 bg-slate-50 rounded-2xl border border-transparent">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0">Min Importance</span>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1"
                className="w-24 accent-indigo-600"
                value={minImportance}
                onChange={(e) => setMinImportance(parseInt(e.target.value))}
              />
              <span className="w-6 text-sm font-black text-indigo-600 text-center">{minImportance}</span>
            </div>
          </div>

          {/* Memory List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode='popLayout'>
              {filteredMemories.map((m, i) => (
                <motion.div 
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getAgentColor(m.agentName).soft}`}>
                          {m.agentName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 leading-relaxed mb-4 group-hover:text-indigo-600 transition-colors">
                        {m.content}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {m.tags?.split(',').map((tag, idx) => (
                          <span key={idx} className="bg-slate-50 text-slate-500 text-[9px] font-black px-2 py-1 rounded-md border border-slate-100 uppercase">
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Impact</span>
                      <span className={`text-xl font-black ${m.importance >= 8 ? 'text-rose-500' : m.importance >= 5 ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {m.importance}
                      </span>
                      <div className="w-10 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${m.importance >= 8 ? 'bg-rose-500' : m.importance >= 5 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${m.importance * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredMemories.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-50">
                <AlertCircle size={48} strokeWidth={1} className="mb-4" />
                <p className="font-black uppercase tracking-widest">No matching knowledge found</p>
                <p className="text-xs font-bold mt-1">검색어나 필터를 조정해 보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
