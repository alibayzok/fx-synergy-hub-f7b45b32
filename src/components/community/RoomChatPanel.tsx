import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRoomChat, RoomMessage } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface RoomChatPanelProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
}

export const RoomChatPanel = ({ roomId, roomName, onBack }: RoomChatPanelProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useRoomChat(roomId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isArabic = i18n.language === 'ar';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
  };

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <BackArrow className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">{roomName}</h2>
        <span className="text-xs text-muted-foreground">
          ({messages.length} {t('community.messages')})
        </span>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">{t('community.noMessages')}</p>
            <p className="text-sm text-muted-foreground/70">{t('community.startConversation')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.user_id === user?.id}
                formatTime={formatTime}
                showAvatar={index === 0 || messages[index - 1].user_id !== message.user_id}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border/30">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('community.typeMessage')}
            className="flex-1"
            disabled={!user || sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || !user || sending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: RoomMessage;
  isOwn: boolean;
  formatTime: (date: string) => string;
  showAvatar: boolean;
}

const MessageBubble = ({ message, isOwn, formatTime, showAvatar }: MessageBubbleProps) => {
  const authorName = message.author?.display_name || message.author?.username || 'مستخدم';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      {showAvatar ? (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {authorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {showAvatar && (
          <span className="text-xs text-muted-foreground mb-1">{authorName}</span>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  );
};
