import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export const DailyBriefingModal = ({ 
  isOpen, 
  onClose, 
  content, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  content: string; 
  isLoading: boolean;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            className="bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col w-full max-w-3xl h-[80vh] border border-white/40"
          >
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">에이전트 데일리 브리핑</h3>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-[0.2em] opacity-80">지난 24시간 활동 및 지식 요약</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                    <motion.div 
                      className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20"
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-500 animate-pulse">에이전트들이 보고서를 작성하고 있습니다...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-indigo-600 prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50/30 prose-blockquote:py-1 prose-blockquote:px-4">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
            
            <div className="px-10 py-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                Gemini 2.0 Flash 분석 완료
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200"
              >
                확인했습니다
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
