import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { getSetting } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');
  const logoUrl = getSetting('logo_url');
  const splashBgUrl = getSetting('splash_bg_url');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted">
            {splashBgUrl && (
              <img src={splashBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            {/* Animated grid */}
            <div className="absolute inset-0 opacity-20">
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />
            </div>

            {/* Floating orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/4 start-1/4 w-64 h-64 rounded-full blur-3xl"
              style={{ background: 'hsl(var(--primary) / 0.2)' }}
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-1/4 end-1/4 w-80 h-80 rounded-full blur-3xl"
              style={{ background: 'hsl(var(--vip) / 0.15)' }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 20,
                delay: 0.2 
              }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 40px hsl(var(--primary) / 0.4)',
                    '0 0 80px hsl(var(--primary) / 0.6)',
                    '0 0 40px hsl(var(--primary) / 0.4)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full"
              />
              
              {/* Logo container */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary via-primary/80 to-vip flex items-center justify-center border-2 border-primary/30 shadow-2xl overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={appName} className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl font-bold text-primary-foreground">FX</span>
                )}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold gold-gradient mb-2">{appName}</h1>
              <p className="text-muted-foreground text-sm">مجتمع التداول الاحترافي</p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Progress bar */}
              <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </div>
              
              {/* Dots loader */}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-center text-xs text-muted-foreground"
          >
            <p>Professional Trading Community</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
