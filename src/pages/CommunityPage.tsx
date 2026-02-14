import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, Megaphone, MessageSquare, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LegacyRoomCard } from '@/components/community/RoomCard';
import { RoomChatPanel } from '@/components/community/RoomChatPanel';
import { RoomModerationPanel } from '@/components/community/RoomModerationPanel';
import { LearningRoomPanel } from '@/components/community/LearningRoomPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommunityRooms, RoomWithCounts } from '@/hooks/useCommunityRooms';
import { cn } from '@/lib/utils';

type TabKey = 'channels' | 'discussions' | 'learning';

type ViewMode = 'list' | 'chat' | 'learning' | 'moderation';

const TABS: { key: TabKey; icon: typeof Megaphone; labelAr: string; labelEn: string }[] = [
  { key: 'channels', icon: Megaphone, labelAr: 'القنوات', labelEn: 'Channels' },
  { key: 'discussions', icon: MessageSquare, labelAr: 'النقاشات', labelEn: 'Discussions' },
  { key: 'learning', icon: GraduationCap, labelAr: 'التعليم', labelEn: 'Learning' },
];

const CommunityPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('channels');

  const { user, isVip, isAdmin, loading: authLoading } = useAuth();
  const { rooms, loading: roomsLoading, markRoomAsRead } = useCommunityRooms();
  const isArabic = i18n.language === 'ar';
  const isVipUser = isVip || isAdmin;

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  const channels = rooms.filter(r => r.category === 'channels');
  const discussions = rooms.filter(r => r.category === 'discussions');
  const learningRooms = rooms.filter(r => r.category === 'learning');

  const unreadMap: Record<TabKey, number> = {
    channels: channels.reduce((s, r) => s + r.unread_count, 0),
    discussions: discussions.reduce((s, r) => s + r.unread_count, 0),
    learning: learningRooms.reduce((s, r) => s + r.unread_count, 0),
  };

  const roomsMap: Record<TabKey, RoomWithCounts[]> = { channels, discussions, learning: learningRooms };
  const emptyMap: Record<TabKey, string> = {
    channels: isArabic ? 'لا توجد قنوات حالياً' : 'No channels yet',
    discussions: isArabic ? 'لا توجد نقاشات حالياً' : 'No discussions yet',
    learning: isArabic ? 'لا توجد غرف تعليم حالياً' : 'No learning rooms yet',
  };

  // Sliding indicator
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const activeIndex = TABS.findIndex(t => t.key === activeTab);

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeIndex]);

  const handleRoomClick = (room: RoomWithCounts) => {
    if (room.is_private && !isVipUser) {
      toast({
        title: t('community.vipOnly'),
        description: t('community.upgradeToAccess'),
        variant: 'destructive'
      });
      return;
    }
    setSelectedRoomId(room.id);
    markRoomAsRead(room.id);
    if (room.id === 'learning') {
      setViewMode('learning');
    } else {
      setViewMode('chat');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRoomId(null);
  };

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

  if (viewMode === 'learning') {
    return <AppLayout><LearningRoomPanel onBack={handleBackToList} /></AppLayout>;
  }

  if (viewMode === 'chat' && selectedRoom) {
    return (
      <AppLayout>
        <RoomChatPanel
          roomId={selectedRoom.id}
          roomName={isArabic ? selectedRoom.name_ar : selectedRoom.name}
          onBack={handleBackToList}
          onManage={() => setViewMode('moderation')}
          isBroadcast={selectedRoom.is_broadcast}
        />
      </AppLayout>
    );
  }

  if (viewMode === 'moderation' && selectedRoom) {
    return (
      <AppLayout>
        <RoomModerationPanel
          roomId={selectedRoom.id}
          roomName={isArabic ? selectedRoom.name_ar : selectedRoom.name}
          onBack={() => setViewMode('chat')}
        />
      </AppLayout>
    );
  }

  const renderRoomCard = (room: RoomWithCounts, index: number) => (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <LegacyRoomCard
        room={{
          id: room.id,
          type: room.id as any,
          name_ar: room.name_ar,
          name_en: room.name,
          description_ar: room.description_ar || '',
          description_en: room.description || '',
          members_count: room.members_count,
          is_vip: room.is_private,
          is_broadcast: room.is_broadcast,
          last_activity: '',
        }}
        isLocked={room.is_private && !isVipUser}
        unreadCount={room.unread_count}
        onClick={() => handleRoomClick(room)}
      />
    </motion.div>
  );

  const currentRooms = roomsMap[activeTab];

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
        </div>
      </header>

      {roomsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
          {/* Custom Tab Bar */}
          <div className="px-4 pt-3 pb-1">
            <div className="relative flex items-center bg-muted/60 rounded-xl p-1">
              {/* Sliding indicator */}
              <span
                className="absolute top-1 bottom-1 rounded-lg bg-primary shadow-md transition-all duration-300 ease-out"
                style={{
                  [isArabic ? 'right' : 'left']: indicator.left,
                  width: indicator.width,
                }}
              />

              {TABS.map((tab, i) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                const unread = unreadMap[tab.key];
                return (
                  <button
                    key={tab.key}
                    ref={el => { tabRefs.current[i] = el; }}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-200',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                    {unread > 0 && (
                      <span className={cn(
                        'min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-destructive text-destructive-foreground'
                      )}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content with fade animation */}
          <div className="flex-1 px-4 py-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-2"
            >
              {currentRooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{emptyMap[activeTab]}</p>
              ) : (
                currentRooms.map((room, i) => renderRoomCard(room, i))
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default CommunityPage;
