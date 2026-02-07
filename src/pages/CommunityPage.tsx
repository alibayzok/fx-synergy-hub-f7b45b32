import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoomCard } from '@/components/community/RoomCard';
import { mockRooms, mockThreads, currentUser } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Tab = 'rooms' | 'threads';

const CommunityPage = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('rooms');
  const isArabic = i18n.language === 'ar';
  const isVip = currentUser.role === 'vip' || currentUser.role === 'admin';

  const tagColors: Record<string, string> = {
    question: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analysis: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    help: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('community.title')}</h1>
          <Button size="sm" className="h-9 gap-2">
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
            {mockRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomCard 
                  room={room} 
                  isLocked={room.is_vip && !isVip}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {mockThreads.map((thread, index) => (
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
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CommunityPage;
