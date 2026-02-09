import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors"
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: resolvedTheme === 'dark' ? 0 : 180,
              scale: 1 
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-[18px] w-[18px] text-primary" />
            ) : (
              <Sun className="h-[18px] w-[18px] text-primary" />
            )}
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span>{t('settings.lightMode', 'فاتح')}</span>
          {theme === 'light' && (
            <motion.div 
              layoutId="theme-check"
              className="ms-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>{t('settings.darkMode', 'داكن')}</span>
          {theme === 'dark' && (
            <motion.div 
              layoutId="theme-check"
              className="ms-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="gap-2 cursor-pointer"
        >
          <div className="h-4 w-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border-2 border-current" />
          </div>
          <span>{t('settings.systemMode', 'تلقائي')}</span>
          {theme === 'system' && (
            <motion.div 
              layoutId="theme-check"
              className="ms-auto w-2 h-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
