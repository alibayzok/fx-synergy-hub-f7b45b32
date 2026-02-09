import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  MessageSquare, 
  Lock, 
  Settings, 
  DoorOpen,
  Clock,
  CheckCircle2,
  GraduationCap,
  DollarSign,
  Newspaper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommunityRoom, useRoomManagement, RoomMember } from '@/hooks/useRoomManagement';
import { useAuth } from '@/hooks/useAuth';

interface RoomCardProps {
  room: CommunityRoom;
  onClick?: () => void;
  onManage?: () => void;
  isLocked?: boolean;
  memberStatus?: RoomMember['status'] | 'none' | 'pending_request';
  membersCount?: number;
}

const roomIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  general: MessageSquare,
  learning: GraduationCap,
  vip: Crown,
  usdt: DollarSign,
  news: Newspaper,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Crown: Crown,
  DollarSign: DollarSign,
  Newspaper: Newspaper,
};

const roomColors: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  red: 'bg-red-500/10 text-red-500',
};

export const RoomCard = ({ 
  room, 
  onClick, 
  onManage,
  isLocked = false,
  memberStatus = 'none',
  membersCount = 0
}: RoomCardProps) => {
  const { i18n } = useTranslation();
  const { isAdmin, isVip } = useAuth();
  const isArabic = i18n.language === 'ar';
  
  const Icon = roomIcons[room.icon] || roomIcons[room.id] || MessageSquare;
  const colorClass = roomColors[room.color] || 'bg-primary/10 text-primary';
  
  const name = isArabic ? room.name_ar : room.name;
  const description = isArabic ? room.description_ar : room.description;

  const showManageButton = isAdmin && onManage;
  const isVipRoom = room.is_private;
  const canAccess = !isVipRoom || isVip || isAdmin || memberStatus === 'approved';

  const getStatusBadge = () => {
    switch (memberStatus) {
      case 'pending':
      case 'pending_request':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] px-1.5 gap-1">
            <Clock className="w-3 h-3" />
            {isArabic ? 'قيد الانتظار' : 'Pending'}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-profit/10 text-profit border-profit/30 text-[10px] px-1.5 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {isArabic ? 'عضو' : 'Member'}
          </Badge>
        );
      case 'banned':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] px-1.5">
            {isArabic ? 'محظور' : 'Banned'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border transition-all",
        isVipRoom 
          ? "bg-gradient-to-r from-vip/10 to-transparent border-vip/30" 
          : "bg-card/50 border-border/30",
        !canAccess && "opacity-60"
      )}
    >
      <button
        onClick={canAccess ? onClick : undefined}
        disabled={!canAccess}
        className={cn(
          "flex-1 flex items-center gap-3 text-start",
          canAccess ? "cursor-pointer" : "cursor-not-allowed"
        )}
      >
        <div className={cn("flex-shrink-0 p-2.5 rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-foreground truncate">{name}</h4>
            {isVipRoom && (
              <Badge variant="outline" className="bg-vip/10 text-vip border-vip/30 text-[10px] px-1.5">
                VIP
              </Badge>
            )}
            {getStatusBadge()}
            {!canAccess && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span className="trading-number">{membersCount}</span>
        </div>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {showManageButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onManage?.();
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
        
        {room.requires_approval && memberStatus === 'none' && !isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <DoorOpen className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Legacy compatibility wrapper
interface LegacyRoom {
  id: string;
  type: 'general' | 'learning' | 'vip' | 'usdt' | 'news';
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  members_count: number;
  is_vip: boolean;
  last_activity: string;
}

interface LegacyRoomCardProps {
  room: LegacyRoom;
  onClick?: () => void;
  isLocked?: boolean;
}

export const LegacyRoomCard = ({ room, onClick, isLocked = false }: LegacyRoomCardProps) => {
  const { i18n } = useTranslation();
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
