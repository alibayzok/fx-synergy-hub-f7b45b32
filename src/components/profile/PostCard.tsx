import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2,
  TrendingUp,
  Globe,
  Users,
  UserCheck,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { UserPost, useUserPosts, usePostComments } from '@/hooks/useUserPosts';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: UserPost;
  onDelete?: () => void;
}

const visibilityIcons = {
  everyone: Globe,
  followers_only: UserCheck,
  friends_only: Users,
  nobody: Lock,
};

export const PostCard = ({ post, onDelete }: PostCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleLike, deletePost, isDeleting } = useUserPosts(post.user_id);
  
  const [showComments, setShowComments] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isOwner = user?.id === post.user_id;
  const isRTL = i18n.language === 'ar';
  const VisibilityIcon = visibilityIcons[post.visibility];

  const handleLike = () => {
    if (!user) return;
    toggleLike({ postId: post.id, isLiked: post.is_liked || false });
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onDelete?.();
    setDeleteDialogOpen(false);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: isRTL ? ar : enUS,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 space-y-3 card-hover"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/user/${post.user_id}`)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {post.profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {post.profile?.display_name || post.profile?.username || t('common.user', 'مستخدم')}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{timeAgo}</span>
                <VisibilityIcon className="w-3 h-3" />
              </div>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete', 'حذف')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Analysis Badge */}
        {post.symbol && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              {post.symbol}
            </Badge>
            {post.asset_type && (
              <Badge variant="outline">{post.asset_type}</Badge>
            )}
            {post.timeframe && (
              <Badge variant="outline">{post.timeframe}</Badge>
            )}
          </div>
        )}

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className={cn(
            "grid gap-2",
            post.attachments.length === 1 ? "grid-cols-1" : 
            post.attachments.length === 2 ? "grid-cols-2" :
            "grid-cols-2 sm:grid-cols-3"
          )}>
            {post.attachments.map((url, index) => (
              <motion.img
                key={index}
                src={url}
                alt=""
                className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(url)}
                whileHover={{ scale: 1.02 }}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "gap-2 h-8",
              post.is_liked && "text-loss"
            )}
          >
            <Heart className={cn("w-4 h-4", post.is_liked && "fill-current")} />
            <span className="trading-number">{post.likes_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 h-8"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="trading-number">{post.comments_count}</span>
            {showComments ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <PostCommentsSection postId={post.id} />
        )}
      </motion.div>

      {/* Image Lightbox */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('posts.deleteConfirm', 'حذف المنشور؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('posts.deleteWarning', 'لا يمكن التراجع عن هذا الإجراء.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {t('common.delete', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Comments Section Component
const PostCommentsSection = ({ postId }: { postId: string }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { comments, isLoading, addComment, isAddingComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await addComment(newComment.trim());
    setNewComment('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="pt-3 space-y-3 border-t border-border/50"
    >
      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder={t('posts.addComment', 'أضف تعليقاً...')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 h-9"
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newComment.trim() || isAddingComment}
          >
            {t('posts.comment', 'تعليق')}
          </Button>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-2 text-sm text-muted-foreground">
          {t('common.loading', 'جارٍ التحميل...')}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-2 text-sm text-muted-foreground">
          {t('posts.noComments', 'لا توجد تعليقات بعد')}
        </div>
      )}
    </motion.div>
  );
};

// Single Comment Component
const CommentItem = ({ comment }: { comment: any }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: isRTL ? ar : enUS,
  });

  return (
    <div className="flex gap-2 p-2 rounded-lg bg-muted/30">
      <Avatar 
        className="h-7 w-7 cursor-pointer"
        onClick={() => navigate(`/user/${comment.user_id}`)}
      >
        <AvatarImage src={comment.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/20 text-primary">
          {comment.profile?.display_name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-medium cursor-pointer hover:underline"
            onClick={() => navigate(`/user/${comment.user_id}`)}
          >
            {comment.profile?.display_name || comment.profile?.username || 'مستخدم'}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm">{comment.content}</p>
      </div>
    </div>
  );
};
