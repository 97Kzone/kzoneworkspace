import { motion } from "framer-motion";

/**
 * 에이전트의 현재 감정 상태를 이모지로 표시하는 작은 거품 컴포넌트
 */
export const EmotionBubble = ({ emotion }: { emotion: string }) => {
  return (
    <motion.div
      initial={{ scale: 0, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white px-2 py-1 rounded-full shadow-lg border border-slate-100 flex items-center justify-center pointer-events-none"
    >
      <span className="text-xs" title="에이전트 감정">{emotion}</span>
    </motion.div>
  );
};
