import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, User, Shield, Search, Users, Sparkles, Headphones, Eye, X, Check, Plus, Minus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  first_name: string;
  last_name: string;
  country: string;
  phone: string;
  avatar_url: string;
  onboarding_completed: boolean;
  trading_preferences: any;
  created_at: string;
  roles: string[];
}

type AppRole = 'admin' | 'moderator' | 'support' | 'vip' | 'free';

const ROLES_CONFIG: { value: AppRole; labelAr: string; labelEn: string; descAr: string; descEn: string; icon: typeof Shield; color: string; bgColor: string; borderColor: string }[] = [
  { value: 'admin', labelAr: 'مدير النظام', labelEn: 'Admin', descAr: 'وصول كامل لجميع الإعدادات والصلاحيات', descEn: 'Full access to all settings and permissions', icon: Shield, color: 'text-primary', bgColor: 'bg-primary/15', borderColor: 'border-primary/25' },
  { value: 'moderator', labelAr: 'مشرف عام', labelEn: 'Moderator', descAr: 'إدارة المحتوى والتحليلات والمقالات', descEn: 'Manage content, analyses, and articles', icon: Eye, color: 'text-emerald-500', bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/25' },
  { value: 'support', labelAr: 'وكيل دعم', labelEn: 'Support Agent', descAr: 'الرد على تذاكر الدعم الفني', descEn: 'Respond to support tickets', icon: Headphones, color: 'text-cyan-500', bgColor: 'bg-cyan-500/15', borderColor: 'border-cyan-500/25' },
  { value: 'vip', labelAr: 'عضوية VIP', labelEn: 'VIP Member', descAr: 'وصول للمحتوى والغرف المميزة', descEn: 'Access premium content and rooms', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/15', borderColor: 'border-amber-500/25' },
];

export const UserManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles_admin_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({ title: t('common.error'), description: profilesError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      roles: (roles || []).filter(r => r.user_id === profile.user_id).map(r => r.role)
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const openRoleSheet = (user: UserProfile) => {
    setSelectedUser(user);
    setPendingRoles([...user.roles]);
  };

  const toggleRole = (role: AppRole) => {
    // Prevent removing admin from yourself
    if (role === 'admin' && selectedUser?.user_id === currentUser?.id && pendingRoles.includes('admin')) {
      toast({ title: isRTL ? 'غير مسموح' : 'Not allowed', description: isRTL ? 'لا يمكنك إزالة صلاحية المدير عن نفسك' : 'You cannot remove admin from yourself', variant: 'destructive' });
      return;
    }
    setPendingRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      // Delete all existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);
      if (deleteError) throw deleteError;

      // Insert new roles (if any non-free)
      const rolesToInsert = pendingRoles.filter(r => r !== 'free');
      if (rolesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert.map(role => ({ user_id: selectedUser.user_id, role: role as any })));
        if (insertError) throw insertError;
      }

      toast({
        title: isRTL ? 'تم تحديث الصلاحيات ✅' : 'Roles updated ✅',
        description: isRTL ? `تم تعديل صلاحيات ${selectedUser.display_name || 'المستخدم'}` : `Updated roles for ${selectedUser.display_name || 'user'}`,
      });

      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedUser && JSON.stringify([...pendingRoles].sort()) !== JSON.stringify([...selectedUser.roles].sort());

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (filterRole) {
      if (filterRole === 'free') return matchesSearch && user.roles.length === 0;
      return matchesSearch && user.roles.includes(filterRole);
    }
    return matchesSearch;
  });

  const getRoleBadges = (roles: string[]) => {
    if (roles.length === 0) return [{ label: isRTL ? 'مجاني' : 'Free', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border/20', icon: User }];
    return roles.map(r => {
      const config = ROLES_CONFIG.find(rc => rc.value === r);
      return config ? { label: isRTL ? config.labelAr : config.labelEn, color: config.color, bg: config.bgColor, border: config.borderColor, icon: config.icon } : null;
    }).filter(Boolean) as any[];
  };

  const adminCount = users.filter(u => u.roles.includes('admin')).length;
  const modCount = users.filter(u => u.roles.includes('moderator')).length;
  const supportCount = users.filter(u => u.roles.includes('support')).length;
  const vipCount = users.filter(u => u.roles.includes('vip')).length;
  const freeCount = users.filter(u => u.roles.length === 0).length;

  const filterChips = [
    { key: null, label: isRTL ? 'الكل' : 'All', count: users.length },
    { key: 'admin', label: isRTL ? 'مدراء' : 'Admins', count: adminCount },
    { key: 'moderator', label: isRTL ? 'مشرفين' : 'Mods', count: modCount },
    { key: 'support', label: isRTL ? 'دعم' : 'Support', count: supportCount },
    { key: 'vip', label: 'VIP', count: vipCount },
    { key: 'free', label: isRTL ? 'مجاني' : 'Free', count: freeCount },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-500/15 via-blue-600/5 to-transparent border border-blue-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('admin.manageUsers')}</h2>
              <p className="text-xs text-muted-foreground/70">
                {users.length} {isRTL ? 'مستخدم' : 'users'} • {adminCount} {isRTL ? 'مدير' : 'admin'} • {modCount} {isRTL ? 'مشرف' : 'mod'} • {supportCount} {isRTL ? 'دعم' : 'support'} • {vipCount} VIP
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-blue-400/40" />
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.searchUsers')}
          className="pl-10 rtl:pl-3 rtl:pr-10 rounded-xl border-border/30 bg-card/50 backdrop-blur-sm focus:border-primary/40 transition-colors"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterChips.map(chip => (
          <button
            key={chip.key ?? 'all'}
            onClick={() => setFilterRole(chip.key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              filterRole === chip.key
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-card/50 text-muted-foreground border-border/20 hover:border-border/40"
            )}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
            <Users className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">{t('admin.noUsers')}</p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filteredUsers.map((user, index) => {
            const badges = getRoleBadges(user.roles);
            const isAdmin = user.roles.includes('admin');

            return (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => openRoleSheet(user)}
                className={cn(
                  "w-full text-start p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.005] group",
                  isAdmin
                    ? "bg-gradient-to-br from-primary/8 via-primary/3 to-transparent border-primary/20"
                    : "bg-card/50 border-border/20 hover:border-border/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    badges[0]?.bg, badges[0]?.border
                  )}>
                    {badges[0] && (() => { const Icon = badges[0].icon; return <Icon className={cn("w-4 h-4", badges[0].color)} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {user.display_name || t('admin.unnamed')}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 truncate">
                      @{user.username || user.user_id.slice(0, 8)}
                      {user.country && ` • 🌍 ${user.country}`}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {badges.map((badge, i) => (
                        <span key={i} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border", badge.bg, badge.color, badge.border)}>
                          <badge.icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors rtl:rotate-180 shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Role Management Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent side={isRTL ? 'right' : 'right'} className="w-full sm:max-w-md p-0 border-border/20 bg-background">
          {selectedUser && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-5 border-b border-border/20">
                <SheetHeader className="mb-0">
                  <SheetTitle className="text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          {isRTL ? 'إدارة الصلاحيات' : 'Manage Roles'}
                        </h3>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          {selectedUser.display_name || selectedUser.username || selectedUser.user_id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
              </div>

              {/* User Info */}
              <div className="px-5 py-4 border-b border-border/10 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-muted/50 flex items-center justify-center border border-border/20">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {selectedUser.display_name || t('admin.unnamed')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedUser.phone && `📱 ${selectedUser.phone}`}
                      {selectedUser.country && ` • 🌍 ${selectedUser.country}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Roles Toggle List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {isRTL ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}
                </p>

                {ROLES_CONFIG.map((role) => {
                  const isActive = pendingRoles.includes(role.value);
                  const isSelf = selectedUser.user_id === currentUser?.id && role.value === 'admin';

                  return (
                    <motion.div
                      key={role.value}
                      layout
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        isActive
                          ? cn(role.bgColor, role.borderColor, "shadow-sm")
                          : "bg-card/30 border-border/15 hover:border-border/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            isActive ? cn(role.bgColor, role.borderColor) : "bg-muted/30 border-border/20"
                          )}>
                            <role.icon className={cn("w-5 h-5 transition-colors", isActive ? role.color : "text-muted-foreground/50")} />
                          </div>
                          <div className="min-w-0">
                            <p className={cn("font-semibold text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                              {isRTL ? role.labelAr : role.labelEn}
                            </p>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                              {isRTL ? role.descAr : role.descEn}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleRole(role.value)}
                          disabled={isSelf}
                          className="shrink-0"
                        />
                      </div>
                    </motion.div>
                  );
                })}

                {/* Free user note */}
                {pendingRoles.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-xl bg-muted/20 border border-border/15 text-center"
                  >
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? '⚡ لا توجد أدوار مُعيّنة — سيكون المستخدم بصلاحيات مجانية' : '⚡ No roles assigned — user will have free access'}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Save Footer */}
              <div className="p-5 border-t border-border/20 bg-background">
                <AnimatePresence>
                  {hasChanges && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                    >
                      <p className="text-xs text-amber-500 font-medium text-center">
                        {isRTL ? '⚠️ يوجد تغييرات غير محفوظة' : '⚠️ Unsaved changes detected'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 rounded-xl border-border/30"
                    disabled={saving}
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={saveRoles}
                    disabled={!hasChanges || saving}
                    className={cn(
                      "flex-1 rounded-xl gap-2 font-semibold",
                      "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                      "text-primary-foreground shadow-lg shadow-primary/20"
                    )}
                  >
                    {saving ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
