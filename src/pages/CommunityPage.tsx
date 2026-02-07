import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoomCard } from '@/components/community/RoomCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Tab = 'rooms' | 'threads';

// Static rooms data - could be moved to database later
const roomsData = [
  {
    id: 'room-general',
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
    id: 'room-learning',
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
    id: 'room-vip',
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
    id: 'room-usdt',
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
    id: 'room-news',
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

interface Thread {
  id: string;
  room_id: string;
  created_at: string;
  created_by: { username: string; display_name: string };
  title: string;
  content: string;
  tag: 'question' | 'analysis' | 'alert' | 'help';
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  has_best_answer: boolean;
}

const CommunityPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('rooms');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThread, setNewThread] = useState<{
    title: string;
    content: string;
    tag: 'question' | 'analysis' | 'alert' | 'help';
    room_id: string;
  }>({
    title: '',
    content: '',
    tag: 'question',
    room_id: 'room-general'
  });

  const { user, isVip, isAdmin, loading: authLoading } = useAuth();
  const isArabic = i18n.language === 'ar';
  const isVipUser = isVip || isAdmin;

  const tagColors: Record<string, string> = {
    question: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analysis: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    help: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const handleRoomClick = (roomId: string, isLocked: boolean) => {
    if (isLocked) {
      toast({
        title: t('community.vipOnly'),
        description: t('community.upgradeToAccess'),
        variant: 'destructive'
      });
      return;
    }
    // Navigate to room or show threads for this room
    setActiveTab('threads');
  };

  const handleCreateThread = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!newThread.title.trim() || !newThread.content.trim()) {
      toast({
        title: t('common.error'),
        description: t('community.fillAllFields'),
        variant: 'destructive'
      });
      return;
    }

    const thread: Thread = {
      id: `thread-${Date.now()}`,
      room_id: newThread.room_id,
      created_at: new Date().toISOString(),
      created_by: {
        username: user.email?.split('@')[0] || 'user',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
      },
      title: newThread.title,
      content: newThread.content,
      tag: newThread.tag,
      replies_count: 0,
      is_pinned: false,
      is_locked: false,
      has_best_answer: false
    };

    setThreads(prev => [thread, ...prev]);
    setNewThread({ title: '', content: '', tag: 'question', room_id: 'room-general' });
    setShowNewThreadDialog(false);
    toast({ title: t('community.threadCreated') });
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

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
          <Button size="sm" className="h-9 gap-2" onClick={() => setShowNewThreadDialog(true)}>
            <Plus className="w-4 h-4" />
            {t('community.newThread')}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {(['rooms', 'threads'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {t(`community.${tab}`)}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {activeTab === 'rooms' ? (
          <div className="space-y-3">
            {roomsData.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomCard 
                  room={room} 
                  isLocked={room.is_vip && !isVipUser}
                  onClick={() => handleRoomClick(room.id, room.is_vip && !isVipUser)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {threads.length > 0 ? (
              threads.map((thread, index) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-card/50 border border-border/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {thread.created_by.display_name.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {thread.created_by.display_name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", tagColors[thread.tag])}
                        >
                          {t(`community.${thread.tag}`)}
                        </Badge>
                        {thread.is_pinned && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            📌
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-foreground mb-1">{thread.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{thread.content}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {thread.replies_count} {t('community.replies')}
                        </span>
                        {thread.has_best_answer && (
                          <span className="text-profit">✓ {t('community.bestAnswer')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{t('community.noThreads')}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowNewThreadDialog(true)}
                >
                  {t('community.createFirst')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Thread Dialog */}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('community.newThread')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('community.threadTitle')}</label>
              <Input
                value={newThread.title}
                onChange={(e) => setNewThread(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('community.titlePlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('community.threadContent')}</label>
              <Textarea
                value={newThread.content}
                onChange={(e) => setNewThread(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('community.contentPlaceholder')}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('community.selectRoom')}</label>
                <Select
                  value={newThread.room_id}
                  onValueChange={(value) => setNewThread(prev => ({ ...prev, room_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomsData.filter(r => !r.is_vip || isVipUser).map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {isArabic ? room.name_ar : room.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('community.tag')}</label>
                <Select
                  value={newThread.tag}
                  onValueChange={(value: 'question' | 'analysis' | 'alert' | 'help') => 
                    setNewThread(prev => ({ ...prev, tag: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">{t('community.question')}</SelectItem>
                    <SelectItem value="analysis">{t('community.analysis')}</SelectItem>
                    <SelectItem value="alert">{t('community.alert')}</SelectItem>
                    <SelectItem value="help">{t('community.help')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleCreateThread} className="w-full">
              {t('community.createThread')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CommunityPage;
