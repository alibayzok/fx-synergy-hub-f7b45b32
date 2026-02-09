import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, User, Shield, Search, ChevronDown, Check } from 'lucide-react';
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

type AppRole = 'admin' | 'vip' | 'free';

const ROLES: { value: AppRole; labelKey: string; icon: React.ReactNode; color: string }[] = [
  { value: 'admin', labelKey: 'admin.roles.admin', icon: <Shield className="w-4 h-4" />, color: 'text-primary' },
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
      // First, delete all existing roles for this user (except if it's removing admin from self)
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert the new role
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
    if (roles.includes('vip')) return <Crown className="w-4 h-4 text-vip" />;
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  const getCurrentRole = (roles: string[]): AppRole => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('vip')) return 'vip';
    return 'free';
  };

  const getRoleLabel = (role: AppRole) => {
    const roleConfig = ROLES.find(r => r.value === role);
    return roleConfig ? t(roleConfig.labelKey) : role;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t('admin.manageUsers')}</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.searchUsers')}
          className="pl-10 rtl:pl-3 rtl:pr-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading')}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('admin.noUsers')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const currentRole = getCurrentRole(user.roles);
            const isAdmin = user.roles.includes('admin');
            const isVip = user.roles.includes('vip');
            const isUpdating = updatingUser === user.user_id;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border",
                  isAdmin ? "bg-primary/5 border-primary/30" :
                  isVip ? "bg-vip/5 border-vip/30" : 
                  "bg-card/50 border-border/30"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isAdmin ? "bg-primary/20" :
                      isVip ? "bg-vip/20" : "bg-muted"
                    )}>
                      {getRoleIcon(user.roles)}
                    </div>
                     <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.display_name || t('admin.unnamed')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username || user.user_id.slice(0, 8)}
                      </p>
                      {/* Full user details for admin */}
                      <div className="mt-1 space-y-0.5">
                        {(user.first_name || user.last_name) && (
                          <p className="text-xs text-muted-foreground">
                            👤 {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {user.phone && (
                          <p className="text-xs text-muted-foreground trading-number">
                            📱 {user.phone}
                          </p>
                        )}
                        {user.country && (
                          <p className="text-xs text-muted-foreground">
                            🌍 {user.country}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Current Role Badge */}
                    <Badge className={cn(
                      "hidden sm:flex",
                      isAdmin ? "bg-primary/20 text-primary" :
                      isVip ? "bg-vip/20 text-vip" : 
                      "bg-muted text-muted-foreground"
                    )}>
                      {getRoleIcon(user.roles)}
                      <span className="mr-1">{getRoleLabel(currentRole)}</span>
                    </Badge>

                    {/* Role Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isUpdating}
                          className="gap-1"
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
