import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import appLogo from '@/assets/logo-dark.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState(0);
  const { getSetting } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');
  const splashBgUrl = getSetting('splash_bg_url');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1300);
    const t4 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: '#0a0a0f' }}
        >
          {/* Deep background layers */}
          <div className="absolute inset-0">
            {splashBgUrl && (
              <img src={splashBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            
            {/* Radial gold ambient */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 40%, transparent 70%)',
              }}
            />

            {/* Animated ring particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ 
                  opacity: [0, 0.15, 0],
                  scale: [0.3, 1.5 + i * 0.5, 2 + i * 0.5],
                }}
                transition={{
                  duration: 3,
                  delay: 0.5 + i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{
                  width: 200,
                  height: 200,
                  borderColor: `rgba(212,175,55,${0.2 - i * 0.05})`,
                }}
              />
            ))}

            {/* Floating gold dust */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                initial={{ 
                  opacity: 0,
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 800,
                }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  y: [Math.random() * 800, -50],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  width: 2 + Math.random() * 3,
                  height: 2 + Math.random() * 3,
                  borderRadius: '50%',
                  background: `rgba(212,175,55,${0.3 + Math.random() * 0.5})`,
                  filter: 'blur(0.5px)',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            
            {/* Logo with premium glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.2 }}
              className="relative"
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.08, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
                  filter: 'blur(15px)',
                }}
              />
              
              {/* Inner spinning border */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-1 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(212,175,55,0.6), transparent, rgba(212,175,55,0.3), transparent)',
                }}
              />

              {/* Logo container */}
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-[rgba(212,175,55,0.4)]"
                style={{
                  boxShadow: '0 0 40px rgba(212,175,55,0.3), inset 0 0 30px rgba(0,0,0,0.5)',
                  background: '#0d0d12',
                }}
              >
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
              </div>
            </motion.div>

            {/* Title with stagger */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-center"
            >
              <h1
                className="text-4xl font-black tracking-wider mb-2"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #f5d76e, #d4af37, #c5a028)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.4))',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              >
                {appName}
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
                className="text-sm tracking-widest"
                style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '0.25em' }}
              >
                مجتمع التداول الاحترافي
              </motion.p>
            </motion.div>

            {/* Premium loading bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={phase >= 2 ? { opacity: 1, width: 180 } : {}}
              transition={{ duration: 0.5 }}
              className="relative h-[2px] rounded-full overflow-hidden mt-4"
              style={{ background: 'rgba(212,175,55,0.15)' }}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-1/2"
                style={{
                  background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                }}
              />
            </motion.div>

            {/* Elegant dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-3 mt-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#d4af37' }}
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 0.4 } : {}}
            transition={{ duration: 0.5 }}
            className="absolute bottom-8 text-center text-xs tracking-[0.3em]"
            style={{ color: 'rgba(212,175,55,0.4)' }}
          >
            PROFESSIONAL TRADING
          </motion.div>

          <style>{`
            @keyframes shimmer {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
