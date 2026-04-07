import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Plus, TrendingUp, Heart, MessageCircle,
  Image, Send, X, Loader2, Sparkles, BarChart3, Clock, Eye,
  ArrowLeftRight, Upload, GraduationCap, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPosts, usePostComments, type UserPost, type AssetType, type Timeframe } from '@/hooks/useUserPosts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { PremiumImageViewer } from '@/components/ui/premium-image-viewer';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { toast } from 'sonner';

const assetTypes: { value: AssetType; label: string; emoji: string }[] = [
  { value: 'forex', label: 'Forex', emoji: '💱' },
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'metals', label: 'Metals', emoji: '🥇' },
];

const timeframes: Timeframe[] = ['M5', 'M15', 'H1', 'H4', 'D1'];

type AnalysisSchool = 'ict' | 'elliott' | 'classic' | 'time_based' | 'harmonic' | 'price_action' | 'other';

const analysisSchools: { value: AnalysisSchool; labelAr: string; labelEn: string; emoji: string; color: string }[] = [
  { value: 'ict', labelAr: 'ICT', labelEn: 'ICT', emoji: '🎯', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'elliott', labelAr: 'إليوت', labelEn: 'Elliott Wave', emoji: '🌊', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'classic', labelAr: 'كلاسيكي', labelEn: 'Classic', emoji: '📐', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'time_based', labelAr: 'زمني', labelEn: 'Time-Based', emoji: '⏰', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'harmonic', labelAr: 'هارمونيك', labelEn: 'Harmonic', emoji: '🦋', color: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  { value: 'price_action', labelAr: 'حركة السعر', labelEn: 'Price Action', emoji: '📊', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other', emoji: '💡', color: 'bg-muted text-muted-foreground border-border' },
];

interface UserAnalysesPanelProps {
  onBack: () => void;
}

// ── Community Feed Hook ──────────────────────────────────────────────────
const useCommunityAnalyses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['community-analyses'],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('user_posts')
        .select('*')
        .not('symbol', 'is', null)
        .eq('visibility', 'everyone')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!postsData) return [];

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, is_verified')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));
        likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      }

      return postsData.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
        is_liked: likedPostIds.has(post.id),
      })) as any[];
    },
  });
};

// ── Update Result Dialog (add "after" image later) ───────────────────────
const UpdateResultDialog = ({ post, onUpdated }: { post: any; onUpdated: () => void }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { uploadAttachment } = useUserPosts(post.user_id);
  const [open, setOpen] = useState(false);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAttachment(file);
      if (url) setAfterImage(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!afterImage) return;
    setSaving(true);
    try {
      const currentAttachments = post.attachments || [];
      const newAttachments = currentAttachments.length >= 2
        ? [currentAttachments[0], afterImage]
        : [...currentAttachments, afterImage];

      const { error } = await supabase
        .from('user_posts')
        .update({ attachments: newAttachments })
        .eq('id', post.id);

      if (error) throw error;
      toast.success(isArabic ? 'تم تحديث النتيجة بنجاح ✅' : 'Result updated successfully ✅');
      setOpen(false);
      setAfterImage(null);
      onUpdated();
    } catch {
      toast.error(isArabic ? 'فشل في التحديث' : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
          <RefreshCw className="w-3 h-3" />
          {isArabic ? 'حدّث النتيجة' : 'Update Result'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            {isArabic ? 'تحديث نتيجة التحليل' : 'Update Analysis Result'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'ارفع صورة النتيجة بعد تحرك السعر لتوثيق تحليلك' : 'Upload the result screenshot after price moved to document your analysis'}
          </p>
          {afterImage ? (
            <div className="relative group rounded-xl overflow-hidden border border-emerald-500/30 aspect-video">
              <img src={afterImage} alt="After" className="w-full h-full object-cover" />
              <button
                onClick={() => setAfterImage(null)}
                className="absolute top-2 end-2 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-500/50 transition-all">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              {uploading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : <Upload className="w-8 h-8 text-emerald-500/60" />}
              <span className="text-xs text-emerald-600 mt-2 font-medium">{isArabic ? 'ارفع صورة النتيجة' : 'Upload Result'}</span>
            </label>
          )}
          <Button onClick={handleSave} disabled={!afterImage || saving} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {isArabic ? 'حفظ النتيجة' : 'Save Result'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Analysis Card ────────────────────────────────────────────────────────
const AnalysisCard = ({ post, onLike, onUpdated }: { post: any; onLike: (id: string, liked: boolean) => void; onUpdated: () => void }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === 'ar';
  const [showComments, setShowComments] = useState(false);
  const [viewingBefore, setViewingBefore] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const hasTwoImages = (post.attachments?.length || 0) >= 2;
  const hasImages = (post.attachments?.length || 0) > 0;
  const isOwner = user?.id === post.user_id;
  const canUpdateResult = isOwner && (post.attachments?.length || 0) < 2 && hasImages;

  const school = analysisSchools.find(s => s.value === post.analysis_school);

  const openViewer = (src: string) => {
    setViewerSrc(src);
    setViewerOpen(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar className="w-10 h-10 ring-2 ring-primary/10">
          <AvatarImage src={post.profile?.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {(post.profile?.display_name || '?')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-sm truncate">
              {post.profile?.display_name || post.profile?.username || '—'}
            </span>
            {post.profile?.is_verified && <VerifiedBadge size="sm" />}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: isArabic ? ar : enUS,
            })}
          </span>
        </div>
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {school && (
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1 border', school.color)}>
              {school.emoji} {isArabic ? school.labelAr : school.labelEn}
            </Badge>
          )}
          {post.asset_type && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {assetTypes.find(a => a.value === post.asset_type)?.emoji} {post.asset_type}
            </Badge>
          )}
          {post.symbol && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2 py-0.5">
              {post.symbol}
            </Badge>
          )}
          {post.timeframe && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
              <Clock className="w-3 h-3" /> {post.timeframe}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Before/After Image Viewer */}
      {hasImages && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-muted/30 border border-border/30">
          {hasTwoImages ? (
            <>
              <div className="flex items-center bg-muted/60 border-b border-border/30">
                <button
                  onClick={() => setViewingBefore(true)}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5',
                    viewingBefore ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isArabic ? 'قبل التداول' : 'Before Trade'}
                </button>
                <div className="w-px h-6 bg-border/50" />
                <button
                  onClick={() => setViewingBefore(false)}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5',
                    !viewingBefore ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {isArabic ? 'بعد التداول' : 'After Trade'}
                </button>
              </div>

              <div className="relative aspect-video overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewingBefore ? 'before' : 'after'}
                    initial={{ opacity: 0, x: viewingBefore ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: viewingBefore ? 20 : -20 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full cursor-pointer"
                    onClick={() => openViewer(post.attachments[viewingBefore ? 0 : 1])}
                  >
                    <img
                      src={post.attachments[viewingBefore ? 0 : 1]}
                      alt={viewingBefore ? 'Before' : 'After'}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={() => setViewingBefore(!viewingBefore)}
                  className="absolute bottom-3 end-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-lg hover:bg-background transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </>
          ) : (
            <div className="aspect-video cursor-pointer" onClick={() => openViewer(post.attachments[0])}>
              <img
                src={post.attachments[0]}
                alt="Analysis"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      <PremiumImageViewer
        src={viewerSrc}
        alt="Analysis"
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id, !!post.is_liked)}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-all group-hover:scale-110',
                post.is_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground group-hover:text-red-400'
              )}
            />
            <span className={cn(
              'text-xs font-medium',
              post.is_liked ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {post.likes_count || 0}
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">{post.comments_count || 0}</span>
          </button>
        </div>
        {/* Update result button for owner */}
        {canUpdateResult && (
          <UpdateResultDialog post={post} onUpdated={onUpdated} />
        )}
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CommentsSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Comments Section ─────────────────────────────────────────────────────
const CommentsSection = ({ postId }: { postId: string }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useAuth();
  const { comments, isLoading, addComment, isAddingComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="border-t border-border/30 bg-muted/20 p-3 space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.profile?.avatar_url || ''} />
                <AvatarFallback className="text-[10px] bg-muted">{(comment.profile?.display_name || '?')[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground">{comment.profile?.display_name || '—'}</span>
                <p className="text-xs text-foreground/80">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">
          {isArabic ? 'لا توجد تعليقات بعد' : 'No comments yet'}
        </p>
      )}

      {user && (
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={isArabic ? 'أضف تعليقاً...' : 'Add a comment...'}
            className="h-8 text-xs"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <Button size="sm" className="h-8 px-2" onClick={handleSubmit} disabled={!newComment.trim() || isAddingComment}>
            {isAddingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Create Analysis Dialog ───────────────────────────────────────────────
const CreateAnalysisDialog = ({ onCreated }: { onCreated: () => void }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useAuth();
  const { createPost, isCreating, uploadAttachment } = useUserPosts(user?.id);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('forex');
  const [timeframe, setTimeframe] = useState<Timeframe>('H4');
  const [school, setSchool] = useState<AnalysisSchool>('classic');
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAttachment(file);
      if (url) {
        if (type === 'before') setBeforeImage(url);
        else setAfterImage(url);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !symbol.trim()) {
      toast.error(isArabic ? 'يرجى ملء التحليل والرمز' : 'Please fill analysis and symbol');
      return;
    }

    const attachments = [beforeImage, afterImage].filter(Boolean) as string[];

    try {
      // Create the post first, then update with analysis_school
      await createPost({
        content: content.trim(),
        attachments,
        symbol: symbol.toUpperCase(),
        asset_type: assetType,
        timeframe,
        visibility: 'everyone',
      });

      // Update the latest post with analysis_school (since createPost doesn't support it directly)
      if (user) {
        const { data: latestPost } = await supabase
          .from('user_posts')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestPost) {
          await supabase
            .from('user_posts')
            .update({ analysis_school: school } as any)
            .eq('id', latestPost.id);
        }
      }

      setOpen(false);
      setContent('');
      setSymbol('');
      setBeforeImage(null);
      setAfterImage(null);
      onCreated();
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          {isArabic ? 'شارك تحليلك' : 'Share Analysis'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isArabic ? 'شارك تحليلك مع المجتمع' : 'Share Your Analysis'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Symbol & Meta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isArabic ? 'الرمز' : 'Symbol'}</Label>
              <Input
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="EURUSD"
                dir="ltr"
                className="font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isArabic ? 'النوع' : 'Type'}</Label>
              <Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assetTypes.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.emoji} {a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isArabic ? 'الإطار الزمني' : 'Timeframe'}</Label>
              <Select value={timeframe} onValueChange={v => setTimeframe(v as Timeframe)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analysis School */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              {isArabic ? 'مدرسة التحليل' : 'Analysis School'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {analysisSchools.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSchool(s.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    school === s.value
                      ? cn(s.color, 'ring-2 ring-offset-1 ring-offset-background', s.color.replace('border-', 'ring-'))
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                  )}
                >
                  {s.emoji} {isArabic ? s.labelAr : s.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isArabic ? 'تحليلك' : 'Your Analysis'}</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={isArabic ? 'اشرح تحليلك ورؤيتك للسوق...' : 'Explain your analysis and market outlook...'}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Before/After Upload */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {isArabic ? 'صورة التحليل (قبل)' : 'Before Trade'}
              </Label>
              {beforeImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video">
                  <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setBeforeImage(null)}
                    className="absolute top-2 end-2 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/50 bg-muted/30 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'before')} disabled={uploading} />
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <Image className="w-6 h-6 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground mt-1">{isArabic ? 'رفع صورة' : 'Upload'}</span>
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {isArabic ? 'بعد التداول (اختياري)' : 'After Trade (optional)'}
              </Label>
              {afterImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video">
                  <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAfterImage(null)}
                    className="absolute top-2 end-2 p-1 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/50 bg-muted/30 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'after')} disabled={uploading} />
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <Image className="w-6 h-6 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground mt-1">{isArabic ? 'رفع صورة' : 'Upload'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={!content.trim() || !symbol.trim() || isCreating || uploading} className="w-full gap-2">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isArabic ? 'نشر التحليل' : 'Publish Analysis'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Panel ───────────────────────────────────────────────────────────
export const UserAnalysesPanel = ({ onBack }: UserAnalysesPanelProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useAuth();
  const { data: analyses = [], isLoading, refetch } = useCommunityAnalyses();
  const queryClient = useQueryClient();
  const [activeSchool, setActiveSchool] = useState<AnalysisSchool | 'all'>('all');

  const filteredAnalyses = activeSchool === 'all'
    ? analyses
    : analyses.filter((a: any) => a.analysis_school === activeSchool);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      }
      queryClient.invalidateQueries({ queryKey: ['community-analyses'] });
    } catch {
      // silent
    }
  };

  const handleRefetch = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['community-analyses'] });
  };

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  // Count analyses per school
  const schoolCounts = analysisSchools.reduce((acc, s) => {
    acc[s.value] = analyses.filter((a: any) => a.analysis_school === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-full" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <BackIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {isArabic ? 'ساحة التحليلات' : 'Analysis Arena'}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {isArabic ? 'شارك تحليلاتك وتعلّم من الآخرين' : 'Share your analyses & learn from others'}
              </p>
            </div>
          </div>
          {user && <CreateAnalysisDialog onCreated={handleRefetch} />}
        </div>

        {/* School Filter Tabs */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full" dir="ltr">
            <div className="flex gap-2 pb-1" dir={isArabic ? 'rtl' : 'ltr'}>
              <button
                onClick={() => setActiveSchool('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0',
                  activeSchool === 'all'
                    ? 'bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/20'
                    : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                )}
              >
                🏆 {isArabic ? 'الكل' : 'All'} ({analyses.length})
              </button>
              {analysisSchools.filter(s => s.value !== 'other' || schoolCounts[s.value] > 0).map(s => (
                <button
                  key={s.value}
                  onClick={() => setActiveSchool(s.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0',
                    activeSchool === s.value
                      ? cn(s.color, 'ring-1 ring-offset-1 ring-offset-background')
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                  )}
                >
                  {s.emoji} {isArabic ? s.labelAr : s.labelEn}
                  {schoolCounts[s.value] > 0 && (
                    <span className="ms-1 opacity-70">({schoolCounts[s.value]})</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </header>

      {/* Feed */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 pb-24">
          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5"
          >
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-lg">
                  {isArabic ? 'ساحة التحليلات 🏆' : 'Analysis Arena 🏆'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isArabic
                    ? 'شارك رؤيتك مع صور قبل وبعد، وحدّث نتيجة تحليلك لاحقاً'
                    : 'Share your vision with before & after shots, update results later'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Posts */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="w-10 h-10 text-primary/40" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {isArabic ? 'لا توجد تحليلات بعد' : 'No analyses yet'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSchool !== 'all'
                    ? (isArabic ? 'لا توجد تحليلات في هذه المدرسة' : 'No analyses in this school yet')
                    : (isArabic ? 'كن أول من يشارك تحليله!' : 'Be the first to share an analysis!')
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredAnalyses.map((post: any) => (
              <AnalysisCard key={post.id} post={post} onLike={handleLike} onUpdated={handleRefetch} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
