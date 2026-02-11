import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Crown, Check, X, Clock, UserPlus, Search, Filter,
  Calendar, MoreVertical, RefreshCw, Ban, Eye, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  active: { label: 'نشط', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: Check },
  expired: { label: 'منتهي', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: Ban },
  cancelled: { label: 'ملغي', color: 'bg-muted text-muted-foreground border-border', icon: X },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: X },
};

export const SubscriptionsManagement = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activateDialog, setActivateDialog] = useState<Subscription | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Subscription | null>(null);
  const [detailDialog, setDetailDialog] = useState<Subscription | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [durationDays, setDurationDays] = useState(30);
  const [rejectReason, setRejectReason] = useState('');
  const [newSubUserId, setNewSubUserId] = useState('');
  const [newSubPlan, setNewSubPlan] = useState('monthly');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null>(null);

  // Search users for manual add
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-users', userSearch],
    queryFn: async () => {
      if (!userSearch || userSearch.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .or(`display_name.ilike.%${userSearch}%,username.ilike.%${userSearch}%`)
        .limit(8);
      return data || [];
    },
    enabled: userSearch.length >= 2 && addDialog,
  });

  // Fetch subscriptions with profiles
  const { data: subscriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vip_subscriptions' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for all user_ids
      const userIds = [...new Set((data as any[]).map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data as any[]).map((sub: any) => ({
        ...sub,
        profile: profileMap.get(sub.user_id) || null,
      })) as Subscription[];
    },
  });

  // Stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    expired: subscriptions.filter(s => s.status === 'expired').length,
  };

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const { error } = await supabase.rpc('activate_vip_subscription' as any, {
        p_subscription_id: id,
        p_duration_days: days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم تفعيل الاشتراك بنجاح ✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setActivateDialog(null);
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.rpc('reject_vip_subscription' as any, {
        p_subscription_id: id,
        p_reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم رفض الطلب' });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setRejectDialog(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('deactivate_vip_subscription' as any, {
        p_subscription_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم إلغاء الاشتراك' });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  // Add manual subscription
  const addManualMutation = useMutation({
    mutationFn: async () => {
      // First create subscription record
      const { data, error } = await supabase
        .from('vip_subscriptions' as any)
        .insert({ user_id: newSubUserId, plan: newSubPlan, status: 'pending' } as any)
        .select()
        .single();

      if (error) throw error;

      // Then activate it
      const { error: activateError } = await supabase.rpc('activate_vip_subscription' as any, {
        p_subscription_id: (data as any).id,
        p_duration_days: durationDays,
      });
      if (activateError) throw activateError;
    },
    onSuccess: () => {
      toast({ title: 'تم إضافة الاشتراك وتفعيله ✅' });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setAddDialog(false);
      setNewSubUserId('');
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  // Filter
  const filtered = subscriptions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchSearch = !search || 
      s.profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile?.username?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_id.includes(search);
    return matchStatus && matchSearch;
  });

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRemainingDays = (expires: string | null) => {
    if (!expires) return null;
    const diff = Math.ceil((new Date(expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الإجمالي', value: stats.total, color: 'from-blue-500 to-blue-600', icon: Crown },
          { label: 'نشط', value: stats.active, color: 'from-emerald-500 to-emerald-600', icon: Check },
          { label: 'قيد الانتظار', value: stats.pending, color: 'from-yellow-500 to-amber-500', icon: Clock },
          { label: 'منتهي', value: stats.expired, color: 'from-red-500 to-red-600', icon: Ban },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold trading-number">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 me-1" />
            تحديث
          </Button>
          <Button size="sm" onClick={() => setAddDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <UserPlus className="w-4 h-4 me-1" />
            إضافة يدوي
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>الباقة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead>ينتهي</TableHead>
              <TableHead>المتبقي</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  لا توجد اشتراكات
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub) => {
                const config = statusConfig[sub.status] || statusConfig.pending;
                const remaining = getRemainingDays(sub.expires_at);
                const StatusIcon = config.icon;

                return (
                  <TableRow key={sub.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {(sub.profile?.display_name || sub.profile?.username || '?')[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sub.profile?.display_name || sub.profile?.username || 'مستخدم'}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{sub.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sub.plan === 'monthly' ? 'شهري' : sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs gap-1 border', config.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground trading-number">
                      {formatDate(sub.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground trading-number">
                      {formatDate(sub.expires_at)}
                    </TableCell>
                    <TableCell>
                      {sub.status === 'active' && remaining !== null ? (
                        <span className={cn('text-xs font-bold trading-number', remaining <= 3 ? 'text-red-500' : remaining <= 7 ? 'text-yellow-500' : 'text-emerald-500')}>
                          {remaining} يوم
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {sub.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => setActivateDialog(sub)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => setRejectDialog(sub)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailDialog(sub)}>
                              <Eye className="w-4 h-4 me-2" />
                              تفاصيل
                            </DropdownMenuItem>
                            {sub.status === 'active' && (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => deactivateMutation.mutate(sub.id)}
                              >
                                <Ban className="w-4 h-4 me-2" />
                                إلغاء الاشتراك
                              </DropdownMenuItem>
                            )}
                            {(sub.status === 'expired' || sub.status === 'rejected' || sub.status === 'cancelled') && (
                              <DropdownMenuItem onClick={() => setActivateDialog(sub)}>
                                <RefreshCw className="w-4 h-4 me-2" />
                                إعادة تفعيل
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Activate Dialog */}
      <Dialog open={!!activateDialog} onOpenChange={() => setActivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              تفعيل اشتراك VIP
            </DialogTitle>
            <DialogDescription>
              تفعيل اشتراك VIP للمستخدم {activateDialog?.profile?.display_name || 'مستخدم'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">المستخدم</label>
              <p className="text-sm text-muted-foreground mt-1">
                {activateDialog?.profile?.display_name || activateDialog?.profile?.username || 'مستخدم'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">مدة الاشتراك (بالأيام)</label>
              <div className="flex gap-2 mt-2">
                {[7, 15, 30, 90, 180, 365].map(d => (
                  <Button
                    key={d}
                    size="sm"
                    variant={durationDays === d ? 'default' : 'outline'}
                    onClick={() => setDurationDays(d)}
                    className={cn(durationDays === d && 'bg-amber-500 hover:bg-amber-600 text-white')}
                  >
                    {d}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                className="mt-2 trading-number"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(null)}>إلغاء</Button>
            <Button
              onClick={() => activateDialog && activateMutation.mutate({ id: activateDialog.id, days: durationDays })}
              disabled={activateMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            >
              {activateMutation.isPending ? 'جارٍ التفعيل...' : 'تفعيل الاشتراك'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <X className="w-5 h-5" />
              رفض طلب VIP
            </DialogTitle>
            <DialogDescription>
              رفض طلب {rejectDialog?.profile?.display_name || 'المستخدم'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">سبب الرفض (اختياري)</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="أدخل سبب الرفض..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => rejectDialog && rejectMutation.mutate({ id: rejectDialog.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'جارٍ الرفض...' : 'رفض الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              تفاصيل الاشتراك
            </DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-3 py-4 text-sm">
              {[
                ['المستخدم', detailDialog.profile?.display_name || 'مستخدم'],
                ['معرف المستخدم', detailDialog.user_id],
                ['الباقة', detailDialog.plan === 'monthly' ? 'شهري' : detailDialog.plan],
                ['الحالة', statusConfig[detailDialog.status]?.label || detailDialog.status],
                ['تاريخ الطلب', formatDate(detailDialog.created_at)],
                ['بداية الاشتراك', formatDate(detailDialog.starts_at)],
                ['نهاية الاشتراك', formatDate(detailDialog.expires_at)],
                ['تاريخ الموافقة', formatDate(detailDialog.approved_at)],
                ['ملاحظات', detailDialog.admin_notes || '-'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-end max-w-[60%] break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              إضافة اشتراك يدوي
            </DialogTitle>
            <DialogDescription>
              إضافة اشتراك VIP لمستخدم يدوياً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">اختر المستخدم</label>
              {selectedUser ? (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(selectedUser.display_name || selectedUser.username || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedUser.display_name || selectedUser.username || 'مستخدم'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedUser.user_id.slice(0, 16)}...</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => { setSelectedUser(null); setNewSubUserId(''); setUserSearch(''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو اسم المستخدم..."
                    className="ps-9"
                  />
                  {searchResults.length > 0 && userSearch.length >= 2 && (
                    <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((u) => (
                        <button
                          key={u.user_id}
                          className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-start"
                          onClick={() => {
                            setSelectedUser(u);
                            setNewSubUserId(u.user_id);
                            setUserSearch('');
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.display_name || u.username || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.display_name || u.username || 'مستخدم'}</p>
                            {u.username && <p className="text-[10px] text-muted-foreground">@{u.username}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {userSearch.length >= 2 && searchResults.length === 0 && (
                    <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
                      لا توجد نتائج
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">الباقة</label>
              <Select value={newSubPlan} onValueChange={setNewSubPlan}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                  <SelectItem value="lifetime">مدى الحياة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">مدة الاشتراك (بالأيام)</label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                className="mt-1 trading-number"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => addManualMutation.mutate()}
              disabled={addManualMutation.isPending || !newSubUserId}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            >
              {addManualMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة وتفعيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
