import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Image, 
  Send, 
  X, 
  TrendingUp,
  Globe,
  Users,
  UserCheck,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserPosts, PostVisibility, AssetType, Timeframe } from '@/hooks/useUserPosts';

interface CreatePostDialogProps {
  userId: string;
  trigger?: React.ReactNode;
}

const visibilityOptions: { value: PostVisibility; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'everyone', labelKey: 'posts.visibility.everyone', icon: <Globe className="w-4 h-4" /> },
  { value: 'followers_only', labelKey: 'posts.visibility.followers', icon: <UserCheck className="w-4 h-4" /> },
  { value: 'friends_only', labelKey: 'posts.visibility.friends', icon: <Users className="w-4 h-4" /> },
  { value: 'nobody', labelKey: 'posts.visibility.private', icon: <Lock className="w-4 h-4" /> },
];

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'metals', label: 'Metals' },
];

const timeframes: Timeframe[] = ['M5', 'M15', 'H1', 'H4', 'D1'];

export const CreatePostDialog = ({ userId, trigger }: CreatePostDialogProps) => {
  const { t } = useTranslation();
  const { createPost, isCreating, uploadAttachment } = useUserPosts(userId);
  
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('everyone');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Trading-specific fields
  const [isAnalysis, setIsAnalysis] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<AssetType | undefined>();
  const [timeframe, setTimeframe] = useState<Timeframe | undefined>();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadingFiles(prev => [...prev, ...files]);

    try {
      const uploadPromises = files.map(file => uploadAttachment(file));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);
      setAttachments(prev => [...prev, ...validUrls]);
    } finally {
      setIsUploading(false);
      setUploadingFiles([]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      await createPost({
        content: content.trim(),
        attachments,
        visibility,
        symbol: isAnalysis ? symbol : undefined,
        asset_type: isAnalysis ? assetType : undefined,
        timeframe: isAnalysis ? timeframe : undefined,
      });

      // Reset form
      setContent('');
      setAttachments([]);
      setVisibility('everyone');
      setIsAnalysis(false);
      setSymbol('');
      setAssetType(undefined);
      setTimeframe(undefined);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Send className="w-4 h-4" />
            {t('posts.create', 'نشر جديد')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('posts.createTitle', 'إنشاء منشور جديد')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content */}
          <div>
            <Textarea
              placeholder={t('posts.placeholder', 'ماذا يدور في ذهنك؟')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {attachments.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -end-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isAnalysis ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAnalysis(!isAnalysis)}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              {t('posts.addAnalysis', 'إضافة تحليل')}
            </Button>
          </div>

          {/* Analysis Fields */}
          <AnimatePresence>
            {isAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border"
              >
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">{t('posts.symbol', 'الرمز')}</Label>
                    <Input
                      placeholder="EURUSD"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('posts.assetType', 'النوع')}</Label>
                    <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t('posts.timeframe', 'الإطار')}</Label>
                    <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframes.map(tf => (
                          <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visibility & Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {/* Upload Image */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <Button type="button" variant="ghost" size="icon" asChild disabled={isUploading}>
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                  </span>
                </Button>
              </label>

              {/* Visibility */}
              <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
                <SelectTrigger className="w-auto gap-2 h-9">
                  {visibilityOptions.find(o => o.value === visibility)?.icon}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{t(option.labelKey, option.value)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isCreating || isUploading}
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t('posts.publish', 'نشر')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
