import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Check, X, Loader2, ChevronRight, 
  UserMinus, Eye, EyeOff, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useFriendship, type Friend, type FriendRequest, type PrivacySettings } from '@/hooks/useFriendship';
import { formatTimeAgo } from '@/lib/date-utils';

export const FriendsSection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    pendingRequests,
    sentRequests,
    friends,
    privacySettings,
    loading,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    updatePrivacySettings
  } = useFriendship();

  const [showRequestsDialog, setShowRequestsDialog] = useState(false);
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isArabic = i18n.language === 'ar';

  const formatDate = (dateStr: string) => formatTimeAgo(dateStr, i18n.language);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    await acceptRequest(requestId);
    setActionLoading(null);
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(`reject-${requestId}`);
    await rejectRequest(requestId);
    setActionLoading(null);
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    await cancelRequest(requestId);
    setActionLoading(null);
  };

  const handleRemoveFriend = async (friendUserId: string) => {
    setActionLoading(friendUserId);
    await removeFriend(friendUserId);
    setActionLoading(null);
  };

  const getPrivacyLabel = (value: string) => {
    switch (value) {
      case 'everyone': return t('social.privacy.everyone');
      case 'friends_only': return t('social.privacy.friendsOnly');
      case 'followers_only': return t('social.privacy.followersOnly');
      case 'nobody': return t('social.privacy.nobody');
      default: return value;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        {/* Friend Requests Button */}
        <button
          onClick={() => setShowRequestsDialog(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{t('social.friendRequests')}</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="trading-number">
                {pendingRequests.length}
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </div>
        </button>

        {/* Friends List Button */}
        <button
          onClick={() => setShowFriendsDialog(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{t('social.friends')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="trading-number text-sm text-muted-foreground">{friends.length}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </div>
        </button>

        {/* Privacy Settings Button */}
        <button
          onClick={() => setShowPrivacyDialog(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{t('social.privacy.title')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>
      </motion.div>

      {/* Friend Requests Dialog */}
      <Dialog open={showRequestsDialog} onOpenChange={setShowRequestsDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('social.friendRequests')}</DialogTitle>
            <DialogDescription className="sr-only">Manage friend requests</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4 pt-2">
              {/* Pending Received */}
              {pendingRequests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t('social.pendingReceived')}</h4>
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <button
                        onClick={() => {
                          setShowRequestsDialog(false);
                          navigate(`/user/${request.sender_id}`);
                        }}
                        className="flex items-center gap-3 flex-1 text-start"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.sender_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(request.sender_profile?.display_name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {request.sender_profile?.display_name || t('community.anonymous')}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-profit hover:bg-profit/10"
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-loss hover:bg-loss/10"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === `reject-${request.id}`}
                        >
                          {actionLoading === `reject-${request.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t('social.pendingSent')}</h4>
                  {sentRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <button
                        onClick={() => {
                          setShowRequestsDialog(false);
                          navigate(`/user/${request.receiver_id}`);
                        }}
                        className="flex items-center gap-3 flex-1 text-start"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.receiver_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(request.receiver_profile?.display_name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {request.receiver_profile?.display_name || t('community.anonymous')}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t('common.cancel')
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {pendingRequests.length === 0 && sentRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t('social.noRequests')}
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Friends List Dialog */}
      <Dialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('social.friends')}</DialogTitle>
            <DialogDescription className="sr-only">Friends list</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2 pt-2">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <button
                      onClick={() => {
                        setShowFriendsDialog(false);
                        navigate(`/user/${friend.user_id}`);
                      }}
                      className="flex items-center gap-3 flex-1 text-start"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(friend.display_name || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {friend.display_name || t('community.anonymous')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('social.friendSince')} {formatDate(friend.friend_since)}
                        </p>
                      </div>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-loss hover:bg-loss/10"
                      onClick={() => handleRemoveFriend(friend.user_id)}
                      disabled={actionLoading === friend.user_id}
                    >
                      {actionLoading === friend.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('social.noFriends')}
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('social.privacy.title')}</DialogTitle>
            <DialogDescription className="sr-only">Privacy settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Who can see my friends */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('social.privacy.whoCanSeeFriends')}</label>
              <Select
                value={privacySettings?.friends_visibility || 'everyone'}
                onValueChange={(value) => updatePrivacySettings({ 
                  friends_visibility: value as PrivacySettings['friends_visibility'] 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">{t('social.privacy.everyone')}</SelectItem>
                  <SelectItem value="friends_only">{t('social.privacy.friendsOnly')}</SelectItem>
                  <SelectItem value="nobody">{t('social.privacy.nobody')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Who can message me */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('social.privacy.whoCanMessage')}</label>
              <Select
                value={privacySettings?.messaging_privacy || 'everyone'}
                onValueChange={(value) => updatePrivacySettings({ 
                  messaging_privacy: value as PrivacySettings['messaging_privacy'] 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">{t('social.privacy.everyone')}</SelectItem>
                  <SelectItem value="friends_only">{t('social.privacy.friendsOnly')}</SelectItem>
                  <SelectItem value="followers_only">{t('social.privacy.followersOnly')}</SelectItem>
                  <SelectItem value="nobody">{t('social.privacy.nobody')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
