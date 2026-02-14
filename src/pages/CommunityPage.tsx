import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, Megaphone, MessageSquare, GraduationCap } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LegacyRoomCard } from '@/components/community/RoomCard';
import { RoomChatPanel } from '@/components/community/RoomChatPanel';
import { RoomModerationPanel } from '@/components/community/RoomModerationPanel';
import { LearningRoomPanel } from '@/components/community/LearningRoomPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommunityRooms, RoomWithCounts } from '@/hooks/useCommunityRooms';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'chat' | 'learning' | 'moderation';

const CommunityPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const { user, isVip, isAdmin, loading: authLoading } = useAuth();
  const { rooms, loading: roomsLoading, markRoomAsRead } = useCommunityRooms();
  const isArabic = i18n.language === 'ar';
  const isVipUser = isVip || isAdmin;

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  const channels = rooms.filter(r => r.category === 'channels');
  const discussions = rooms.filter(r => r.category === 'discussions');
  const learningRooms = rooms.filter(r => r.category === 'learning');

  const channelsUnread = channels.reduce((s, r) => s + r.unread_count, 0);
  const discussionsUnread = discussions.reduce((s, r) => s + r.unread_count, 0);
  const learningUnread = learningRooms.reduce((s, r) => s + r.unread_count, 0);

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

  const UnreadBadge = ({ count }: { count: number }) => {
    if (count <= 0) return null;
    return (
      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 trading-number">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

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
        <Tabs defaultValue="channels" className="flex-1 flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="px-4 pt-3">
            <TabsList className="w-full grid grid-cols-3 h-11">
              <TabsTrigger value="channels" className="gap-1.5 text-xs">
                <Megaphone className="w-3.5 h-3.5" />
                {isArabic ? 'القنوات' : 'Channels'}
                <UnreadBadge count={channelsUnread} />
              </TabsTrigger>
              <TabsTrigger value="discussions" className="gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" />
                {isArabic ? 'النقاشات' : 'Discussions'}
                <UnreadBadge count={discussionsUnread} />
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-1.5 text-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                {isArabic ? 'التعليم' : 'Learning'}
                <UnreadBadge count={learningUnread} />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="channels" className="flex-1 px-4 py-3 mt-0">
            <div className="space-y-2">
              {channels.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد قنوات حالياً' : 'No channels yet'}</p>
              ) : (
                channels.map((room, i) => renderRoomCard(room, i))
              )}
            </div>
          </TabsContent>

          <TabsContent value="discussions" className="flex-1 px-4 py-3 mt-0">
            <div className="space-y-2">
              {discussions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد نقاشات حالياً' : 'No discussions yet'}</p>
              ) : (
                discussions.map((room, i) => renderRoomCard(room, i))
              )}
            </div>
          </TabsContent>

          <TabsContent value="learning" className="flex-1 px-4 py-3 mt-0">
            <div className="space-y-2">
              {learningRooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد غرف تعليم حالياً' : 'No learning rooms yet'}</p>
              ) : (
                learningRooms.map((room, i) => renderRoomCard(room, i))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default CommunityPage;
