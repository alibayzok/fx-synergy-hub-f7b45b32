import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Users, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSocial } from '@/hooks/useSocial';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SearchResult {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  country: string | null;
}

const UserResultCard = ({ profile, currentUserId }: { profile: SearchResult; currentUserId?: string }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const isSelf = currentUserId === profile.user_id;
  const { relationship, loading, followUser, sendFriendRequest } = useSocial(profile.user_id);
  const [actionLoading, setActionLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    await followUser();
    setActionLoading(false);
  };

  const handleFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    await sendFriendRequest();
    setActionLoading(false);
  };

  const initials = (profile.display_name || profile.username || '?').slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => navigate(`/user/${profile.user_id}`)}
    >
      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground truncate text-sm">
            {profile.display_name || profile.username || t('common.unknown')}
          </span>
          {profile.is_verified && <VerifiedBadge size="sm" />}
        </div>
        {profile.username && (
          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        )}
      </div>

      {!isSelf && !loading && (
        <div className="flex gap-1.5 shrink-0">
          {!relationship.isFollowing && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleFollow}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
              {isArabic ? 'متابعة' : 'Follow'}
            </Button>
          )}
          {relationship.isFollowing && (
            <Badge variant="secondary" className="h-8 flex items-center gap-1 text-xs">
              <UserCheck className="h-3 w-3" />
              {isArabic ? 'متابَع' : 'Following'}
            </Badge>
          )}
          {relationship.friendStatus === 'none' && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleFriendRequest}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
              {isArabic ? 'صداقة' : 'Add'}
            </Button>
          )}
          {relationship.friendStatus === 'pending_sent' && (
            <Badge variant="outline" className="h-8 flex items-center text-xs text-muted-foreground">
              {isArabic ? 'تم الإرسال' : 'Sent'}
            </Badge>
          )}
          {relationship.friendStatus === 'accepted' && (
            <Badge className="h-8 flex items-center gap-1 text-xs bg-green-500/10 text-green-600 border-green-500/30">
              <UserCheck className="h-3 w-3" />
              {isArabic ? 'صديق' : 'Friend'}
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
};

const SearchUsersPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isArabic = i18n.language === 'ar';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const term = `%${searchQuery.trim()}%`;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, is_verified, country')
        .or(`display_name.ilike.${term},username.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`)
        .neq('user_id', user?.id || '')
        .limit(30);

      if (error) throw error;
      setResults((data as SearchResult[]) || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error(isArabic ? 'حدث خطأ في البحث' : 'Search error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isArabic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(query);
  };

  // Debounced search on typing
  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      const timeout = setTimeout(() => searchUsers(value), 400);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <BackIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">
              {isArabic ? 'البحث عن أشخاص' : 'Find People'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={isArabic ? 'ابحث بالاسم أو اسم المستخدم...' : 'Search by name or username...'}
              className="ps-10 bg-muted/50 border-border/50 focus:border-primary/50"
              autoFocus
            />
          </form>
        </div>

        {/* Results */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-2">
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!loading && searched && results.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  {isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}
                </p>
              </div>
            )}

            {!loading && !searched && (
              <div className="text-center py-16">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {isArabic ? 'ابحث عن أشخاص لمتابعتهم أو إضافتهم كأصدقاء' : 'Search for people to follow or add as friends'}
                </p>
              </div>
            )}

            <AnimatePresence>
              {!loading && results.map((profile) => (
                <UserResultCard key={profile.user_id} profile={profile} currentUserId={user?.id} />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
};

export default SearchUsersPage;
