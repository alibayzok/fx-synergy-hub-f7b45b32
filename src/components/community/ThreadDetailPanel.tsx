import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Send, Heart, CheckCircle, MessageSquare, Trash2, Pencil, X, Check } from 'lucide-react';
import { Thread, useReplies, Reply } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/date-utils';

interface ThreadDetailPanelProps {
  thread: Thread;
  onBack: () => void;
  onDelete?: () => void;
}

const tagColors: Record<string, string> = {
  question: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analysis: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  alert: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  help: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const ThreadDetailPanel = ({ thread, onBack, onDelete }: ThreadDetailPanelProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { replies, loading, createReply, updateReply, deleteReply, toggleLike, markBestAnswer } = useReplies(thread.id);
  const [newReply, setNewReply] = useState('');
  const [sending, setSending] = useState(false);
  const isArabic = i18n.language === 'ar';

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  const handleSubmitReply = async () => {
    if (!newReply.trim() || sending) return;

    setSending(true);
    await createReply(newReply);
    setNewReply('');
    setSending(false);
  };

  const authorName = thread.author?.display_name || thread.author?.username || 'مستخدم';
  const isOwner = thread.user_id === user?.id;
  const canDelete = isOwner || isAdmin;

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <BackArrow className="w-5 h-5" />
        </Button>
        <span className="text-sm text-muted-foreground flex-1">{t('community.backToThreads')}</span>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {/* Thread Content */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-start gap-3">
            <Avatar 
              className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ring-1 ring-border/20"
              onClick={() => handleUserClick(thread.user_id)}
            >
              <AvatarImage src={thread.author?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <button 
                  onClick={() => handleUserClick(thread.user_id)}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {authorName}
                </button>
                <Badge variant="outline" className={cn("text-[10px] px-1.5", tagColors[thread.tag])}>
                  {t(`community.${thread.tag}`)}
                </Badge>
                {thread.is_pinned && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">📌</Badge>
                )}
                <span className="text-[11px] text-muted-foreground/60">{formatTime(thread.created_at)}</span>
              </div>

              <h2 className="text-lg font-bold text-foreground mb-2">{thread.title}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{thread.content}</p>

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {thread.replies_count} {t('community.replies')}
                </span>
                {thread.has_best_answer && (
                  <span className="flex items-center gap-1 text-profit">
                    <CheckCircle className="w-4 h-4" />
                    {t('community.hasBestAnswer')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-foreground">
            {t('community.replies')} ({replies.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('community.noReplies')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  isThreadOwner={isOwner}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  onLike={() => toggleLike(reply.id, reply.user_liked || false)}
                  onMarkBest={() => markBestAnswer(reply.id)}
                  onEdit={(content) => updateReply(reply.id, content)}
                  onDelete={() => deleteReply(reply.id)}
                  onUserClick={handleUserClick}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      {!thread.is_locked && user && (
        <div className="px-3 py-2.5 border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <Textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder={t('community.writeReply')}
              className="flex-1 min-h-[44px] max-h-[120px] rounded-xl bg-muted/50 border-border/30 resize-none"
              disabled={sending}
            />
            <Button
              onClick={handleSubmitReply}
              disabled={!newReply.trim() || sending}
              size="icon"
              className="shrink-0 rounded-full w-10 h-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {thread.is_locked && (
        <div className="p-3 border-t border-border/40 text-center text-muted-foreground text-sm">
          🔒 {t('community.threadLocked')}
        </div>
      )}
    </div>
  );
};

interface ReplyCardProps {
  reply: Reply;
  isThreadOwner: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  onLike: () => void;
  onMarkBest: () => void;
  onEdit: (content: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onUserClick: (userId: string) => void;
  formatTime: (date: string) => string;
}

const ReplyCard = ({
  reply,
  isThreadOwner,
  isAdmin,
  currentUserId,
  onLike,
  onMarkBest,
  onEdit,
  onDelete,
  onUserClick,
  formatTime
}: ReplyCardProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [saving, setSaving] = useState(false);
  
  const authorName = reply.author?.display_name || reply.author?.username || 'مستخدم';
  const canMarkBest = (isThreadOwner || isAdmin) && !reply.is_best_answer;
  const isOwner = reply.user_id === currentUserId;
  const canModify = isOwner || isAdmin;

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
    setEditContent(reply.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(t('community.confirmDeleteReply'))) {
      await onDelete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        reply.is_best_answer
          ? "bg-profit/5 border-profit/30"
          : "bg-card/50 border-border/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar 
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => onUserClick(reply.user_id)}
        >
          <AvatarImage src={reply.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {authorName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => onUserClick(reply.user_id)}
              className="font-medium text-sm text-foreground hover:text-primary transition-colors"
            >
              {authorName}
            </button>
            {reply.is_best_answer && (
              <Badge className="bg-profit/20 text-profit border-profit/30 text-[10px] px-1.5">
                <CheckCircle className="w-3 h-3 me-1" />
                {t('community.bestAnswer')}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
            {reply.updated_at !== reply.created_at && (
              <span className="text-xs text-muted-foreground">({t('community.edited')})</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                disabled={saving}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editContent.trim()}>
                  <Check className="w-4 h-4 me-1" />
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={saving}>
                  <X className="w-4 h-4 me-1" />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{reply.content}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onLike}
              disabled={!currentUserId}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                reply.user_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              )}
            >
              <Heart className={cn("w-4 h-4", reply.user_liked && "fill-current")} />
              <span>{reply.likes_count}</span>
            </button>

            {canMarkBest && (
              <button
                onClick={onMarkBest}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-profit transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {t('community.markBest')}
              </button>
            )}

            {canModify && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('common.delete')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
