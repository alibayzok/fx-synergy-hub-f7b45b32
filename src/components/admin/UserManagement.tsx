import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, User, Shield, Search, ChevronDown, Check, Users, Sparkles, Headphones, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

const ROLES: { value: AppRole; labelKey: string; icon: React.ReactNode; color: string }[] = [
  { value: 'admin', labelKey: 'admin.roles.admin', icon: <Shield className="w-4 h-4" />, color: 'text-primary' },
  { value: 'moderator', labelKey: 'admin.roles.moderator', icon: <Eye className="w-4 h-4" />, color: 'text-emerald-500' },
  { value: 'support', labelKey: 'admin.roles.support', icon: <Headphones className="w-4 h-4" />, color: 'text-cyan-500' },
  { value: 'vip', labelKey: 'admin.roles.vip', icon: <Crown className="w-4 h-4" />, color: 'text-vip' },
  { value: 'free', labelKey: 'admin.roles.free', icon: <User className="w-4 h-4" />, color: 'text-muted-foreground' },
];

export const UserManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

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
      toast({
        title: t('common.error'),
        description: profilesError.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      roles: (roles || [])
        .filter(r => r.user_id === profile.user_id)
        .map(r => r.role)
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    setUpdatingUser(userId);
    
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({ title: t('admin.roleUpdated') });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.country?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('admin')) return <Shield className="w-4 h-4 text-primary" />;
    if (roles.includes('moderator')) return <Eye className="w-4 h-4 text-emerald-500" />;
    if (roles.includes('support')) return <Headphones className="w-4 h-4 text-cyan-500" />;
    if (roles.includes('vip')) return <Crown className="w-4 h-4 text-vip" />;
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  const getCurrentRole = (roles: string[]): AppRole => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('moderator')) return 'moderator';
    if (roles.includes('support')) return 'support';
    if (roles.includes('vip')) return 'vip';
    return 'free';
  };

  const getRoleLabel = (role: AppRole) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig ? t(roleConfig.labelKey) : role;
  };

  const adminCount = users.filter(u => u.roles.includes('admin')).length;
  const modCount = users.filter(u => u.roles.includes('moderator')).length;
  const supportCount = users.filter(u => u.roles.includes('support')).length;
  const vipCount = users.filter(u => u.roles.includes('vip')).length;

  return (
    <div className="space-y-5">
      {/* Premium Header Banner */}
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
                {users.length} مستخدم • {adminCount} مدير • {modCount} مشرف • {supportCount} دعم • {vipCount} VIP
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-blue-400/40" />
        </div>
      </motion.div>

      {/* Enhanced Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.searchUsers')}
          className="pl-10 rtl:pl-3 rtl:pr-10 rounded-xl border-border/30 bg-card/50 backdrop-blur-sm focus:border-primary/40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
            <Users className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">{t('admin.noUsers')}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => {
            const currentRole = getCurrentRole(user.roles);
            const isAdmin = user.roles.includes('admin');
            const isMod = user.roles.includes('moderator');
            const isSup = user.roles.includes('support');
            const isVip = user.roles.includes('vip');
            const isUpdating = updatingUser === user.user_id;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01]",
                  isAdmin ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/25 shadow-[0_0_15px_rgba(var(--primary),0.08)]" :
                  isMod ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/25" :
                  isSup ? "bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/25" :
                  isVip ? "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.08)]" : 
                  "bg-card/50 border-border/25 hover:border-border/40"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                      isAdmin ? "bg-primary/15 border-primary/20" :
                      isMod ? "bg-emerald-500/15 border-emerald-500/20" :
                      isSup ? "bg-cyan-500/15 border-cyan-500/20" :
                      isVip ? "bg-amber-500/15 border-amber-500/20" : "bg-muted/50 border-border/20"
                    )}>
                      {getRoleIcon(user.roles)}
                    </div>
                     <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {user.display_name || t('admin.unnamed')}
                      </p>
                      <p className="text-xs text-muted-foreground/70 truncate">
                        @{user.username || user.user_id.slice(0, 8)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {(user.first_name || user.last_name) && (
                          <p className="text-[11px] text-muted-foreground">
                            👤 {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {user.phone && (
                          <p className="text-[11px] text-muted-foreground trading-number">
                            📱 {user.phone}
                          </p>
                        )}
                        {user.country && (
                          <p className="text-[11px] text-muted-foreground">
                            🌍 {user.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn(
                      "hidden sm:flex rounded-lg border",
                      isAdmin ? "bg-primary/15 text-primary border-primary/20" :
                      isMod ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" :
                      isSup ? "bg-cyan-500/15 text-cyan-500 border-cyan-500/20" :
                      isVip ? "bg-amber-500/15 text-amber-500 border-amber-500/20" : 
                      "bg-muted/50 text-muted-foreground border-border/20"
                    )}>
                      {getRoleIcon(user.roles)}
                      <span className="mr-1">{getRoleLabel(currentRole)}</span>
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isUpdating}
                          className="gap-1 rounded-xl border-border/30 hover:border-primary/30 hover:bg-primary/5"
                        >
                          {isUpdating ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <>
                              {t('admin.changeRole')}
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {ROLES.map((role) => (
                          <DropdownMenuItem
                            key={role.value}
                            onClick={() => updateUserRole(user.user_id, role.value)}
                            className="gap-2"
                          >
                            <span className={role.color}>{role.icon}</span>
                            <span>{t(role.labelKey)}</span>
                            {currentRole === role.value && (
                              <Check className="w-4 h-4 mr-auto text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
