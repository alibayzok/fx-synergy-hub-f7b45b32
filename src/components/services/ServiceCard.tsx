import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Landmark, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  type: 'broker' | 'usdt';
  onClick?: () => void;
}

const serviceConfig = {
  broker: {
    icon: Landmark,
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  usdt: {
    icon: DollarSign,
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
};

export const ServiceCard = ({ type, onClick }: ServiceCardProps) => {
  const { t } = useTranslation();
  const config = serviceConfig[type];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border text-start transition-all",
        "bg-gradient-to-r hover:opacity-90",
        config.gradient,
        config.border
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-3 rounded-lg bg-card/50",
      )}>
        <Icon className={cn("w-6 h-6", config.iconColor)} />
      </div>

      <div className="flex-1">
        <h4 className="font-semibold text-foreground mb-0.5">{t(`services.${type}`)}</h4>
        <p className="text-sm text-muted-foreground">{t(`services.${type}Desc`)}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
    </motion.button>
  );
};
