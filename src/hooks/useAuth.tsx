import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AUTH_CONFIG, APP_URLS } from '@/config/environment';
import { processReferralAfterSignup } from '@/hooks/useReferrals';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'moderator' | 'support' | 'vip' | 'free';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isSupport: boolean;
  isVip: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string; country?: string; phone?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const prevRolesRef = useRef<AppRole[]>([]);
  const { toast } = useToast();

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return (data?.map(r => r.role as AppRole) || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  };

  const refreshRoles = async () => {
    if (user) {
      const userRoles = await fetchRoles(user.id);
      setRoles(userRoles);
    }
  };

  useEffect(() => {
    let rolesChannel: ReturnType<typeof supabase.channel> | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Process referral on first sign-in after signup
        if (event === 'SIGNED_IN' && session?.user) {
          processReferralAfterSignup(session.user.id);
        }
        
        if (session?.user) {
          // Defer role fetching to avoid blocking
          setTimeout(async () => {
            const userRoles = await fetchRoles(session.user.id);
            prevRolesRef.current = userRoles;
            setRoles(userRoles);
          }, 0);

          // Subscribe to role changes for this user
          if (rolesChannel) {
            supabase.removeChannel(rolesChannel);
          }
          rolesChannel = supabase
            .channel(`user-roles-${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'user_roles',
                filter: `user_id=eq.${session.user.id}`,
              },
              async () => {
                const userRoles = await fetchRoles(session.user.id);
                // Show toast for VIP changes
                const wasVip = prevRolesRef.current.includes('vip');
                const isNowVip = userRoles.includes('vip');
                if (!wasVip && isNowVip) {
                  toast({ title: 'تم تفعيل VIP 👑', description: 'مبروك! تم ترقيتك إلى عضوية VIP' });
                } else if (wasVip && !isNowVip) {
                  toast({ title: 'انتهى اشتراك VIP', description: 'انتهت عضويتك VIP. يمكنك التجديد من صفحة الاشتراكات', variant: 'destructive' });
                }
                prevRolesRef.current = userRoles;
                setRoles(userRoles);
              }
            )
            .subscribe();
        } else {
          setRoles([]);
          if (rolesChannel) {
            supabase.removeChannel(rolesChannel);
            rolesChannel = null;
          }
        }
        
        setLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userRoles = await fetchRoles(session.user.id);
        prevRolesRef.current = userRoles;
        setRoles(userRoles);

        // Subscribe to role changes
        rolesChannel = supabase
          .channel(`user-roles-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_roles',
              filter: `user_id=eq.${session.user.id}`,
            },
            async () => {
              const userRoles = await fetchRoles(session.user.id);
              const wasVip = prevRolesRef.current.includes('vip');
              const isNowVip = userRoles.includes('vip');
              if (!wasVip && isNowVip) {
                toast({ title: 'تم تفعيل VIP 👑', description: 'مبروك! تم ترقيتك إلى عضوية VIP' });
              } else if (wasVip && !isNowVip) {
                toast({ title: 'انتهى اشتراك VIP', description: 'انتهت عضويتك VIP. يمكنك التجديد من صفحة الاشتراكات', variant: 'destructive' });
              }
              prevRolesRef.current = userRoles;
              setRoles(userRoles);
            }
          )
          .subscribe();
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (rolesChannel) {
        supabase.removeChannel(rolesChannel);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, userData?: { firstName?: string; lastName?: string; country?: string; phone?: string }) => {
    const displayName = userData?.firstName && userData?.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : email.split('@')[0];
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: APP_URLS.production,
        data: {
          display_name: displayName,
          first_name: userData?.firstName,
          last_name: userData?.lastName,
          country: userData?.country,
          phone: userData?.phone
        }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    // IMPORTANT: Preview URLs (lovableproject.com) require a Lovable session token,
    // so password reset links opened from email on mobile may redirect to lovable.dev login.
    // Use the published URL from centralized config for email redirects.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: AUTH_CONFIG.resetPasswordRedirect,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;
  const isSupport = roles.includes('support') || isAdmin;
  const isVip = roles.includes('vip') || isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      roles,
      isAdmin,
      isModerator,
      isSupport,
      isVip,
      signIn,
      signUp,
      signOut,
      refreshRoles,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
