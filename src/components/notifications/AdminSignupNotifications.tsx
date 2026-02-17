import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/lib/date-utils';
import { playNotificationSound } from '@/lib/notification-sound';

interface SignupNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  read: boolean;
  created_at: string;
}

export const AdminSignupNotifications = () => {
  const { i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SignupNotification[]>([]);
  const [open, setOpen] = useState(false);
  const isArabic = i18n.language === 'ar';

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('type', 'new_user')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching signup notifications:', error);
      return;
    }

    setNotifications(data || []);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchNotifications();
  }, [isAdmin, fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-signup-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        async (payload) => {
          const newNotification = payload.new as SignupNotification;
          if (newNotification.type === 'new_user') {
            setNotifications(prev => [newNotification, ...prev]);
            await playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const markAsRead = async (id: string) => {
    await supabase.from('admin_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('type', 'new_user')
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  if (!isAdmin) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors">
          <Users className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -end-0.5"
            >
              <Badge
                variant="destructive"
                className="h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side={isArabic ? 'right' : 'left'} className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              {isArabic ? 'تسجيلات جديدة' : 'New Signups'}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadCount}</Badge>
              )}
            </SheetTitle>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="w-3 h-3 me-1" />
                {isArabic ? 'قراءة الكل' : 'Read all'}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {isArabic ? 'لا توجد تسجيلات جديدة' : 'No new signups'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const data = notification.data as Record<string, string> | null;
                return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border transition-colors group cursor-pointer",
                    notification.read
                      ? "bg-card/30 border-border/20"
                      : "bg-blue-500/5 border-blue-500/20"
                  )}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    setOpen(false);
                    // Navigate to admin user management
                    navigate('/admin');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      notification.read ? "bg-muted" : "bg-blue-500/10"
                    )}>
                      <UserPlus className={cn(
                        "w-4 h-4",
                        notification.read ? "text-muted-foreground" : "text-blue-500"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "text-sm font-medium",
                            notification.read ? "text-muted-foreground" : "text-foreground"
                          )}>
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
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
