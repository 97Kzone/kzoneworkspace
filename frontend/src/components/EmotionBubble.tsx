import { motion } from "framer-motion";

export const EmotionBubble = ({ 
  emotion, 
  agentName,
  getAgentColor 
}: { 
  emotion: string, 
  agentName: string,
  getAgentColor: (name: string) => any 
}) => {
  const emojis: Record<string, string> = {
    "HAPPY": "🎉",
    "SAD": "😫",
    "THINKING": "🤔",
    "ANGRY": "💢",
    "SUCCESS": "✅",
    "ERROR": "❌"
  };

  return (
    <motion.div
      initial={{ scale: 0, y: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 1], y: -50, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute left-1/2 -translate-x-1/2 z-[100] text-3xl filter drop-shadow-lg"
    >
      {emojis[emotion] || emotion}
    </motion.div>
  );
};
