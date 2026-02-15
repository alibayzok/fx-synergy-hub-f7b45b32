import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Eye, 
  Trash2, 
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/date-utils';

interface FlaggedContent {
  id: string;
  content_type: string;
  content_id: string;
  user_id: string;
  flag_reason: string;
  flagged_url: string | null;
  confidence: number | null;
  predictions: any;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const FlaggedContentManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [flaggedItems, setFlaggedItems] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [selectedItem, setSelectedItem] = useState<FlaggedContent | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchFlaggedContent();
  }, [filter]);

  const fetchFlaggedContent = async () => {
    setLoading(true);
    let query = supabase
      .from('flagged_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('reviewed', false);
    } else if (filter === 'reviewed') {
      query = query.eq('reviewed', true);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      // Fetch user profiles for each flagged item
      const itemsWithProfiles = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('user_id', item.user_id)
            .single();
          return { ...item, profile };
        })
      );
      setFlaggedItems(itemsWithProfiles);
    }
    setLoading(false);
  };

  const handleReview = async (id: string, action: 'approve' | 'delete' | 'warn') => {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('flagged_content')
      .update({
        reviewed: true,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        action_taken: action
      })
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      // If action is delete, also hide/delete the actual content
      if (action === 'delete' && selectedItem) {
        if (selectedItem.content_type === 'post') {
          await supabase
            .from('user_posts')
            .update({ is_hidden: true, moderation_status: 'rejected', moderation_reason: actionNote || 'محتوى مخالف' })
            .eq('id', selectedItem.content_id);
        }
      }

      toast({
        title: 'تم',
        description: action === 'approve' 
          ? 'تم الموافقة على المحتوى' 
          : action === 'delete' 
            ? 'تم حذف/إخفاء المحتوى' 
            : 'تم إرسال تحذير للمستخدم'
      });
      setSelectedItem(null);
      setActionNote('');
      fetchFlaggedContent();
    }
    setProcessing(false);
  };

  const handleDeletePermanently = async (item: FlaggedContent) => {
    setProcessing(true);
    
    // Delete the actual content based on type
    if (item.content_type === 'post') {
      await supabase.from('user_posts').delete().eq('id', item.content_id);
    }
    
    // Delete the flagged record
    await supabase.from('flagged_content').delete().eq('id', item.id);
    
    toast({ title: 'تم الحذف نهائياً' });
    fetchFlaggedContent();
    setProcessing(false);
  };

  const getReasonBadge = (reason: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      porn: { color: 'bg-red-500/20 text-red-500', label: '🚫 محتوى إباحي' },
      sexy: { color: 'bg-orange-500/20 text-orange-500', label: '⚠️ محتوى مثير' },
      violence: { color: 'bg-red-600/20 text-red-600', label: '🔪 عنف' },
      hate: { color: 'bg-purple-500/20 text-purple-500', label: '😡 كراهية' },
      error: { color: 'bg-gray-500/20 text-gray-500', label: '❓ خطأ في الفحص' },
      api_error: { color: 'bg-gray-500/20 text-gray-500', label: '❓ خطأ في الفحص' },
    };
    const badge = badges[reason] || { color: 'bg-gray-500/20 text-gray-500', label: reason };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const getContentTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      post: 'منشور',
      room_message: 'رسالة',
      thread: 'موضوع',
      reply: 'رد',
      profile: 'صورة شخصية'
    };
    return types[type] || type;
  };

  const getActionBadge = (action: string | null) => {
    if (!action) return null;
    const actions: Record<string, { color: string; label: string }> = {
      approve: { color: 'bg-green-500/20 text-green-500', label: '✓ تمت الموافقة' },
      delete: { color: 'bg-red-500/20 text-red-500', label: '✕ تم الحذف' },
      warn: { color: 'bg-yellow-500/20 text-yellow-500', label: '⚠ تم التحذير' }
    };
    const badge = actions[action] || { color: 'bg-gray-500/20 text-gray-500', label: action };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const pendingCount = flaggedItems.filter(i => !i.reviewed).length;

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-red-500/15 via-red-600/5 to-transparent border border-red-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة المحتوى المخالف</h2>
              <p className="text-xs text-muted-foreground/70">
                {pendingCount > 0 ? `${pendingCount} محتوى بانتظار المراجعة` : 'لا يوجد محتوى بانتظار المراجعة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-[140px] rounded-xl border-border/30 bg-background/50 backdrop-blur-sm">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="reviewed">تمت مراجعته</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchFlaggedContent} disabled={loading} className="rounded-xl border-border/30">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          جاري التحميل...
        </div>
      ) : flaggedItems.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-lg font-medium">لا يوجد محتوى مخالف</p>
            <p className="text-sm text-muted-foreground">جميع المحتويات آمنة ✨</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {flaggedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className={`bg-card/50 backdrop-blur-sm rounded-2xl ${item.reviewed ? 'border-border/25' : 'border-red-500/25'} transition-all hover:scale-[1.005]`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image Preview */}
                      {item.flagged_url && (
                        <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={item.flagged_url} 
                            alt="Flagged content" 
                            className="w-full h-full object-cover blur-md hover:blur-none transition-all duration-300 cursor-pointer"
                            onClick={() => setSelectedItem(item)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-transparent transition-all">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getReasonBadge(item.flag_reason)}
                          <Badge variant="outline">{getContentTypeBadge(item.content_type)}</Badge>
                          {item.confidence && (
                            <Badge variant="secondary">
                              ثقة: {Math.round((item.confidence || 0) * 100)}%
                            </Badge>
                          )}
                          {item.reviewed && getActionBadge(item.action_taken)}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{item.profile?.display_name || item.profile?.username || 'مستخدم'}</span>
                          <span>•</span>
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(item.created_at, 'dd MMM yyyy HH:mm', 'ar')}</span>
                        </div>

                        {/* Actions */}
                        {!item.reviewed ? (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedItem(item)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              مراجعة
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReview(item.id, 'approve')}
                              className="gap-1 text-green-500 hover:text-green-600"
                              disabled={processing}
                            >
                              <Check className="w-4 h-4" />
                              موافقة
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => { setSelectedItem(item); }}
                              className="gap-1 text-red-500 hover:text-red-600"
                              disabled={processing}
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedItem(item)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail/Review Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setActionNote(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              مراجعة المحتوى المخالف
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Image */}
              {selectedItem.flagged_url && (
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedItem.flagged_url} 
                    alt="Flagged content" 
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">نوع المحتوى</p>
                  <p className="font-medium">{getContentTypeBadge(selectedItem.content_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">سبب التعليم</p>
                  <p className="font-medium">{getReasonBadge(selectedItem.flag_reason)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المستخدم</p>
                  <p className="font-medium">{selectedItem.profile?.display_name || selectedItem.profile?.username || 'مستخدم'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">مستوى الثقة</p>
                  <p className="font-medium">{selectedItem.confidence ? `${Math.round(selectedItem.confidence * 100)}%` : 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">تاريخ الاكتشاف</p>
                  <p className="font-medium">{formatDate(selectedItem.created_at, 'dd MMM yyyy HH:mm', 'ar')}</p>
                </div>
                {selectedItem.reviewed && (
                  <div>
                    <p className="text-muted-foreground">الإجراء المتخذ</p>
                    <p className="font-medium">{getActionBadge(selectedItem.action_taken)}</p>
                  </div>
                )}
              </div>

              {/* Action Section */}
              {!selectedItem.reviewed && (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="ملاحظات (اختياري)..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => handleReview(selectedItem.id, 'approve')}
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      disabled={processing}
                    >
                      <Check className="w-4 h-4" />
                      موافقة (المحتوى آمن)
                    </Button>
                    <Button 
                      onClick={() => handleReview(selectedItem.id, 'delete')}
                      variant="destructive"
                      className="gap-1"
                      disabled={processing}
                    >
                      <Trash2 className="w-4 h-4" />
                      إخفاء المحتوى
                    </Button>
                    <Button 
                      onClick={() => handleDeletePermanently(selectedItem)}
                      variant="outline"
                      className="gap-1 text-red-500 hover:text-red-600"
                      disabled={processing}
                    >
                      <X className="w-4 h-4" />
                      حذف نهائي
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlaggedContentManagement;
