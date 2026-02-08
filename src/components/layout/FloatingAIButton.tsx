import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FloatingAIButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on AI chat page
  if (location.pathname === '/ai-chat') {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/ai-chat')}
      className={cn(
        "fixed bottom-20 right-4 z-50",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-primary to-primary/70",
        "flex items-center justify-center",
        "shadow-lg shadow-primary/30",
        "hover:shadow-xl hover:shadow-primary/40",
        "transition-shadow duration-300"
      )}
    >
      <Bot className="w-6 h-6 text-white" />
    </motion.button>
  );
};
