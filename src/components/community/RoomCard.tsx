import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Crown, MessageSquare, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Room } from '@/types';
import { Badge } from '@/components/ui/badge';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  isLocked?: boolean;
}

const roomIcons = {
  general: MessageSquare,
  learning: MessageSquare,
  vip: Crown,
  usdt: MessageSquare,
  news: MessageSquare,
};

export const RoomCard = ({ room, onClick, isLocked = false }: RoomCardProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const Icon = roomIcons[room.type] || MessageSquare;
  
  const name = isArabic ? room.name_ar : room.name_en;
  const description = isArabic ? room.description_ar : room.description_en;

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border text-start transition-all",
        room.is_vip 
          ? "bg-gradient-to-r from-vip/10 to-transparent border-vip/30" 
          : "bg-card/50 border-border/30",
        isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-card"
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-2.5 rounded-lg",
        room.is_vip ? "bg-vip/20" : "bg-primary/10"
      )}>
        <Icon className={cn(
          "w-5 h-5",
          room.is_vip ? "text-vip" : "text-primary"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground truncate">{name}</h4>
          {room.is_vip && (
            <Badge variant="outline" className="bg-vip/10 text-vip border-vip/30 text-[10px] px-1.5">
              VIP
            </Badge>
          )}
          {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="w-3 h-3" />
        <span className="trading-number">{room.members_count}</span>
      </div>
    </motion.button>
  );
};
