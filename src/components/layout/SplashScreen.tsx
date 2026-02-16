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
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1000);
    const t3 = setTimeout(() => setPhase(3), 1600);
    const t4 = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 700);
    }, 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: '#050508' }}
        >
          {/* Multi-layered background */}
          <div className="absolute inset-0">
            {splashBgUrl && (
              <img src={splashBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
            )}

            {/* Deep ambient glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 80% 50% at 50% 45%, rgba(212,175,55,0.08) 0%, transparent 70%),
                  radial-gradient(ellipse 60% 40% at 50% 55%, rgba(180,140,20,0.06) 0%, transparent 60%)
                `,
              }}
            />

            {/* Animated light rays */}
            <motion.div
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 0.12, rotate: 360 }}
              transition={{ opacity: { duration: 2 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 600,
                height: 600,
                background: `conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  rgba(212,175,55,0.15) 30deg,
                  transparent 60deg,
                  transparent 120deg,
                  rgba(212,175,55,0.1) 150deg,
                  transparent 180deg,
                  transparent 240deg,
                  rgba(212,175,55,0.12) 270deg,
                  transparent 300deg
                )`,
                filter: 'blur(40px)',
              }}
            />

            {/* Expanding rings */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{
                  opacity: [0, 0.2, 0],
                  scale: [0.2, 1.8 + i * 0.4, 2.5 + i * 0.4],
                }}
                transition={{
                  duration: 3.5,
                  delay: 0.3 + i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  ease: 'easeOut',
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  border: `1px solid rgba(212,175,55,${0.25 - i * 0.05})`,
                  boxShadow: `0 0 20px rgba(212,175,55,${0.08 - i * 0.02})`,
                }}
              />
            ))}

            {/* Floating gold particles */}
            {[...Array(30)].map((_, i) => {
              const size = 1.5 + Math.random() * 3;
              const startX = 5 + Math.random() * 90;
              const startY = Math.random() * 100;
              const duration = 4 + Math.random() * 4;
              const delay = Math.random() * 3;
              const brightness = 0.3 + Math.random() * 0.7;
              return (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ opacity: 0, y: `${startY}vh` }}
                  animate={{
                    opacity: [0, brightness, brightness * 0.5, 0],
                    y: [`${startY}vh`, `${startY - 30 - Math.random() * 40}vh`],
                    x: [0, (Math.random() - 0.5) * 60],
                  }}
                  transition={{
                    duration,
                    delay,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${startX}%`,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(245,215,110,${brightness}) 0%, rgba(212,175,55,${brightness * 0.6}) 100%)`,
                    boxShadow: `0 0 ${size * 2}px rgba(212,175,55,${brightness * 0.4})`,
                  }}
                />
              );
            })}

            {/* Horizontal light sweep */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '200%', opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.5, delay: 1, ease: 'easeInOut' }}
              className="absolute top-1/2 -translate-y-1/2 w-[40%] h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.8), transparent)',
                boxShadow: '0 0 30px 10px rgba(212,175,55,0.15)',
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-8">

            {/* Logo with layered premium effects */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.15 }}
              className="relative"
              style={{ perspective: 1000 }}
            >
              {/* Multi-layer glow */}
              <motion.div
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-8 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 50%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              {/* Spinning border ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(212,175,55,0.7) 15%, transparent 30%, transparent 50%, rgba(212,175,55,0.5) 65%, transparent 80%)',
                  filter: 'blur(1px)',
                }}
              />
              
              {/* Secondary counter-rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3.5 rounded-full"
                style={{
                  border: '1px solid rgba(212,175,55,0.15)',
                }}
              />

              {/* Logo container with depth */}
              <div
                className="relative w-40 h-40 rounded-full overflow-hidden"
                style={{
                  border: '2px solid rgba(212,175,55,0.5)',
                  boxShadow: `
                    0 0 60px rgba(212,175,55,0.25),
                    0 0 120px rgba(212,175,55,0.1),
                    inset 0 0 40px rgba(0,0,0,0.6),
                    inset 0 -20px 40px rgba(212,175,55,0.1)
                  `,
                  background: 'linear-gradient(180deg, #0d0d14, #080810)',
                }}
              >
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
                {/* Shine sweep on logo */}
                <motion.div
                  initial={{ x: '-120%' }}
                  animate={{ x: '220%' }}
                  transition={{ duration: 1.5, delay: 1.2, ease: 'easeInOut' }}
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                  }}
                />
              </div>
            </motion.div>

            {/* Title with reveal animation */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center"
            >
              <h1
                className="text-5xl font-black tracking-wider mb-3"
                style={{
                  background: 'linear-gradient(135deg, #c5a028 0%, #f5d76e 25%, #d4af37 50%, #f5d76e 75%, #c5a028 100%)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 12px rgba(212,175,55,0.35))',
                  animation: 'shimmer 4s ease-in-out infinite',
                }}
              >
                {appName}
              </h1>

              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={phase >= 1 ? { scaleX: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="mx-auto mb-3 h-[1px] w-32"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
                }}
              />

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="text-sm font-medium tracking-[0.3em]"
                style={{ color: 'rgba(212,175,55,0.55)' }}
              >
                مجتمع التداول الاحترافي
              </motion.p>
            </motion.div>

            {/* Premium progress indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4 mt-2"
            >
              {/* Progress bar */}
              <div
                className="relative w-48 h-[2px] rounded-full overflow-hidden"
                style={{ background: 'rgba(212,175,55,0.1)' }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={phase >= 2 ? { width: '100%' } : {}}
                  transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(212,175,55,0.3), #d4af37, rgba(212,175,55,0.3))',
                    boxShadow: '0 0 10px rgba(212,175,55,0.4)',
                  }}
                />
                {/* Glow dot on progress tip */}
                <motion.div
                  initial={{ left: '0%' }}
                  animate={phase >= 2 ? { left: '100%' } : {}}
                  transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: '#f5d76e',
                    boxShadow: '0 0 8px 3px rgba(212,175,55,0.5)',
                  }}
                />
              </div>

              {/* Loading text */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : {}}
                transition={{ duration: 0.4 }}
                className="text-[11px] tracking-[0.2em] font-light"
                style={{ color: 'rgba(212,175,55,0.35)' }}
              >
                جاري التحميل...
              </motion.span>
            </motion.div>
          </div>

          {/* Bottom branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 3 ? { opacity: 0.35, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="absolute bottom-8 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ background: '#d4af37' }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.3, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <span
              className="text-[10px] tracking-[0.35em] font-light uppercase"
              style={{ color: 'rgba(212,175,55,0.3)' }}
            >
              Professional Trading Community
            </span>
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