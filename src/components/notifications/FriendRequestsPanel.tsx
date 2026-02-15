import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/lib/date-utils';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const FriendRequestsPanel = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const isArabic = i18n.language === 'ar';

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const senderIds = data.map(r => r.sender_id);
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        setRequests(data.map(r => ({
          ...r,
          sender_profile: profileMap.get(r.sender_id) || undefined
        })));
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user, fetchRequests]);

  // Realtime subscription for friend requests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`friend-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  const handleAction = async (requestId: string, action: 'accepted' | 'rejected') => {
    setActionLoading(`${requestId}-${action}`);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(action === 'accepted' 
        ? (isArabic ? 'تم قبول طلب الصداقة' : 'Friend request accepted')
        : (isArabic ? 'تم رفض طلب الصداقة' : 'Friend request rejected')
      );
      
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error handling friend request:', err);
      toast.error(isArabic ? 'حدث خطأ' : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side={isArabic ? 'right' : 'left'} className="w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isArabic ? 'طلبات الصداقة' : 'Friend Requests'}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingCount}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {isArabic ? 'لا توجد طلبات صداقة' : 'No friend requests'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {requests.map((request) => {
                  const name = request.sender_profile?.display_name || request.sender_profile?.username || (isArabic ? 'مستخدم' : 'User');
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isArabic ? 20 : -20 }}
                      className="p-3 rounded-lg border bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          onClick={() => {
                            setOpen(false);
                            navigate(`/user/${request.sender_id}`);
                          }}
                        >
                          <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => {
                              setOpen(false);
                              navigate(`/user/${request.sender_id}`);
                            }}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {name}
                          </button>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime(request.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction(request.id, 'accepted')}
                          >
                            {actionLoading === `${request.id}-accepted` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                {isArabic ? 'قبول' : 'Accept'}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction(request.id, 'rejected')}
                          >
                            {actionLoading === `${request.id}-rejected` ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
