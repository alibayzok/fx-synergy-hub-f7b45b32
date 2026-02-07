import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, User, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  created_at: string;
  roles: string[];
}

export const UserManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
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

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Merge profiles with roles
    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      roles: (roles || [])
        .filter(r => r.user_id === profile.user_id)
        .map(r => r.role)
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleVipStatus = async (userId: string, currentlyVip: boolean) => {
    if (currentlyVip) {
      // Remove VIP role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'vip');

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({ title: t('admin.vipRemoved') });
        fetchUsers();
      }
    } else {
      // Add VIP role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'vip' });

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({ title: t('admin.vipAdded') });
        fetchUsers();
      }
    }
  };

  const filteredUsers = users.filter(user =>
    (user.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (roles: string[]) => {
    if (roles.includes('admin')) return <Shield className="w-4 h-4 text-primary" />;
    if (roles.includes('vip')) return <Crown className="w-4 h-4 text-vip" />;
    return <User className="w-4 h-4 text-muted-foreground" />;
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
          placeholder={t('common.search')}
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
            const isVip = user.roles.includes('vip');
            const isAdmin = user.roles.includes('admin');

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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isAdmin ? "bg-primary/20" :
                      isVip ? "bg-vip/20" : "bg-muted"
                    )}>
                      {getRoleIcon(user.roles)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.display_name || t('admin.unnamed')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username || user.user_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Badge className="bg-primary/20 text-primary">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {isVip && !isAdmin && (
                      <Badge className="bg-vip/20 text-vip">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    {!isAdmin && (
                      <Button
                        variant={isVip ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleVipStatus(user.user_id, isVip)}
                        className={cn(
                          "gap-1",
                          isVip ? "border-vip/30 text-vip hover:bg-vip/10" : "bg-vip text-vip-foreground hover:bg-vip/90"
                        )}
                      >
                        <Crown className="w-3 h-3" />
                        {isVip ? t('admin.removeVip') : t('admin.addVip')}
                      </Button>
                    )}
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
