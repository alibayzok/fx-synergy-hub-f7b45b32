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
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommunityRooms, RoomWithCounts } from '@/hooks/useCommunityRooms';

type ViewMode = 'list' | 'chat' | 'learning' | 'moderation';

const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
  <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
  </div>
);

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

  // Group rooms by category
  const channels = rooms.filter(r => r.category === 'channels');
  const discussions = rooms.filter(r => r.category === 'discussions');
  const learningRooms = rooms.filter(r => r.category === 'learning');

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

  // Login prompt
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

  // Learning panel
  if (viewMode === 'learning') {
    return (
      <AppLayout>
        <LearningRoomPanel onBack={handleBackToList} />
      </AppLayout>
    );
  }

  // Chat panel
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

  // Moderation panel
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

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        {roomsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Channels Section */}
            {channels.length > 0 && (
              <>
                <SectionHeader icon={Megaphone} title={isArabic ? 'القنوات' : 'Channels'} />
                <div className="space-y-2">
                  {channels.map((room, i) => renderRoomCard(room, i))}
                </div>
              </>
            )}

            {/* Discussions Section */}
            {discussions.length > 0 && (
              <>
                <SectionHeader icon={MessageSquare} title={isArabic ? 'النقاشات' : 'Discussions'} />
                <div className="space-y-2">
                  {discussions.map((room, i) => renderRoomCard(room, i))}
                </div>
              </>
            )}

            {/* Learning Section */}
            {learningRooms.length > 0 && (
              <>
                <SectionHeader icon={GraduationCap} title={isArabic ? 'التعليم' : 'Learning'} />
                <div className="space-y-2">
                  {learningRooms.map((room, i) => renderRoomCard(room, i))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CommunityPage;
