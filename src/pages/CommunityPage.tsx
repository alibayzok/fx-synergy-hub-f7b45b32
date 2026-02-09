import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, MessageCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoomCard, LegacyRoomCard } from '@/components/community/RoomCard';
import { RoomChatPanel } from '@/components/community/RoomChatPanel';
import { RoomModerationPanel } from '@/components/community/RoomModerationPanel';
import { UsdtRoomPanel } from '@/components/community/UsdtRoomPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'list' | 'chat' | 'usdt' | 'moderation';

// Static rooms data
const roomsData = [
  {
    id: 'general',
    type: 'general' as const,
    name_ar: 'المناقشات العامة',
    name_en: 'General Discussion',
    description_ar: 'مناقشات عامة حول التداول والأسواق',
    description_en: 'General discussions about trading and markets',
    members_count: 1250,
    is_vip: false,
    last_activity: new Date().toISOString(),
  },
  {
    id: 'learning',
    type: 'learning' as const,
    name_ar: 'التعلم والتطوير',
    name_en: 'Learning & Development',
    description_ar: 'دروس ونصائح للمبتدئين والمحترفين',
    description_en: 'Lessons and tips for beginners and pros',
    members_count: 890,
    is_vip: false,
    last_activity: new Date().toISOString(),
  },
  {
    id: 'vip',
    type: 'vip' as const,
    name_ar: 'غرفة VIP',
    name_en: 'VIP Room',
    description_ar: 'مناقشات حصرية لأعضاء VIP',
    description_en: 'Exclusive discussions for VIP members',
    members_count: 156,
    is_vip: true,
    last_activity: new Date().toISOString(),
  },
  {
    id: 'usdt',
    type: 'usdt' as const,
    name_ar: 'تبادل USDT',
    name_en: 'USDT Exchange',
    description_ar: 'طلبات بيع وشراء USDT',
    description_en: 'USDT buy and sell requests',
    members_count: 432,
    is_vip: false,
    last_activity: new Date().toISOString(),
  },
  {
    id: 'news',
    type: 'news' as const,
    name_ar: 'مناقشة الأخبار',
    name_en: 'News Discussion',
    description_ar: 'مناقشة آخر أخبار السوق',
    description_en: 'Discuss latest market news',
    members_count: 678,
    is_vip: false,
    last_activity: new Date().toISOString(),
  },
];

const CommunityPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRoom, setSelectedRoom] = useState<typeof roomsData[0] | null>(null);

  const { user, isVip, isAdmin, loading: authLoading } = useAuth();
  const isArabic = i18n.language === 'ar';
  const isVipUser = isVip || isAdmin;

  const handleRoomClick = (room: typeof roomsData[0]) => {
    if (room.is_vip && !isVipUser) {
      toast({
        title: t('community.vipOnly'),
        description: t('community.upgradeToAccess'),
        variant: 'destructive'
      });
      return;
    }
    setSelectedRoom(room);
    if (room.id === 'usdt') {
      setViewMode('usdt');
    } else {
      setViewMode('chat');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRoom(null);
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <header className="sticky top-0 z-40 glass-card border-b border-border/30">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{t('auth.login')}</h2>
            <p className="text-muted-foreground">{t('auth.loginPrompt')}</p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Show USDT panel
  if (viewMode === 'usdt') {
    return (
      <AppLayout>
        <UsdtRoomPanel onBack={handleBackToList} />
      </AppLayout>
    );
  }

  // Show chat panel
  if (viewMode === 'chat' && selectedRoom) {
    const handleOpenModeration = () => {
      setViewMode('moderation');
    };
    
    return (
      <AppLayout>
        <RoomChatPanel
          roomId={selectedRoom.id}
          roomName={isArabic ? selectedRoom.name_ar : selectedRoom.name_en}
          onBack={handleBackToList}
          onManage={handleOpenModeration}
        />
      </AppLayout>
    );
  }

  // Show moderation panel
  if (viewMode === 'moderation' && selectedRoom) {
    return (
      <AppLayout>
        <RoomModerationPanel
          roomId={selectedRoom.id}
          roomName={isArabic ? selectedRoom.name_ar : selectedRoom.name_en}
          onBack={() => setViewMode('chat')}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="space-y-3">
          {roomsData.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <LegacyRoomCard 
                room={room} 
                isLocked={room.is_vip && !isVipUser}
                onClick={() => handleRoomClick(room)}
              />
            </motion.div>
          ))}

          {/* Chat hint */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{t('community.chatHint')}</h4>
                <p className="text-sm text-muted-foreground">{t('community.chatHintDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CommunityPage;
