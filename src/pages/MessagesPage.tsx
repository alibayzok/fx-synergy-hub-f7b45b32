import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ArrowRight, ArrowLeft, Send, Users, 
  Search, Check, CheckCheck, MoreVertical, Ban, Trash2, ShieldAlert, Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useConversationMessages, Conversation } from '@/hooks/useMessaging';
import { useBlockUser } from '@/hooks/useBlockUser';
import { usePresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/date-utils';

const MessagesPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { conversations, loading: convsLoading, unreadTotal } = useConversations();
  const { isUserBlocked } = useBlockUser();
  const { isOnline } = usePresence();
  
  const selectedConversationId = searchParams.get('conv');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isArabic = i18n.language === 'ar';
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const selectConversation = (convId: string) => {
    setSearchParams({ conv: convId });
  };

  const closeConversation = () => {
    setSearchParams({});
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    if (otherParticipant && isUserBlocked(otherParticipant.user_id)) return false;
    if (!searchQuery) return true;
    const name = conv.name || otherParticipant?.profile?.display_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || t('messages.group');
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.display_name || otherParticipant?.profile?.username || t('community.anonymous');
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return null;
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile?.avatar_url;
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-primary/60" />
          </div>
          <p className="text-muted-foreground">{t('auth.loginPrompt')}</p>
          <Button className="mt-4" onClick={() => navigate('/auth')}>
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        {/* Premium Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {selectedConversationId && (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={closeConversation}>
                  <BackArrow className="w-5 h-5" />
                </Button>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">{t('messages.title')}</h1>
                  {unreadTotal > 0 && (
                    <p className="text-[10px] text-primary font-medium">
                      {unreadTotal} {isArabic ? 'غير مقروءة' : 'unread'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <AnimatePresence mode="wait">
            {!selectedConversationId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col"
              >
                {/* Search */}
                <div className="p-3 px-4">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('common.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 bg-muted/40 border-border/30 rounded-xl h-10 focus:border-primary/40"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <ScrollArea className="flex-1">
                  {convsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <Skeleton className="w-12 h-12 rounded-2xl" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-28 mb-2 rounded-lg" />
                            <Skeleton className="h-3 w-40 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                        <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm">{t('messages.noConversations')}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {t('messages.startFromProfile')}
                      </p>
                    </div>
                  ) : (
                    <div className="px-2">
                      {filteredConversations.map((conv, idx) => {
                        const hasUnread = conv.unread_count && conv.unread_count > 0;
                        const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
                        const online = otherParticipant && conv.type === 'direct' && isOnline(otherParticipant.user_id);

                        return (
                          <motion.button
                            key={conv.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => selectConversation(conv.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-start mb-1",
                              "hover:bg-muted/60 active:scale-[0.98]",
                              hasUnread && "bg-primary/5 hover:bg-primary/8"
                            )}
                          >
                            <div className="relative">
                              <Avatar className={cn(
                                "w-12 h-12 ring-2 transition-all",
                                hasUnread ? "ring-primary/40" : "ring-border/20"
                              )}>
                                <AvatarImage src={getConversationAvatar(conv) || undefined} />
                                <AvatarFallback className={cn(
                                  "text-sm font-semibold",
                                  conv.type === 'group' 
                                    ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary" 
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {conv.type === 'group' ? (
                                    <Users className="w-5 h-5" />
                                  ) : (
                                    getConversationName(conv).charAt(0).toUpperCase()
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              {online && (
                                <span className="absolute bottom-0 end-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-background rounded-full shadow-sm" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn(
                                  "text-sm truncate",
                                  hasUnread ? "font-bold text-foreground" : "font-medium text-foreground/90"
                                )}>
                                  {getConversationName(conv)}
                                </span>
                                {conv.last_message && (
                                  <span className={cn(
                                    "text-[10px] whitespace-nowrap shrink-0",
                                    hasUnread ? "text-primary font-medium" : "text-muted-foreground"
                                  )}>
                                    {formatTimeAgo(conv.last_message.created_at, i18n.language)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className={cn(
                                  "text-xs truncate",
                                  hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"
                                )}>
                                  {conv.last_message?.content || t('messages.noMessages')}
                                </p>
                                {hasUnread && (
                                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat View */}
          <AnimatePresence mode="wait">
            {selectedConversationId && (
              <motion.div
                initial={{ opacity: 0, x: isArabic ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isArabic ? -15 : 15 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex-1"
              >
                <ChatView 
                  conversationId={selectedConversationId} 
                  isOnline={isOnline}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

interface ChatViewProps {
  conversationId: string;
  isOnline: (userId: string) => boolean;
}

const ChatView = ({ conversationId, isOnline }: ChatViewProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, conversation, loading, sendMessage, deleteMessage } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isArabic = i18n.language === 'ar';

  const otherParticipant = conversation?.type === 'direct' 
    ? (conversation as any).participants?.find((p: any) => p.user_id !== user?.id)
    : null;

  const otherUserId = otherParticipant?.user_id;
  const { isBlocked, blockUser, unblockUser } = useBlockUser(otherUserId);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages, scrollToBottom]);

  // Remove optimistic messages that now exist in real messages
  useEffect(() => {
    if (optimisticMessages.length > 0 && messages.length > 0) {
      setOptimisticMessages(prev => 
        prev.filter(om => !messages.some(m => m.content === om.content && m.sender_id === user?.id))
      );
    }
  }, [messages, optimisticMessages.length, user?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || isBlocked) return;
    
    const content = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic: show message instantly
    setOptimisticMessages(prev => [...prev, {
      id: tempId,
      content,
      created_at: new Date().toISOString()
    }]);
    setNewMessage('');
    inputRef.current?.focus();
    
    setSending(true);
    const success = await sendMessage(content);
    if (!success) {
      // Remove failed optimistic message
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlock = async () => {
    if (otherUserId) {
      await blockUser(otherUserId);
      setShowBlockDialog(false);
    }
  };

  const handleUnblock = async () => {
    if (otherUserId) {
      await unblockUser(otherUserId);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    await deleteMessage(msgId);
    setShowDeleteDialog(null);
  };

  const conversationName = conversation?.type === 'group' 
    ? conversation.name 
    : otherParticipant?.profile?.display_name || t('community.anonymous');

  // Group consecutive messages from same sender
  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    return messages[index - 1].sender_id !== messages[index].sender_id;
  };

  const shouldShowTime = (index: number) => {
    if (index === messages.length - 1) return true;
    if (messages[index + 1].sender_id !== messages[index].sender_id) return true;
    // Show time if gap > 5 minutes
    const current = new Date(messages[index].created_at).getTime();
    const next = new Date(messages[index + 1].created_at).getTime();
    return (next - current) > 5 * 60 * 1000;
  };

  // Date separator logic
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return isArabic ? 'اليوم' : 'Today';
    if (d.toDateString() === yesterday.toDateString()) return isArabic ? 'أمس' : 'Yesterday';
    return d.toLocaleDateString(isArabic ? 'ar' : 'en', { day: 'numeric', month: 'short' });
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].created_at).toDateString();
    const curr = new Date(messages[index].created_at).toDateString();
    return prev !== curr;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Premium */}
      <div className="px-4 py-3 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar 
              className={cn(
                "w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity ring-2",
                otherUserId && isOnline(otherUserId) ? "ring-green-500/40" : "ring-border/20"
              )}
              onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
            >
              <AvatarImage src={otherParticipant?.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                {conversation?.type === 'group' ? (
                  <Users className="w-4 h-4" />
                ) : (
                  (conversationName || '?').charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            {otherUserId && isOnline(otherUserId) && (
              <span className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div 
            className={cn("flex-1 min-w-0", otherUserId && "cursor-pointer")}
            onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
          >
            <h2 className="font-semibold text-sm text-foreground truncate">{conversationName}</h2>
            {conversation?.type === 'direct' && otherUserId && (
              <p className={cn(
                "text-[11px] font-medium",
                isOnline(otherUserId) ? "text-green-500" : "text-muted-foreground"
              )}>
                {isOnline(otherUserId) ? t('messages.online') : t('messages.offline')}
              </p>
            )}
            {conversation?.type === 'group' && (
              <p className="text-[11px] text-muted-foreground">
                {(conversation as any).participants?.length || 0} {t('community.members')}
              </p>
            )}
            {isBlocked && (
              <p className="text-[11px] text-destructive flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t('social.userIsBlocked')}
              </p>
            )}
          </div>

          {conversation?.type === 'direct' && otherUserId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isArabic ? "start" : "end"} className="rounded-xl">
                {isBlocked ? (
                  <DropdownMenuItem onClick={handleUnblock} className="text-primary rounded-lg">
                    <Ban className="w-4 h-4 me-2" />
                    {t('social.unblockUser')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => setShowBlockDialog(true)} 
                    className="text-destructive focus:text-destructive rounded-lg"
                  >
                    <Ban className="w-4 h-4 me-2" />
                    {t('social.blockUser')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-7 h-7 animate-spin text-primary/60" />
          </div>
        ) : messages.length === 0 && optimisticMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">{t('messages.noMessages')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('messages.startTyping')}</p>
          </div>
        ) : (
          <div className="space-y-0.5 pb-2">
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === user?.id;
              const showAvatar = shouldShowAvatar(index);
              const showTime = shouldShowTime(index);
              const showDate = shouldShowDateSeparator(index);
              
              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                        {getDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={cn("flex gap-1.5 group", isOwn ? "flex-row-reverse" : "flex-row", showAvatar ? "mt-3" : "mt-0.5")}>
                    {/* Avatar space */}
                    {!isOwn && (
                      showAvatar ? (
                        <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                            {(msg.sender?.display_name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )
                    )}
                    
                    <div className={cn("flex flex-col max-w-[78%]", isOwn ? "items-end" : "items-start")}>
                      {showAvatar && !isOwn && conversation?.type === 'group' && (
                        <span className="text-[10px] text-muted-foreground mb-0.5 px-2">
                          {msg.sender?.display_name || msg.sender?.username}
                        </span>
                      )}
                      <div className="relative group/msg">
                        <div
                          className={cn(
                            "px-3.5 py-2 text-sm leading-relaxed",
                            isOwn
                              ? cn(
                                  "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-sm",
                                  showAvatar ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-md"
                                )
                              : cn(
                                  "bg-muted/70 text-foreground border border-border/20",
                                  showAvatar ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-md"
                                )
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        {/* Delete own message */}
                        {isOwn && (
                          <button
                            onClick={() => setShowDeleteDialog(msg.id)}
                            className="absolute -start-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 text-destructive/70" />
                          </button>
                        )}
                      </div>
                      {/* Time + read receipt */}
                      {showTime && (
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          <span className="text-[9px] text-muted-foreground/70">
                            {new Date(msg.created_at).toLocaleTimeString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-primary/80" />
                            ) : (
                              <Check className="w-3 h-3 text-muted-foreground/50" />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Optimistic messages */}
            {optimisticMessages.map(om => (
              <div key={om.id} className={cn("flex gap-1.5 mt-1", "flex-row-reverse")}>
                <div className="flex flex-col max-w-[78%] items-end">
                  <div className="px-3.5 py-2 text-sm leading-relaxed bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground rounded-2xl rounded-br-md shadow-sm">
                    <p className="whitespace-pre-wrap break-words opacity-80">{om.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area - Premium */}
      <div className="px-3 py-2.5 border-t border-border/20 bg-background/90 backdrop-blur-xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}>
        {isBlocked ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('social.userIsBlocked')}</span>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={handleUnblock}>
              {t('social.unblockUser')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('community.typeMessage')}
              className="flex-1 bg-muted/40 border-border/30 rounded-xl h-10 focus:border-primary/40 text-sm"
              disabled={sending && optimisticMessages.length === 0}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl shrink-0 transition-all",
                newMessage.trim() 
                  ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/20" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className={cn("w-4 h-4", isArabic && "rotate-180")} />
            </Button>
          </div>
        )}
      </div>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('social.blockUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('social.confirmBlock')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {t('social.blockUser')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('community.confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteDialog && handleDeleteMessage(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
