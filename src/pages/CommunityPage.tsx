import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, MessageCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LegacyRoomCard } from '@/components/community/RoomCard';
import { RoomChatPanel } from '@/components/community/RoomChatPanel';
import { RoomModerationPanel } from '@/components/community/RoomModerationPanel';
import { LearningRoomPanel } from '@/components/community/LearningRoomPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommunityRooms } from '@/hooks/useCommunityRooms';

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

  const handleRoomClick = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.is_private && !isVipUser) {
      toast({
        title: t('community.vipOnly'),
        description: t('community.upgradeToAccess'),
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedRoomId(roomId);
    markRoomAsRead(roomId);
    
    if (roomId === 'learning') {
      setViewMode('learning');
    } else {
      setViewMode('chat');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRoomId(null);
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

  // Show Learning panel
  if (viewMode === 'learning') {
    return (
      <AppLayout>
        <LearningRoomPanel onBack={handleBackToList} />
      </AppLayout>
    );
  }

  // Show chat panel
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

  // Show moderation panel
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
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
                  onClick={() => handleRoomClick(room.id)}
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
        )}
      </div>
    </AppLayout>
  );
};

export default CommunityPage;
