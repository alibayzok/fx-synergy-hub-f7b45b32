import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowRight, ArrowLeft, Pencil, Trash2, X, Check, Shield, Crown, Settings } from 'lucide-react';
import { useRoomChat, RoomMessage } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useRoomModeration } from '@/hooks/useRoomManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface RoomChatPanelProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
  onManage?: () => void;
}

export const RoomChatPanel = ({ roomId, roomName, onBack, onManage }: RoomChatPanelProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { messages, loading, sendMessage, updateMessage, deleteMessage } = useRoomChat(roomId);
  const { members, isModerator } = useRoomModeration(roomId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isArabic = i18n.language === 'ar';

  // Create a map of user roles in this room
  const memberRolesMap = new Map(members.map(m => [m.user_id, m.role]));

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

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
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{roomName}</h2>
          <span className="text-xs text-muted-foreground">
            ({messages.length} {t('community.messages')})
          </span>
        </div>
        {(isAdmin || isModerator) && onManage && (
          <Button variant="ghost" size="icon" onClick={onManage}>
            <Settings className="w-5 h-5" />
          </Button>
        )}
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
                isAdmin={isAdmin}
                isModerator={isModerator}
                userRole={memberRolesMap.get(message.user_id)}
                onEdit={(content) => updateMessage(message.id, content)}
                onDelete={() => deleteMessage(message.id)}
                onUserClick={handleUserClick}
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
  isAdmin: boolean;
  isModerator: boolean;
  userRole?: 'member' | 'moderator' | 'owner';
  onEdit: (content: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onUserClick: (userId: string) => void;
  formatTime: (date: string) => string;
  showAvatar: boolean;
}

const MessageBubble = ({ 
  message, 
  isOwn, 
  isAdmin, 
  isModerator,
  userRole,
  onEdit, 
  onDelete, 
  onUserClick, 
  formatTime, 
  showAvatar 
}: MessageBubbleProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [saving, setSaving] = useState(false);
  
  const authorName = message.author?.display_name || message.author?.username || 'مستخدم';
  
  // Only owner can edit their own messages
  const canEdit = isOwn;
  // Owner, admin, or moderator can delete
  const canDelete = isOwn || isAdmin || isModerator;

  const handleSaveEdit = async () => {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    const success = await onEdit(editContent);
    if (success) {
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(t('community.confirmDeleteMessage'))) {
      await onDelete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2 group", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      {showAvatar ? (
        <Avatar 
          className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => onUserClick(message.user_id)}
        >
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
          <div className="flex items-center gap-1.5 mb-1">
            <button 
              onClick={() => onUserClick(message.user_id)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {authorName}
            </button>
            {userRole === 'owner' && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[9px] px-1 py-0 gap-0.5">
                <Crown className="w-2.5 h-2.5" />
                {isArabic ? 'مالك' : 'Owner'}
              </Badge>
            )}
            {userRole === 'moderator' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[9px] px-1 py-0 gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                {isArabic ? 'مشرف' : 'Mod'}
              </Badge>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={saving}
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSaveEdit} disabled={saving || !editContent.trim()}>
              <Check className="w-4 h-4 text-profit" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
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
            
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
                  </Button>
                )}
                {canDelete && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDelete}>
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        
        <span className="text-[10px] text-muted-foreground mt-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </motion.div>
  );
};
