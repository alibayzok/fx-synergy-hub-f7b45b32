import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowRight, ArrowLeft, Pencil, Trash2, X, Check, Shield, Crown, Settings, Lock, UserPlus, Megaphone, Eye, SmilePlus, ImagePlus } from 'lucide-react';
import { useRoomChat, RoomMessage, MessageReaction } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { useRoomModeration } from '@/hooks/useRoomManagement';
import { useRoomManagement } from '@/hooks/useRoomManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { formatTimeAgo } from '@/lib/date-utils';
import { RoomJoinDialog } from './RoomJoinDialog';
import { supabase } from '@/integrations/supabase/client';
import { PremiumImageViewer } from '@/components/ui/premium-image-viewer';

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
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { messages, loading, sendMessage, updateMessage, deleteMessage, toggleReaction } = useRoomChat(roomId, isBroadcast);
  const { members, isModerator, currentUserRole } = useRoomModeration(roomId);
  const { getMembershipStatus, getPendingRequest, requestJoin } = useRoomManagement();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: isArabic ? 'حجم الصورة كبير جداً (الحد 5MB)' : 'Image too large (max 5MB)', variant: 'destructive' });
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${roomId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('room-images').upload(fileName, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('room-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    setSending(true);
    setUploading(!!selectedImage);

    let imageUrl: string | undefined;
    if (selectedImage) {
      const url = await uploadImage(selectedImage);
      if (url) imageUrl = url;
      else {
        toast({ title: isArabic ? 'فشل رفع الصورة' : 'Image upload failed', variant: 'destructive' });
        setSending(false);
        setUploading(false);
        return;
      }
    }

    const content = newMessage.trim() || (imageUrl ? '📷' : '');
    const result = await sendMessage(content, isModerator || isAdmin, imageUrl);
    
    if (result && !('blocked' in result)) {
      setNewMessage('');
      clearImage();
    }
    setSending(false);
    setUploading(false);
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
    <div className="flex flex-col h-[calc(100vh-160px)] relative" ref={constraintsRef}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <BackArrow className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{roomName}</h2>
          <span className="text-[11px] text-muted-foreground">
            {messages.length} {t('community.messages')}
          </span>
        </div>
        {canManage && onManage && (
          <Button variant="ghost" size="icon" onClick={onManage} className="shrink-0 text-muted-foreground hover:text-primary">
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Loading State */}
      {(loading || membershipLoading) ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-3 py-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Send className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">{t('community.noMessages')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('community.startConversation')}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((message, index) => {
                  const showDateSeparator = index === 0 || 
                    new Date(message.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();
                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-4">
                          <div className="px-3 py-1 rounded-full bg-muted/60 text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString(isArabic ? 'ar' : 'en', { 
                              weekday: 'long', month: 'short', day: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={message.user_id === user?.id}
                        isAdmin={isAdmin}
                        isModerator={isModerator}
                        isBroadcast={isBroadcast}
                        userRole={memberRolesMap.get(message.user_id)}
                        onEdit={(content) => updateMessage(message.id, content)}
                        onDelete={() => deleteMessage(message.id)}
                        onUserClick={handleUserClick}
                        onToggleReaction={isBroadcast ? (emoji) => toggleReaction(message.id, emoji) : undefined}
                        formatTime={formatTime}
                        showAvatar={index === 0 || messages[index - 1].user_id !== message.user_id}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="px-3 py-2.5 border-t border-border/40 bg-card/80 backdrop-blur-sm">
            {isBroadcast && !canPost ? (
              <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
                <Megaphone className="w-4 h-4" />
                <span>{isArabic ? 'هذه قناة إعلانات - للقراءة فقط' : 'This is an announcements channel - read only'}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border border-border/40" />
                    <button
                      onClick={clearImage}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={(!newMessage.trim() && !selectedImage) || !user || sending}
                    size="icon"
                    className="shrink-0 rounded-full w-10 h-10"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('community.typeMessage')}
                    className="flex-1 rounded-full bg-muted/50 border-border/30 focus-visible:ring-primary/30"
                    disabled={!user || sending}
                  />
                  {isBroadcast && canPost && (
                    <label className="shrink-0 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={sending}
                      />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <ImagePlus className="w-4 h-4" />
                      </div>
                    </label>
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    <span>{isArabic ? 'جاري رفع الصورة...' : 'Uploading image...'}</span>
                  </div>
                )}
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
  isBroadcast?: boolean;
  userRole?: 'member' | 'moderator' | 'owner';
  onEdit: (content: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onUserClick: (userId: string) => void;
  onToggleReaction?: (emoji: string) => void;
  formatTime: (date: string) => string;
  showAvatar: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '👏', '😂', '😮'];

const MessageBubble = ({ 
  message, isOwn, isAdmin, isModerator, isBroadcast, userRole,
  onEdit, onDelete, onUserClick, onToggleReaction, formatTime, showAvatar 
}: MessageBubbleProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex gap-2.5 group px-1",
        isOwn ? "flex-row-reverse" : "flex-row",
        showAvatar ? "mt-3" : "mt-0.5"
      )}
    >
      {showAvatar ? (
        <Avatar 
          className="w-9 h-9 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ring-1 ring-border/20"
          onClick={() => onUserClick(message.user_id)}
        >
          <AvatarImage src={message.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {authorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 flex-shrink-0" />
      )}

      <div className={cn("flex flex-col max-w-[78%]", isOwn ? "items-end" : "items-start")}>
        {showAvatar && (
          <div className={cn("flex items-center gap-1.5 mb-1 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
            <button 
              onClick={() => onUserClick(message.user_id)}
              className="text-xs font-semibold text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
            >
              {authorName}
              {(message.author as any)?.is_verified && <VerifiedBadge size="sm" />}
            </button>
            {userRole === 'owner' && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[9px] px-1.5 py-0 gap-0.5 font-medium">
                <Crown className="w-2.5 h-2.5" />
                {isArabic ? 'مالك' : 'Owner'}
              </Badge>
            )}
            {userRole === 'moderator' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[9px] px-1.5 py-0 gap-0.5 font-medium">
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
              className="flex-1 rounded-xl"
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
          <div className={cn("flex items-end gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
            <div className="flex flex-col">
              <div
                className={cn(
                  "shadow-sm overflow-hidden",
                  message.image_url ? "rounded-2xl" : "px-4 py-2",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-card border border-border/40 text-foreground rounded-2xl rounded-bl-md",
                  !showAvatar && isOwn && "rounded-2xl rounded-br-md",
                  !showAvatar && !isOwn && "rounded-2xl rounded-bl-md"
                )}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt=""
                    className="max-w-[280px] w-full cursor-pointer rounded-t-2xl"
                    onClick={() => setViewingImage(true)}
                  />
                )}
                {message.content && message.content !== '📷' && (
                  <p className={cn("text-sm whitespace-pre-wrap break-words leading-relaxed", message.image_url && "px-4 py-2")}>{message.content}</p>
                )}
                {message.content === '📷' && !message.image_url && (
                  <p className="text-sm px-4 py-2">📷</p>
                )}
              </div>

              {/* Image Viewer */}
              {viewingImage && message.image_url && (
                <PremiumImageViewer
                  open={viewingImage}
                  src={message.image_url}
                  alt=""
                  onClose={() => setViewingImage(false)}
                />
              )}

              {/* Reactions display */}
              {isBroadcast && message.reactions && message.reactions.length > 0 && (
                <div className={cn("flex flex-wrap gap-1 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
                  {message.reactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => onToggleReaction?.(reaction.emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                        reaction.user_reacted
                          ? "bg-primary/20 border border-primary/40 text-foreground"
                          : "bg-muted/60 border border-border/30 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span>{reaction.emoji}</span>
                      <span className="font-medium">{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
              {isBroadcast && onToggleReaction && (
                <div className="relative">
                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setShowReactionPicker(!showReactionPicker)}>
                    <SmilePlus className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  {showReactionPicker && (
                    <div className={cn(
                      "absolute bottom-8 z-50 flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-lg p-1",
                      isOwn ? "right-0" : "left-0"
                    )}>
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => { onToggleReaction(emoji); setShowReactionPicker(false); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {canEdit && (
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
              {canDelete && (
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={handleDelete}>
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Time + Views */}
        <div className={cn("flex items-center gap-2 mt-0.5 px-1", isOwn ? "justify-end" : "justify-start")}>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.created_at)}
          </span>
          {isBroadcast && message.views_count !== undefined && message.views_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
              <Eye className="w-3 h-3" />
              {message.views_count}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};