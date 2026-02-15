import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, ArrowRight, ArrowLeft, Send, Users, 
  Search, Check, CheckCheck, MoreVertical, Ban, Trash2, ShieldAlert
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  const { blockedUsers, isUserBlocked } = useBlockUser();
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

  // Filter out conversations with blocked users
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
    
    // Hide conversations with blocked users
    if (otherParticipant && isUserBlocked(otherParticipant.user_id)) {
      return false;
    }

    if (!searchQuery) return true;
    const name = conv.name || otherParticipant?.profile?.display_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

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
          <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
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
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-b border-border/30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {selectedConversationId && (
                <Button variant="ghost" size="icon" onClick={closeConversation}>
                  <BackArrow className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {t('messages.title')}
                {unreadTotal > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadTotal}
                  </Badge>
                )}
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <AnimatePresence mode="wait">
            {!selectedConversationId && (
              <motion.div
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
                className="flex-1 flex flex-col"
              >
                {/* Search */}
                <div className="p-4 border-b border-border/30">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('common.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <ScrollArea className="flex-1">
                  {convsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">{t('messages.noConversations')}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {t('messages.startFromProfile')}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {filteredConversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-start",
                            conv.unread_count && conv.unread_count > 0 && "bg-primary/5"
                          )}
                        >
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getConversationAvatar(conv) || undefined} />
                              <AvatarFallback className={cn(
                                "text-lg",
                                conv.type === 'group' ? "bg-primary/20 text-primary" : "bg-muted"
                              )}>
                                {conv.type === 'group' ? (
                                  <Users className="w-5 h-5" />
                                ) : (
                                  getConversationName(conv).charAt(0)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            {conv.type === 'direct' && (() => {
                              const other = conv.participants?.find(p => p.user_id !== user?.id);
                              return other && isOnline(other.user_id) ? (
                                <span className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                              ) : null;
                            })()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn(
                                "font-medium truncate",
                                conv.unread_count && conv.unread_count > 0 && "font-bold"
                              )}>
                                {getConversationName(conv)}
                              </span>
                              {conv.last_message && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(conv.last_message.created_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-sm truncate",
                                conv.unread_count && conv.unread_count > 0 
                                  ? "text-foreground" 
                                  : "text-muted-foreground"
                              )}>
                                {conv.last_message?.content || t('messages.noMessages')}
                              </p>
                              {conv.unread_count && conv.unread_count > 0 && (
                                <Badge variant="default" className="text-xs min-w-[20px] justify-center">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
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
                initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isArabic ? -20 : 20 }}
                className="flex-1"
              >
                <ChatView 
                  conversationId={selectedConversationId} 
                  onBack={closeConversation}
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
  onBack: () => void;
  isOnline: (userId: string) => boolean;
}

const ChatView = ({ conversationId, onBack, isOnline }: ChatViewProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, conversation, loading, sendMessage, deleteMessage } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isArabic = i18n.language === 'ar';

  const otherParticipant = conversation?.type === 'direct' 
    ? (conversation as any).participants?.find((p: any) => p.user_id !== user?.id)
    : null;

  const otherUserId = otherParticipant?.user_id;
  const { isBlocked, blockUser, unblockUser } = useBlockUser(otherUserId);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || isBlocked) return;
    
    setSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
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

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  const conversationName = conversation?.type === 'group' 
    ? conversation.name 
    : otherParticipant?.profile?.display_name || t('community.anonymous');

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/30 flex items-center gap-3">
        <div className="relative">
          <Avatar 
            className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              if (otherUserId) {
                navigate(`/user/${otherUserId}`);
              }
            }}
          >
            <AvatarImage src={otherParticipant?.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {conversation?.type === 'group' ? (
                <Users className="w-4 h-4" />
              ) : (
                (conversationName || '?').charAt(0)
              )}
            </AvatarFallback>
          </Avatar>
          {otherUserId && isOnline(otherUserId) && (
            <span className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <div 
          className={cn(
            "flex-1",
            otherUserId && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={() => {
            if (otherUserId) {
              navigate(`/user/${otherUserId}`);
            }
          }}
        >
          <h2 className="font-semibold text-foreground">{conversationName}</h2>
          {conversation?.type === 'direct' && otherUserId && (
            <p className={cn("text-xs", isOnline(otherUserId) ? "text-green-500" : "text-muted-foreground")}>
              {isOnline(otherUserId) ? t('messages.online') : t('messages.offline')}
            </p>
          )}
          {conversation?.type === 'group' && (
            <p className="text-xs text-muted-foreground">
              {(conversation as any).participants?.length || 0} {t('community.members')}
            </p>
          )}
          {isBlocked && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {t('social.userIsBlocked')}
            </p>
          )}
        </div>

        {/* Options Menu */}
        {conversation?.type === 'direct' && otherUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isArabic ? "start" : "end"}>
              {isBlocked ? (
                <DropdownMenuItem onClick={handleUnblock} className="text-primary">
                  <Ban className="w-4 h-4 me-2" />
                  {t('social.unblockUser')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setShowBlockDialog(true)} 
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="w-4 h-4 me-2" />
                  {t('social.blockUser')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t('messages.noMessages')}</p>
            <p className="text-xs text-muted-foreground/70">{t('messages.startTyping')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2 group", isOwn ? "flex-row-reverse" : "flex-row")}
                >
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {(msg.sender?.display_name || msg.sender?.username || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}
                  
                  <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.sender?.display_name || msg.sender?.username}
                      </span>
                    )}
                    <div className="relative">
                      <div
                        className={cn(
                          "px-3 py-2 rounded-2xl",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {/* Delete button for own messages */}
                      {isOwn && (
                        <button
                          onClick={() => setShowDeleteDialog(msg.id)}
                          className="absolute -start-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                      {isOwn && (
                        msg.is_read ? (
                          <CheckCheck className="w-3 h-3 text-primary" />
                        ) : (
                          <Check className="w-3 h-3 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/30">
        {isBlocked ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('social.userIsBlocked')}</span>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={handleUnblock}>
              {t('social.unblockUser')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('community.typeMessage')}
              className="flex-1"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('social.blockUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('social.confirmBlock')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('social.blockUser')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('community.confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteDialog && handleDeleteMessage(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
