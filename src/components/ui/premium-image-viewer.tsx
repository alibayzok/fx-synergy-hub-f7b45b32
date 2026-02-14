import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumImageViewerProps {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
  glowColor?: string;
  actions?: React.ReactNode;
}

export const PremiumImageViewer = ({
  src,
  alt = '',
  open,
  onClose,
  glowColor = 'hsl(var(--primary))',
  actions,
}: PremiumImageViewerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Swipe to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.3, 1, 0.3]);
  const scale = useTransform(y, [-200, 0, 200], [0.85, 1, 0.85]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
      onClose();
    }
  }, [onClose]);

  const handleDoubleClick = useCallback(() => {
    setZoomed(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setZoomed(false);
    setIsLoaded(false);
    onClose();
  }, [onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.15 }}
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="absolute top-4 end-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Zoom indicator */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            onClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
            className="absolute top-4 start-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </motion.button>

          {/* Image container */}
          <div ref={constraintsRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Loading spinner */}
            {!isLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: glowColor, borderRightColor: glowColor }}
                  />
                  <Loader2 className="w-6 h-6 text-white/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
              </motion.div>
            )}

            {/* Glow ring behind image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isLoaded ? 0.4 : 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute rounded-2xl blur-2xl"
              style={{
                width: '70%',
                maxWidth: 500,
                aspectRatio: '1',
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
            />

            {/* The image */}
            <motion.img
              src={src}
              alt={alt}
              onLoad={() => setIsLoaded(true)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              drag={!zoomed ? 'y' : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.8}
              onDragEnd={handleDragEnd}
              style={!zoomed ? { y, opacity, scale } : {}}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{
                scale: zoomed ? 2 : 1,
                opacity: isLoaded ? 1 : 0,
              }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                "relative max-w-[90%] max-h-[75vh] object-contain rounded-2xl shadow-2xl select-none",
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in touch-none"
              )}
            />
          </div>

          {/* Actions slot (e.g., change/delete buttons) */}
          {actions && isLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                {actions}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
