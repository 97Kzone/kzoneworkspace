/**
 * 에이전트 이름에 따라 고유한 색상 테마를 반환하는 유틸리티
 */
export const getAgentColor = (name: string) => {
    const n = name.toLowerCase();
    
    // 에이전트별 전용 색상 셋업
    if (n.includes('analyst')) return { bg: 'bg-indigo-600', soft: 'text-indigo-400', border: 'border-indigo-500/30' };
    if (n.includes('coder') || n.includes('dev')) return { bg: 'bg-emerald-600', soft: 'text-emerald-400', border: 'border-emerald-500/30' };
    if (n.includes('researcher')) return { bg: 'bg-amber-600', soft: 'text-amber-400', border: 'border-amber-500/30' };
    if (n.includes('janitor')) return { bg: 'bg-rose-600', soft: 'text-rose-400', border: 'border-rose-500/30' };
    if (n.includes('qa') || n.includes('reviewer')) return { bg: 'bg-violet-600', soft: 'text-violet-400', border: 'border-violet-500/30' };
    
    // 기본 색상 (Fallback)
    const colors = [
      { bg: 'bg-slate-700', soft: 'text-slate-400', border: 'border-slate-500/30' },
      { bg: 'bg-blue-600', soft: 'text-blue-400', border: 'border-blue-500/30' },
      { bg: 'bg-purple-600', soft: 'text-purple-400', border: 'border-purple-500/30' },
      { bg: 'bg-teal-600', soft: 'text-teal-400', border: 'border-teal-500/30' },
    ];
    
    const index = name.length % colors.length;
    return colors[index];
  };
