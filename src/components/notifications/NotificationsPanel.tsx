import { useTranslation } from 'react-i18next';
import { Bell, Check, X, MessageSquare, TrendingUp, AlertCircle, Mail, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, UserNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/date-utils';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const NotificationsPanel = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  } = useNotifications();
  const isArabic = i18n.language === 'ar';
  const [open, setOpen] = useState(false);

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reply':
      case 'trade_comment':
      case 'post_comment':
      case 'comment_reply':
        return MessageSquare;
      case 'trade':
      case 'trade_update':
      case 'new_trade':
      case 'analysis_like':
        return TrendingUp;
      case 'alert':
        return AlertCircle;
      case 'message':
        return Mail;
      case 'post_like':
      case 'comment_like':
      case 'reply_like':
        return Heart;
      default:
        return Bell;
    }
  };

  // Filter out notification types that have their own dedicated icons
  const dedicatedTypes = ['friend_request', 'friend_accepted', 'message', 'support_ticket'];
  const filteredNotifications = notifications.filter(
    n => !dedicatedTypes.includes(n.type)
  );
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  // Friend request actions removed - handled by FriendRequestsPanel

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const data = notification.data as Record<string, string>;
    let target: string | null = null;

    switch (notification.type) {
      case 'reply':
      case 'reply_like':
        if (data?.thread_id) target = '/community';
        break;
      case 'trade':
      case 'new_trade':
      case 'trade_update':
      case 'trade_comment':
      case 'comment_like':
        if (data?.trade_id) target = '/trades';
        break;
      case 'message':
        if (data?.conversation_id) target = `/messages?conv=${data.conversation_id}`;
        break;
      case 'friend_request':
        if (data?.sender_id) target = `/user/${data.sender_id}`;
        break;
      case 'friend_accepted':
        if (data?.friend_id) target = `/user/${data.friend_id}`;
        else if (data?.sender_id) target = `/user/${data.sender_id}`;
        break;
      case 'post_like':
      case 'post_comment':
      case 'comment_reply':
        if (data?.post_id) target = '/profile';
        break;
      case 'analysis_like':
        if (data?.analysis_id) target = '/analyses';
        break;
      case 'support_reply':
        target = '/support';
        break;
    }

    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  const renderNotificationActions = (_notification: UserNotification) => {
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {filteredUnreadCount > 0 && (
            <Badge
              className="absolute -top-1 -end-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
            >
              {filteredUnreadCount > 99 ? '99+' : filteredUnreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side={isArabic ? 'right' : 'left'} className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notifications.title')}
              {filteredUnreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filteredUnreadCount}
                </Badge>
              )}
            </SheetTitle>
            {filteredNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="w-3 h-3 me-1" />
                {t('admin.notifications.markAllRead')}
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{t('admin.notifications.empty')}</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
                      className={cn(
                        "p-3 rounded-lg border transition-colors cursor-pointer group",
                        notification.read
                          ? "bg-card/30 border-border/20"
                          : "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          notification.read
                            ? "bg-muted"
                            : "bg-primary/20"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            notification.read
                              ? "text-muted-foreground"
                              : "text-primary"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm font-medium",
                              notification.read
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>

                          {renderNotificationActions(notification)}

                          <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>

                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
