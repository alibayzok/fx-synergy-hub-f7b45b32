import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Crown, Shield, Calendar, MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { countries } from '@/data/countries';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  country?: string;
  created_at: string;
}

interface UserRole {
  role: 'admin' | 'vip' | 'free';
}

const UserProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ threads: 0, replies: 0 });
  
  const isArabic = i18n.language === 'ar';
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, username, display_name, avatar_url, country, created_at')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        setUserRole(roleData);

        // Fetch stats
        const [{ count: threadsCount }, { count: repliesCount }] = await Promise.all([
          supabase.from('threads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('replies').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        ]);

        setStats({
          threads: threadsCount || 0,
          replies: repliesCount || 0
        });

      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // Redirect to own profile page if viewing own profile
  useEffect(() => {
    if (user && userId === user.id) {
      navigate('/profile', { replace: true });
    }
  }, [user, userId, navigate]);

  const displayName = profile?.display_name || profile?.username || t('community.anonymous');
  const isAdmin = userRole?.role === 'admin';
  const isVip = userRole?.role === 'vip';

  const formatDate = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
  };

  const countryName = profile?.country
    ? countries.find(c => c.code === profile.country)?.name[isArabic ? 'ar' : 'en'] || profile.country
    : null;

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t('profile.userProfile')}</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : !profile ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('profile.userNotFound')}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
              {t('common.goBack')}
            </Button>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-6 rounded-xl border text-center",
                isAdmin 
                  ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/30"
                  : isVip 
                    ? "bg-gradient-to-br from-vip/10 to-transparent border-vip/30" 
                    : "bg-card border-border/30"
              )}
            >
              <Avatar className={cn(
                "w-20 h-20 mx-auto mb-4 ring-4",
                isAdmin ? "ring-primary/30" : isVip ? "ring-vip/30" : "ring-border/30"
              )}>
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className={cn(
                  "text-2xl font-bold",
                  isAdmin ? "bg-primary/20 text-primary" :
                  isVip ? "bg-vip/20 text-vip" : "bg-primary/20 text-primary"
                )}>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                {isAdmin && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                {isVip && !isAdmin && (
                  <Badge className="bg-vip text-vip-foreground gap-1">
                    <Crown className="w-3 h-3" />
                    VIP
                  </Badge>
                )}
              </div>

              {countryName && (
                <p className="text-sm text-muted-foreground mb-2">{countryName}</p>
              )}

              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{t('profile.joinedAt')} {formatDate(profile.created_at)}</span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold text-foreground">{stats.threads}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('community.threads')}</p>
              </div>
              <div className="p-4 rounded-xl bg-card/50 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold text-foreground">{stats.replies}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('community.replies')}</p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default UserProfilePage;
