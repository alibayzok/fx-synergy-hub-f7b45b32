import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users, Gift, Clock, CheckCircle2, XCircle, Truck,
  Plus, Pencil, Trash2, Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminTab = 'referrals' | 'rewards' | 'redemptions';

export const ReferralManagement = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('referrals');
  const [search, setSearch] = useState('');
  const [rewardDialog, setRewardDialog] = useState<any>(null);
  const [rewardForm, setRewardForm] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '',
    icon: '🎁', points_cost: 100, reward_type: 'custom', reward_value: '',
    is_active: true, stock: '',
  });

  // ═══ Referrals Data ═══
  const referralsQuery = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (!data?.length) return [];
      const userIds = [...new Set([...data.map(r => r.referrer_id), ...data.map(r => r.referred_id)])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(r => ({
        ...r,
        referrer_name: (pMap.get(r.referrer_id) as any)?.display_name || 'Unknown',
        referred_name: (pMap.get(r.referred_id) as any)?.display_name || 'Unknown',
      }));
    },
  });

  // ═══ Rewards Catalog ═══
  const rewardsQuery = useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const saveReward = useMutation({
    mutationFn: async (reward: any) => {
      const payload = {
        name_ar: reward.name_ar,
        name_en: reward.name_en,
        description_ar: reward.description_ar,
        description_en: reward.description_en,
        icon: reward.icon,
        points_cost: reward.points_cost,
        reward_type: reward.reward_type,
        reward_value: reward.reward_value || null,
        is_active: reward.is_active,
        stock: reward.stock ? parseInt(reward.stock) : null,
      };
      if (reward.id) {
        const { error } = await supabase.from('referral_rewards').update(payload).eq('id', reward.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('referral_rewards').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      setRewardDialog(null);
      toast.success(isRTL ? 'تم الحفظ' : 'Saved');
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('referral_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    },
  });

  // ═══ Redemptions ═══
  const redemptionsQuery = useQuery({
    queryKey: ['admin-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (!data?.length) return [];
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);
      const pMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const rewardIds = data.filter(r => r.reward_id).map(r => r.reward_id);
      let rMap = new Map();
      if (rewardIds.length) {
        const { data: rw } = await supabase.from('referral_rewards').select('*').in('id', rewardIds);
        rMap = new Map(rw?.map(r => [r.id, r]) || []);
      }

      return data.map(r => ({
        ...r,
        user_name: (pMap.get(r.user_id) as any)?.display_name || 'Unknown',
        reward: r.reward_id ? rMap.get(r.reward_id) : null,
      }));
    },
  });

  const updateRedemption = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: 'pending' | 'approved' | 'rejected' | 'delivered'; admin_notes?: string }) => {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status, admin_notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
      toast.success(isRTL ? 'تم التحديث' : 'Updated');
    },
  });

  const openRewardForm = (reward?: any) => {
    if (reward) {
      setRewardForm({
        ...reward,
        stock: reward.stock?.toString() || '',
      });
    } else {
      setRewardForm({
        name_ar: '', name_en: '', description_ar: '', description_en: '',
        icon: '🎁', points_cost: 100, reward_type: 'custom', reward_value: '',
        is_active: true, stock: '',
      });
    }
    setRewardDialog(reward || {});
  };

  const tabs: { key: AdminTab; label: string; icon: any; count?: number }[] = [
    { key: 'referrals', label: isRTL ? 'الإحالات' : 'Referrals', icon: Users, count: referralsQuery.data?.length },
    { key: 'rewards', label: isRTL ? 'المكافآت' : 'Rewards', icon: Gift, count: rewardsQuery.data?.length },
    { key: 'redemptions', label: isRTL ? 'طلبات الاستبدال' : 'Redemptions', icon: Clock, count: redemptionsQuery.data?.filter((r: any) => r.status === 'pending').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-amber-500 border-amber-500/30">{isRTL ? 'قيد المراجعة' : 'Pending'}</Badge>;
      case 'approved': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">{isRTL ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive/30">{isRTL ? 'مرفوض' : 'Rejected'}</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-500/30">{isRTL ? 'مسلّم' : 'Delivered'}</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-primary/20 text-primary text-[10px] px-1.5 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ Referrals Tab ═══ */}
      {activeTab === 'referrals' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث...' : 'Search...'}
              className="ps-9"
            />
          </div>
          {(referralsQuery.data || [])
            .filter((r: any) => !search || r.referrer_name?.toLowerCase().includes(search.toLowerCase()) || r.referred_name?.toLowerCase().includes(search.toLowerCase()))
            .map((ref: any) => (
              <div key={ref.id} className="p-3 rounded-xl bg-card border border-border/50 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {isRTL ? 'المُحيل:' : 'Referrer:'} {ref.referrer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'المُحال:' : 'Referred:'} {ref.referred_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(ref.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en')}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">+{ref.points_awarded}</span>
              </div>
            ))}
          {!referralsQuery.data?.length && (
            <p className="text-center text-muted-foreground py-8">{isRTL ? 'لا توجد إحالات' : 'No referrals yet'}</p>
          )}
        </div>
      )}

      {/* ═══ Rewards Tab ═══ */}
      {activeTab === 'rewards' && (
        <div className="space-y-3">
          <Button onClick={() => openRewardForm()} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة مكافأة' : 'Add Reward'}
          </Button>
          {(rewardsQuery.data || []).map((rw: any) => (
            <div key={rw.id} className="p-3 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{rw.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{isRTL ? rw.name_ar : rw.name_en}</p>
                  <p className="text-xs text-muted-foreground">{rw.points_cost} {isRTL ? 'نقطة' : 'pts'}</p>
                </div>
                <Badge variant={rw.is_active ? 'default' : 'secondary'}>
                  {rw.is_active ? (isRTL ? 'فعال' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => openRewardForm(rw)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteReward.mutate(rw.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Redemptions Tab ═══ */}
      {activeTab === 'redemptions' && (
        <div className="space-y-3">
          {(redemptionsQuery.data || []).map((rd: any) => (
            <div key={rd.id} className="p-3 rounded-xl bg-card border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{rd.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rd.reward ? (isRTL ? rd.reward.name_ar : rd.reward.name_en) : (isRTL ? 'سحب يدوي' : 'Manual withdrawal')}
                  </p>
                </div>
                <div className="text-end">
                  {getStatusBadge(rd.status)}
                  <p className="text-sm font-bold text-destructive mt-1">-{rd.points_spent}</p>
                </div>
              </div>
              {rd.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">{rd.notes}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {new Date(rd.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en')}
              </p>
              {rd.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => updateRedemption.mutate({ id: rd.id, status: 'approved' })}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isRTL ? 'موافقة' : 'Approve'}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => updateRedemption.mutate({ id: rd.id, status: 'delivered' })}>
                    <Truck className="w-3.5 h-3.5" />
                    {isRTL ? 'تسليم' : 'Deliver'}
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => updateRedemption.mutate({ id: rd.id, status: 'rejected' })}>
                    <XCircle className="w-3.5 h-3.5" />
                    {isRTL ? 'رفض' : 'Reject'}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!redemptionsQuery.data?.length && (
            <p className="text-center text-muted-foreground py-8">{isRTL ? 'لا توجد طلبات' : 'No redemptions yet'}</p>
          )}
        </div>
      )}

      {/* Reward Form Dialog */}
      <Dialog open={!!rewardDialog} onOpenChange={() => setRewardDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rewardDialog?.id ? (isRTL ? 'تعديل مكافأة' : 'Edit Reward') : (isRTL ? 'إضافة مكافأة' : 'Add Reward')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{isRTL ? 'الاسم (عربي)' : 'Name (AR)'}</label>
                <Input value={rewardForm.name_ar} onChange={(e) => setRewardForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{isRTL ? 'الاسم (إنجليزي)' : 'Name (EN)'}</label>
                <Input value={rewardForm.name_en} onChange={(e) => setRewardForm(f => ({ ...f, name_en: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{isRTL ? 'الوصف (عربي)' : 'Description (AR)'}</label>
              <Textarea value={rewardForm.description_ar} onChange={(e) => setRewardForm(f => ({ ...f, description_ar: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium">{isRTL ? 'الوصف (إنجليزي)' : 'Description (EN)'}</label>
              <Textarea value={rewardForm.description_en} onChange={(e) => setRewardForm(f => ({ ...f, description_en: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">{isRTL ? 'الأيقونة' : 'Icon'}</label>
                <Input value={rewardForm.icon} onChange={(e) => setRewardForm(f => ({ ...f, icon: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{isRTL ? 'النقاط المطلوبة' : 'Points Cost'}</label>
                <Input type="number" value={rewardForm.points_cost} onChange={(e) => setRewardForm(f => ({ ...f, points_cost: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{isRTL ? 'المخزون' : 'Stock'}</label>
                <Input type="number" value={rewardForm.stock} onChange={(e) => setRewardForm(f => ({ ...f, stock: e.target.value }))} placeholder="∞" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(null)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={() => saveReward.mutate({ ...rewardForm, id: rewardDialog?.id })} disabled={saveReward.isPending}>
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
