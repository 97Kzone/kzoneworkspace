import { motion, AnimatePresence } from "framer-motion";
import { Search, Command as CommandIcon, ChevronRight } from "lucide-react";

/**
 * 전역 명령어 및 내비게이션 검색창 (Command+K)
 */
export const CommandPalette = ({
  isOpen,
  onClose,
  actions,
  onAction,
  query,
  onQueryChange
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: { id: string, label: string, icon: any, category: string }[];
  onAction: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) => {
  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  // 카테고리 레이블 한글 매핑
  const categoryLabels: Record<string, string> = {
    'NAVIGATION': '내비게이션',
    'ACTIONS': '빠른 실행',
    'TOOLS': '도구 및 탐색'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.5)] z-[301] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <Search size={24} className="text-indigo-400 animate-pulse" />
              <input
                autoFocus
                type="text"
                placeholder="어떤 기능이나 탭을 찾으시나요? (예: '리뷰', '통계'...)"
                className="bg-transparent border-none outline-none text-xl font-bold text-white placeholder:text-slate-500 w-full"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase">ESC로 닫기</span>
              </div>
            </div>

            <div className="flex-1 max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
              {filteredActions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                  <CommandIcon size={48} />
                  <p className="text-sm font-black uppercase tracking-widest text-left">명령어를 찾을 수 없습니다</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['NAVIGATION', 'ACTIONS', 'TOOLS'].map(cat => {
                    const catActions = filteredActions.filter(a => a.category === cat);
                    if (catActions.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-2">
                        <h4 className="px-4 text-[10px] font-black text-indigo-400/70 uppercase tracking-[0.2em] mb-3 text-left">{categoryLabels[cat] || cat}</h4>
                        <div className="space-y-1">
                          {catActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.id}
                                onClick={() => onAction(action.id)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400 transition-all shadow-lg">
                                    <Icon size={20} />
                                  </div>
                                  <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{action.label}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">실행</span>
                                  <ChevronRight size={14} className="text-indigo-400" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/5 bg-slate-950/40 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-slate-400">↑↓</kbd>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">이동</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-slate-400">ENTER</kbd>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">선택</span>
                    </div>
                </div>
                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    K-Zone 커맨더 v1.0
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
