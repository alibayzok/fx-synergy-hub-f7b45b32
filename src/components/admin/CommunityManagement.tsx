import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, Megaphone, MessageSquare, GraduationCap,
  Radio, Users, Search, MoreVertical,
  Hash, Sparkles, Crown, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommunityRoom {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  icon: string | null;
  color: string | null;
  is_private: boolean | null;
  is_broadcast: boolean;
  requires_approval: boolean | null;
  category: string;
  created_at: string | null;
  members_count?: number;
  messages_count?: number;
}

type CategoryKey = 'channels' | 'discussions' | 'learning';

const CATEGORIES: { key: CategoryKey; icon: typeof Megaphone; labelAr: string; labelEn: string; color: string }[] = [
  { key: 'channels', icon: Megaphone, labelAr: 'القنوات', labelEn: 'Channels', color: 'from-blue-500/20 to-cyan-500/20' },
  { key: 'discussions', icon: MessageSquare, labelAr: 'النقاشات', labelEn: 'Discussions', color: 'from-emerald-500/20 to-green-500/20' },
  { key: 'learning', icon: GraduationCap, labelAr: 'التعليم', labelEn: 'Learning', color: 'from-amber-500/20 to-yellow-500/20' },
];




const COLOR_OPTIONS = [
  { value: 'blue', label: 'أزرق', class: 'bg-blue-500' },
  { value: 'green', label: 'أخضر', class: 'bg-emerald-500' },
  { value: 'purple', label: 'بنفسجي', class: 'bg-purple-500' },
  { value: 'amber', label: 'ذهبي', class: 'bg-amber-500' },
  { value: 'red', label: 'أحمر', class: 'bg-red-500' },
  { value: 'cyan', label: 'سماوي', class: 'bg-cyan-500' },
  { value: 'pink', label: 'وردي', class: 'bg-pink-500' },
  { value: 'indigo', label: 'نيلي', class: 'bg-indigo-500' },
];

const emptyRoom: Partial<CommunityRoom> = {
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  icon: 'MessageSquare',
  color: 'blue',
  is_private: false,
  is_broadcast: false,
  requires_approval: false,
  category: 'discussions',
};

export const CommunityManagement = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';

  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<CommunityRoom> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<CommunityRoom | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const [roomsRes, membersRes, messagesRes] = await Promise.all([
        supabase.from('community_rooms').select('*').order('created_at', { ascending: true }),
        supabase.from('room_members').select('room_id').eq('status', 'approved'),
        supabase.from('room_messages').select('room_id'),
      ]);

      const memberMap: Record<string, number> = {};
      membersRes.data?.forEach(m => { memberMap[m.room_id] = (memberMap[m.room_id] || 0) + 1; });

      const msgMap: Record<string, number> = {};
      messagesRes.data?.forEach(m => { msgMap[m.room_id] = (msgMap[m.room_id] || 0) + 1; });

      const enriched: CommunityRoom[] = (roomsRes.data || []).map(r => ({
        ...r,
        members_count: memberMap[r.id] || 0,
        messages_count: msgMap[r.id] || 0,
      }));

      setRooms(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const filteredRooms = rooms.filter(r => {
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.name_ar.includes(search);
    return matchesCategory && matchesSearch;
  });

  const handleOpenCreate = (category?: CategoryKey) => {
    setEditingRoom({ ...emptyRoom, category: category || 'discussions' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (room: CommunityRoom) => {
    setEditingRoom({ ...room });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRoom?.name || !editingRoom?.name_ar) {
      toast({ title: isArabic ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const roomId = editingRoom.id || editingRoom.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const payload = {
        id: roomId,
        name: editingRoom.name,
        name_ar: editingRoom.name_ar,
        description: editingRoom.description || null,
        description_ar: editingRoom.description_ar || null,
        icon: editingRoom.icon || 'MessageSquare',
        color: editingRoom.color || 'blue',
        is_private: editingRoom.is_private || false,
        is_broadcast: editingRoom.is_broadcast || false,
        requires_approval: editingRoom.requires_approval || false,
        category: editingRoom.category || 'discussions',
      };

      if (editingRoom.id && rooms.some(r => r.id === editingRoom.id)) {
        // Update
        const { error } = await supabase.from('community_rooms').update(payload).eq('id', editingRoom.id);
        if (error) throw error;
        toast({ title: isArabic ? 'تم التحديث بنجاح ✅' : 'Updated successfully ✅' });
      } else {
        // Insert
        const { error } = await supabase.from('community_rooms').insert(payload);
        if (error) throw error;
        toast({ title: isArabic ? 'تم الإنشاء بنجاح 🎉' : 'Created successfully 🎉' });
      }

      setDialogOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (err: any) {
      toast({ title: isArabic ? 'حدث خطأ' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      const { error } = await supabase.from('community_rooms').delete().eq('id', roomToDelete.id);
      if (error) throw error;
      toast({ title: isArabic ? 'تم الحذف ✅' : 'Deleted ✅' });
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (err: any) {
      toast({ title: isArabic ? 'خطأ في الحذف' : 'Delete error', description: err.message, variant: 'destructive' });
    }
  };

  const getCategoryStats = (cat: CategoryKey) => {
    const catRooms = rooms.filter(r => r.category === cat);
    return {
      count: catRooms.length,
      members: catRooms.reduce((s, r) => s + (r.members_count || 0), 0),
      messages: catRooms.reduce((s, r) => s + (r.messages_count || 0), 0),
    };
  };

  

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {isArabic ? 'إدارة المجتمع' : 'Community Management'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic ? 'إنشاء وإدارة القنوات والنقاشات ومساحات التعلم' : 'Create and manage channels, discussions, and learning spaces'}
          </p>
        </div>
        <Button onClick={() => handleOpenCreate()} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          {isArabic ? 'إنشاء غرفة جديدة' : 'Create Room'}
        </Button>
      </div>

      {/* Category Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => {
          const stats = getCategoryStats(cat.key);
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setActiveCategory(isActive ? 'all' : cat.key)}
              className={cn(
                'relative overflow-hidden rounded-xl border p-5 text-start transition-all duration-300',
                isActive
                  ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                  : 'border-border/50 bg-card hover:border-primary/20 hover:shadow-md'
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40', cat.color)} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <h3 className="font-bold text-foreground text-lg">{isArabic ? cat.labelAr : cat.labelEn}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {stats.count} {isArabic ? 'غرفة' : 'rooms'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {stats.members}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {stats.messages}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isArabic ? 'بحث في الغرف...' : 'Search rooms...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isArabic ? 'لا توجد غرف' : 'No rooms found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, i) => {
              const catMeta = CATEGORIES.find(c => c.key === room.category);
              const CatIcon = catMeta?.icon || MessageSquare;
              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 hover:border-primary/20 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                      room.is_private ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                    )}>
                      <CatIcon className="w-6 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground truncate">
                          {isArabic ? room.name_ar : room.name}
                        </h3>
                        {room.is_broadcast && (
                          <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                            <Radio className="w-3 h-3" /> {isArabic ? 'بث' : 'Broadcast'}
                          </Badge>
                        )}
                        {room.is_private && (
                          <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 border-amber-500/30 text-amber-500">
                            <Crown className="w-3 h-3" /> VIP
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {isArabic ? room.description_ar : room.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {room.members_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {room.messages_count || 0}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {isArabic ? catMeta?.labelAr : catMeta?.labelEn}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isArabic ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => handleOpenEdit(room)} className="gap-2">
                          <Edit3 className="w-4 h-4" />
                          {isArabic ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setRoomToDelete(room); setDeleteDialogOpen(true); }}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isArabic ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingRoom?.id && rooms.some(r => r.id === editingRoom.id)
                ? (isArabic ? 'تعديل الغرفة' : 'Edit Room')
                : (isArabic ? 'إنشاء غرفة جديدة' : 'Create New Room')
              }
            </DialogTitle>
            <DialogDescription>
              {isArabic ? 'أدخل تفاصيل الغرفة أو القناة' : 'Enter room or channel details'}
            </DialogDescription>
          </DialogHeader>

          {editingRoom && (
            <div className="space-y-5 py-2">
              {/* Category */}
              <div className="space-y-2">
                <Label>{isArabic ? 'النوع' : 'Category'}</Label>
                <Select
                  value={editingRoom.category || 'discussions'}
                  onValueChange={v => setEditingRoom({ ...editingRoom, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>
                        <span className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {isArabic ? cat.labelAr : cat.labelEn}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    value={editingRoom.name || ''}
                    onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    placeholder="General Chat"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={editingRoom.name_ar || ''}
                    onChange={e => setEditingRoom({ ...editingRoom, name_ar: e.target.value })}
                    placeholder="المحادثة العامة"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                  <Textarea
                    value={editingRoom.description || ''}
                    onChange={e => setEditingRoom({ ...editingRoom, description: e.target.value })}
                    rows={2}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                  <Textarea
                    value={editingRoom.description_ar || ''}
                    onChange={e => setEditingRoom({ ...editingRoom, description_ar: e.target.value })}
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label>{isArabic ? 'اللون' : 'Color'}</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setEditingRoom({ ...editingRoom, color: c.value })}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        c.class,
                        editingRoom.color === c.value ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    <Label className="cursor-pointer">{isArabic ? 'قناة بث (المشرفين فقط)' : 'Broadcast Channel (Admins only)'}</Label>
                  </div>
                  <Switch
                    checked={editingRoom.is_broadcast || false}
                    onCheckedChange={v => setEditingRoom({ ...editingRoom, is_broadcast: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <Label className="cursor-pointer">{isArabic ? 'خاصة (VIP فقط)' : 'Private (VIP only)'}</Label>
                  </div>
                  <Switch
                    checked={editingRoom.is_private || false}
                    onCheckedChange={v => setEditingRoom({ ...editingRoom, is_private: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <Label className="cursor-pointer">{isArabic ? 'يتطلب موافقة للانضمام' : 'Requires approval to join'}</Label>
                  </div>
                  <Switch
                    checked={editingRoom.requires_approval || false}
                    onCheckedChange={v => setEditingRoom({ ...editingRoom, requires_approval: v })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />}
              {editingRoom?.id && rooms.some(r => r.id === editingRoom.id)
                ? (isArabic ? 'تحديث' : 'Update')
                : (isArabic ? 'إنشاء' : 'Create')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف "${roomToDelete?.name_ar}"؟ سيتم حذف جميع الرسائل والأعضاء المرتبطين.`
                : `Are you sure you want to delete "${roomToDelete?.name}"? All associated messages and members will be removed.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isArabic ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
