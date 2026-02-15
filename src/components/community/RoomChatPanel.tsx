import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowRight, ArrowLeft, Pencil, Trash2, X, Check, Shield, Crown, Settings, Lock, UserPlus, Megaphone } from 'lucide-react';
import { useRoomChat, RoomMessage } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useRoomModeration } from '@/hooks/useRoomManagement';
import { useRoomManagement } from '@/hooks/useRoomManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/date-utils';
import { RoomJoinDialog } from './RoomJoinDialog';

interface RoomChatPanelProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
  onManage?: () => void;
  isBroadcast?: boolean;
}

export const RoomChatPanel = ({ roomId, roomName, onBack, onManage, isBroadcast = false }: RoomChatPanelProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { messages, loading, sendMessage, updateMessage, deleteMessage } = useRoomChat(roomId);
  const { members, isModerator, currentUserRole } = useRoomModeration(roomId);
  const { getMembershipStatus, getPendingRequest, requestJoin } = useRoomManagement();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 });
  const [membershipStatus, setMembershipStatus] = useState<'approved' | 'pending' | 'banned' | 'none'>('none');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isArabic = i18n.language === 'ar';

  // Check user's membership status
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setMembershipStatus('none');
        setMembershipLoading(false);
        return;
      }

      // Admins always have access
      if (isAdmin) {
        setMembershipStatus('approved');
        setMembershipLoading(false);
        return;
      }

      // Broadcast channels are open for everyone to read
      if (isBroadcast) {
        setMembershipStatus('approved');
        setMembershipLoading(false);
        return;
      }

      setMembershipLoading(true);
      const membership = await getMembershipStatus(roomId);
      
      if (membership) {
        setMembershipStatus(membership.status as 'approved' | 'pending' | 'banned');
      } else {
        // Check if there's a pending request
        const pendingRequest = await getPendingRequest(roomId);
        if (pendingRequest) {
          setMembershipStatus('pending');
        } else {
          setMembershipStatus('none');
        }
      }
      setMembershipLoading(false);
    };

    checkMembership();
  }, [user, roomId, isAdmin, getMembershipStatus, getPendingRequest]);

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
    const result = await sendMessage(newMessage, isModerator || isAdmin);
    
    // Only clear if message was sent successfully (not blocked)
    if (result && !('blocked' in result)) {
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

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const canManage = isAdmin || isModerator;
  const isMember = membershipStatus === 'approved';
  const canPost = isBroadcast ? (isAdmin || isModerator) : true;

  // Handle join request
  const handleJoinRequest = async (message?: string) => {
    const success = await requestJoin(roomId, message);
    if (success) {
      setMembershipStatus('pending');
      setShowJoinDialog(false);
    }
  };

  // Show access denied screen for non-members
  if (!membershipLoading && !isMember && !isAdmin) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]" ref={constraintsRef}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{roomName}</h2>
          </div>
        </div>

        {/* Access Denied Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          
          {membershipStatus === 'pending' ? (
            <>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {isArabic ? 'طلبك قيد المراجعة' : 'Request Pending'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {isArabic 
                  ? 'طلب انضمامك قيد المراجعة من قبل مشرفي الغرفة. سيتم إعلامك عند قبول طلبك.'
                  : 'Your join request is being reviewed by room moderators. You will be notified once approved.'
                }
              </p>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                {isArabic ? 'في انتظار الموافقة' : 'Awaiting Approval'}
              </Badge>
            </>
          ) : membershipStatus === 'banned' ? (
            <>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {isArabic ? 'تم حظرك من هذه الغرفة' : 'You are banned from this room'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {isArabic 
                  ? 'لا يمكنك الوصول إلى هذه الغرفة. تواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ.'
                  : 'You cannot access this room. Contact administration if you believe this is an error.'
                }
              </p>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                {isArabic ? 'محظور' : 'Banned'}
              </Badge>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {isArabic ? 'الانضمام مطلوب' : 'Membership Required'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {isArabic 
                  ? 'هذه الغرفة تتطلب انضماماً. اطلب الانضمام لتتمكن من مشاهدة المحادثات والمشاركة.'
                  : 'This room requires membership. Request to join to view conversations and participate.'
                }
              </p>
              <Button onClick={() => setShowJoinDialog(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                {isArabic ? 'طلب الانضمام' : 'Request to Join'}
              </Button>
            </>
          )}
        </div>

        {/* Join Dialog */}
        <RoomJoinDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          onSubmit={handleJoinRequest}
          roomName={roomName}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] relative" ref={constraintsRef}>
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
      </div>

      {/* Floating Admin Button - Draggable */}
      {canManage && onManage && (
        <motion.button
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          whileDrag={{ scale: 1.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onManage}
          className="fixed z-50 bottom-32 left-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <Settings className="w-6 h-6" />
        </motion.button>
      )}

      {/* Loading State */}
      {(loading || membershipLoading) ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
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
            {isBroadcast && !canPost ? (
              <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
                <Megaphone className="w-4 h-4" />
                <span>{isArabic ? 'هذه قناة إعلانات - للقراءة فقط' : 'This is an announcements channel - read only'}</span>
              </div>
            ) : (
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
            )}
          </div>
        </>
      )}
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
