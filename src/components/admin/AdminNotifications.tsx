import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  UserPlus, 
  TrendingUp, 
  Trophy,
  X,
  Check,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { playNotificationSound, initNotificationSound } from '@/lib/notification-sound';
import { showBackgroundNotification } from '@/lib/push-notifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  read: boolean;
  created_at: string;
}

export const AdminNotifications = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  }, [isAdmin]);

  useEffect(() => {
    // Initialize sound
    initNotificationSound();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Play notification sound
          await playNotificationSound();

          // Show toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Show push notification if app is in background
          await showBackgroundNotification({
            title: newNotification.title,
            body: newNotification.message,
            data: { type: 'admin', url: '/admin' },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchNotifications, toast]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const clearAll = async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (!error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return UserPlus;
      case 'milestone':
        return Trophy;
      case 'trade_created':
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'new_user':
        return 'text-blue-500 bg-blue-500/10';
      case 'milestone':
        return 'text-vip bg-vip/10';
      case 'trade_created':
        return 'text-profit bg-profit/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS
    });
  };

  if (!isAdmin) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-loss rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent side={i18n.language === 'ar' ? 'right' : 'left'} className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t('admin.notifications.title')}
            </SheetTitle>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  {t('admin.notifications.markAllRead')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-loss hover:text-loss"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t('admin.notifications.clearAll')}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('admin.notifications.empty')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const Icon = getIcon(notification.type);
                const iconColor = getIconColor(notification.type);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      notification.read 
                        ? "bg-card/30 border-border/20" 
                        : "bg-primary/5 border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", iconColor)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-loss"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
