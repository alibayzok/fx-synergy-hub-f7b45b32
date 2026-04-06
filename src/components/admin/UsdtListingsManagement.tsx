import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins, Plus, Trash2, Save, Edit2, Eye, EyeOff,
  Loader2, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUsdtListings, UsdtListing, CreateUsdtListingData } from '@/hooks/useUsdtListings';
import { cn } from '@/lib/utils';

export const UsdtListingsManagement = () => {
  const { toast } = useToast();
  const { listings, loading, createListing, updateListing, deleteListing } = useUsdtListings();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<UsdtListing | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    listing_type: 'buy' | 'sell';
    price: string;
    commission: string;
    min_amount: string;
    max_amount: string;
    payment_methods: string;
    contact_info: string;
    notes: string;
  }>({
    listing_type: 'buy',
    price: '',
    commission: '0',
    min_amount: '',
    max_amount: '',
    payment_methods: '',
    contact_info: '',
    notes: '',
  });

  const openDialog = (listing?: UsdtListing) => {
    if (listing) {
      setEditing(listing);
      setForm({
        listing_type: listing.listing_type,
        price: listing.price.toString(),
        commission: listing.commission.toString(),
        min_amount: listing.min_amount?.toString() || '',
        max_amount: listing.max_amount?.toString() || '',
        payment_methods: listing.payment_methods.join(', '),
        contact_info: listing.contact_info,
        notes: listing.notes || '',
      });
    } else {
      setEditing(null);
      setForm({
        listing_type: 'buy',
        price: '',
        commission: '0',
        min_amount: '',
        max_amount: '',
        payment_methods: '',
        contact_info: '',
        notes: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.price || !form.contact_info) {
      toast({ title: 'أدخل السعر ومعلومات التواصل', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const data: CreateUsdtListingData = {
      listing_type: form.listing_type,
      price: parseFloat(form.price),
      commission: parseFloat(form.commission) || 0,
      min_amount: form.min_amount ? parseFloat(form.min_amount) : undefined,
      max_amount: form.max_amount ? parseFloat(form.max_amount) : undefined,
      payment_methods: form.payment_methods.split(',').map(m => m.trim()).filter(Boolean),
      contact_info: form.contact_info,
      notes: form.notes || undefined,
    };

    if (editing) {
      await updateListing(editing.id, data);
    } else {
      await createListing(data);
    }

    setSaving(false);
    setShowDialog(false);
  };

  const toggleActive = async (listing: UsdtListing) => {
    await updateListing(listing.id, { is_active: !listing.is_active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const buyListings = listings.filter(l => l.listing_type === 'buy');
  const sellListings = listings.filter(l => l.listing_type === 'sell');

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{listings.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي</div>
        </div>
        <div className="rounded-xl border border-profit/20 bg-profit/5 p-3 text-center">
          <div className="text-2xl font-bold text-profit">{buyListings.length}</div>
          <div className="text-xs text-muted-foreground">شراء</div>
        </div>
        <div className="rounded-xl border border-loss/20 bg-loss/5 p-3 text-center">
          <div className="text-2xl font-bold text-loss">{sellListings.length}</div>
          <div className="text-xs text-muted-foreground">بيع</div>
        </div>
      </div>

      <Button onClick={() => openDialog()} className="w-full gap-2">
        <Plus className="w-4 h-4" /> إضافة إعلان USDT جديد
      </Button>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          لا توجد إعلانات بعد. أضف إعلان USDT!
        </div>
      ) : (
        listings.map((listing) => {
          const isBuy = listing.listing_type === 'buy';
          return (
            <motion.div
              key={listing.id}
              layout
              className={cn(
                "rounded-xl border p-4 space-y-3",
                isBuy ? "border-profit/20 bg-profit/5" : "border-loss/20 bg-loss/5",
                !listing.is_active && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isBuy ? "bg-profit/20" : "bg-loss/20"
                  )}>
                    {isBuy ? <TrendingUp className="w-4 h-4 text-profit" /> : <TrendingDown className="w-4 h-4 text-loss" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isBuy ? 'default' : 'destructive'} className="text-[10px]">
                        {isBuy ? 'شراء' : 'بيع'}
                      </Badge>
                      <Badge variant={listing.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {listing.is_active ? 'مفعّل' : 'معطّل'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-xl font-bold text-foreground trading-number">
                    {listing.price.toLocaleString('en-US')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">LBP</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {listing.commission > 0 && (
                  <Badge variant="outline">عمولة: {listing.commission}%</Badge>
                )}
                {listing.min_amount && (
                  <Badge variant="outline" className="trading-number">حد أدنى: ${listing.min_amount}</Badge>
                )}
                {listing.max_amount && (
                  <Badge variant="outline" className="trading-number">حد أقصى: ${listing.max_amount}</Badge>
                )}
                {listing.payment_methods.length > 0 && (
                  <Badge variant="outline">{listing.payment_methods.join(', ')}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openDialog(listing)} className="gap-1 flex-1">
                  <Edit2 className="w-3 h-3" /> تعديل
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(listing)} className="gap-1">
                  {listing.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف الإعلان</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف هذا الإعلان؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteListing(listing.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          );
        })
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل إعلان USDT' : 'إضافة إعلان USDT جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات الإعلان</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>النوع</Label>
              <Select
                value={form.listing_type}
                onValueChange={(v) => setForm(p => ({ ...p, listing_type: v as 'buy' | 'sell' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">شراء (أنت تشتري من المستخدم)</SelectItem>
                  <SelectItem value="sell">بيع (أنت تبيع للمستخدم)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>السعر (LBP) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="89500"
                  dir="ltr"
                  className="trading-number"
                />
              </div>
              <div>
                <Label>العمولة (%)</Label>
                <Input
                  type="number"
                  value={form.commission}
                  onChange={(e) => setForm(p => ({ ...p, commission: e.target.value }))}
                  placeholder="0"
                  dir="ltr"
                  className="trading-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الحد الأدنى ($)</Label>
                <Input
                  type="number"
                  value={form.min_amount}
                  onChange={(e) => setForm(p => ({ ...p, min_amount: e.target.value }))}
                  placeholder="50"
                  dir="ltr"
                  className="trading-number"
                />
              </div>
              <div>
                <Label>الحد الأقصى ($)</Label>
                <Input
                  type="number"
                  value={form.max_amount}
                  onChange={(e) => setForm(p => ({ ...p, max_amount: e.target.value }))}
                  placeholder="5000"
                  dir="ltr"
                  className="trading-number"
                />
              </div>
            </div>

            <div>
              <Label>طرق الدفع (مفصولة بفاصلة)</Label>
              <Input
                value={form.payment_methods}
                onChange={(e) => setForm(p => ({ ...p, payment_methods: e.target.value }))}
                placeholder="OMT, Whish, Cash"
              />
            </div>

            <div>
              <Label>معلومات التواصل *</Label>
              <Input
                value={form.contact_info}
                onChange={(e) => setForm(p => ({ ...p, contact_info: e.target.value }))}
                placeholder="واتساب: +961..."
              />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
