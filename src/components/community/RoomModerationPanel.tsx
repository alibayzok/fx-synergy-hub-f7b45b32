import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Users,
  UserPlus,
  Shield,
  Crown,
  Ban,
  UserMinus,
  Check,
  X,
  MoreVertical,
  Settings,
  Info,
  VolumeX,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoomModeration, RoomMember } from '@/hooks/useRoomManagement';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface RoomModerationPanelProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
}

export const RoomModerationPanel = ({ roomId, roomName, onBack }: RoomModerationPanelProps) => {
  const { t, i18n } = useTranslation();
  const { isAdmin, user } = useAuth();
  const isArabic = i18n.language === 'ar';
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const {
    members,
    pendingRequests,
    loading,
    isModerator,
    isOwner,
    currentUserRole,
    approveRequest,
    rejectRequest,
    updateMemberRole,
    banMember,
    unbanMember,
    muteMember,
    unmuteMember,
    removeMember
  } = useRoomModeration(roomId);

  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'remove' | 'role' | 'mute' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<string>('permanent');
  const [muteReason, setMuteReason] = useState('');
  const [muteDuration, setMuteDuration] = useState<string>('1');

  const roleColors = {
    owner: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    moderator: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    member: 'bg-muted text-muted-foreground border-border'
  };

  const roleIcons = {
    owner: Crown,
    moderator: Shield,
    member: Users
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
  };

  const canManageMember = (member: RoomMember) => {
    if (member.user_id === user?.id) return false;
    if (member.role === 'owner') return false;
    if (member.role === 'moderator' && !isOwner && !isAdmin) return false;
    return isModerator || isOwner || isAdmin;
  };

  const canChangeRoles = () => isOwner || isAdmin;

  const handleBan = async () => {
    if (selectedMember && banReason) {
      const duration = banDuration === 'permanent' ? undefined : parseInt(banDuration);
      await banMember(selectedMember.id, banReason, duration);
      setSelectedMember(null);
      setActionType(null);
      setBanReason('');
      setBanDuration('permanent');
    }
  };

  const handleMute = async () => {
    if (selectedMember && muteReason) {
      const durationHours = parseInt(muteDuration);
      await muteMember(selectedMember.id, muteReason, durationHours);
      setSelectedMember(null);
      setActionType(null);
      setMuteReason('');
      setMuteDuration('1');
    }
  };

  const handleRemove = async () => {
    if (selectedMember) {
      await removeMember(selectedMember.id);
      setSelectedMember(null);
      setActionType(null);
    }
  };

  const handleRoleChange = async (role: RoomMember['role']) => {
    if (selectedMember) {
      await updateMemberRole(selectedMember.id, role);
      setSelectedMember(null);
      setActionType(null);
    }
  };

  const approvedMembers = members.filter(m => m.status === 'approved');
  const bannedMembers = members.filter(m => m.status === 'banned');
  const mutedMembers = approvedMembers.filter(m => m.is_muted);

  const sortedMembers = [...approvedMembers].sort((a, b) => {
    const roleOrder = { owner: 0, moderator: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  const renderMemberCard = (member: RoomMember) => {
    const RoleIcon = roleIcons[member.role];
    const canManage = canManageMember(member);
    const isCurrentUser = member.user_id === user?.id;

    return (
      <motion.div
        key={member.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
          isCurrentUser
            ? "bg-primary/5 border-primary/20"
            : "bg-card/50 border-border/30 hover:bg-card/80"
        )}
      >
        <Avatar className="h-11 w-11">
          <AvatarImage src={member.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {(member.profile?.display_name || member.profile?.username || 'U').charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">
              {member.profile?.display_name || member.profile?.username || 'مستخدم'}
            </span>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {isArabic ? 'أنت' : 'You'}
              </Badge>
            )}
            {member.is_muted && (
              <Badge variant="outline" className="text-[10px] px-1.5 bg-amber-500/10 text-amber-500 border-amber-500/30 gap-0.5">
                <VolumeX className="w-2.5 h-2.5" />
                {isArabic ? 'مكتوم' : 'Muted'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn("text-[10px] gap-0.5", roleColors[member.role])}>
              <RoleIcon className="w-2.5 h-2.5" />
              {isArabic
                ? member.role === 'owner' ? 'مالك' : member.role === 'moderator' ? 'مشرف' : 'عضو'
                : member.role
              }
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatTime(member.joined_at)}
            </span>
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canChangeRoles() && (
                <>
                  <DropdownMenuItem onClick={() => { setSelectedMember(member); setActionType('role'); }}>
                    <Shield className="w-4 h-4 me-2 text-blue-500" />
                    {isArabic ? 'تغيير الدور' : 'Change Role'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {member.is_muted ? (
                <DropdownMenuItem onClick={() => unmuteMember(member.id)} className="text-emerald-500 focus:text-emerald-500">
                  <Volume2 className="w-4 h-4 me-2" />
                  {isArabic ? 'رفع الكتم' : 'Unmute'}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => { setSelectedMember(member); setActionType('mute'); }} className="text-amber-500 focus:text-amber-500">
                  <VolumeX className="w-4 h-4 me-2" />
                  {isArabic ? 'كتم' : 'Mute'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => { setSelectedMember(member); setActionType('ban'); }}
                className="text-destructive focus:text-destructive"
              >
                <Ban className="w-4 h-4 me-2" />
                {isArabic ? 'حظر' : 'Ban'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSelectedMember(member); setActionType('remove'); }}
                className="text-destructive focus:text-destructive"
              >
                <UserMinus className="w-4 h-4 me-2" />
                {isArabic ? 'إزالة' : 'Remove'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {isArabic ? 'إدارة الغرفة' : 'Room Management'}
            </h1>
            <p className="text-sm text-muted-foreground">{roomName}</p>
          </div>
          {currentUserRole && (
            <Badge variant="outline" className={cn("gap-1", roleColors[currentUserRole])}>
              {currentUserRole === 'owner' && <Crown className="w-3 h-3" />}
              {currentUserRole === 'moderator' && <Shield className="w-3 h-3" />}
              {isArabic
                ? currentUserRole === 'owner' ? 'مالك' : currentUserRole === 'moderator' ? 'مشرف' : 'عضو'
                : currentUserRole
              }
            </Badge>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-2.5 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold text-foreground">{approvedMembers.length}</p>
              <p className="text-[10px] text-muted-foreground">{isArabic ? 'الأعضاء' : 'Members'}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-2.5 text-center">
              <UserPlus className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold text-foreground">{pendingRequests.length}</p>
              <p className="text-[10px] text-muted-foreground">{isArabic ? 'طلبات' : 'Requests'}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-2.5 text-center">
              <VolumeX className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold text-foreground">{mutedMembers.length}</p>
              <p className="text-[10px] text-muted-foreground">{isArabic ? 'مكتومين' : 'Muted'}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-2.5 text-center">
              <Ban className="w-4 h-4 mx-auto mb-1 text-destructive" />
              <p className="text-xl font-bold text-foreground">{bannedMembers.length}</p>
              <p className="text-[10px] text-muted-foreground">{isArabic ? 'محظورين' : 'Banned'}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="members" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="members" className="gap-1 text-[11px]">
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'الأعضاء' : 'Members'}</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-1 text-[11px] relative">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'الطلبات' : 'Requests'}</span>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="muted" className="gap-1 text-[11px]">
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'مكتومين' : 'Muted'}</span>
              </TabsTrigger>
              <TabsTrigger value="banned" className="gap-1 text-[11px]">
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'محظورين' : 'Banned'}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Members Tab */}
          <TabsContent value="members" className="flex-1 overflow-hidden px-4 pb-4 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : sortedMembers.length > 0 ? (
                  sortedMembers.map(renderMemberCard)
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">{isArabic ? 'لا يوجد أعضاء' : 'No members'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="flex-1 overflow-hidden px-4 pb-4 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {pendingRequests.length > 0 ? (
                  <>
                    {/* Bulk Actions */}
                    {pendingRequests.length > 1 && (
                      <div className="flex gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          onClick={() => pendingRequests.forEach(r => rejectRequest(r.id))}
                        >
                          <X className="w-3.5 h-3.5 me-1" />
                          {isArabic ? 'رفض الكل' : 'Reject All'}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-profit hover:bg-profit/90 text-white"
                          onClick={() => pendingRequests.forEach(r => approveRequest(r.id))}
                        >
                          <Check className="w-3.5 h-3.5 me-1" />
                          {isArabic ? 'قبول الكل' : 'Accept All'}
                        </Button>
                      </div>
                    )}
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={request.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-amber-500/20 text-amber-600">
                              {(request.profile?.display_name || request.profile?.username || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground block">
                              {request.profile?.display_name || request.profile?.username || 'مستخدم'}
                            </span>
                            {request.message && (
                              <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-lg">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => rejectRequest(request.id)}
                          >
                            <X className="w-4 h-4 me-1" />
                            {isArabic ? 'رفض' : 'Reject'}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-profit hover:bg-profit/90 text-white"
                            onClick={() => approveRequest(request.id)}
                          >
                            <Check className="w-4 h-4 me-1" />
                            {isArabic ? 'قبول' : 'Accept'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">{isArabic ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Muted Tab */}
          <TabsContent value="muted" className="flex-1 overflow-hidden px-4 pb-4 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {mutedMembers.length > 0 ? (
                  mutedMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
                    >
                      <Avatar className="h-11 w-11 opacity-70">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {(member.profile?.display_name || member.profile?.username || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {member.profile?.display_name || member.profile?.username || 'مستخدم'}
                        </span>
                        {member.muted_reason && (
                          <p className="text-xs text-amber-500 mt-0.5">
                            <Info className="w-3 h-3 inline me-1" />
                            {member.muted_reason}
                          </p>
                        )}
                        {member.muted_until && (
                          <p className="text-xs text-muted-foreground">
                            {isArabic ? 'حتى' : 'Until'}: {new Date(member.muted_until).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 gap-1"
                        onClick={() => unmuteMember(member.id)}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isArabic ? 'رفع الكتم' : 'Unmute'}
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <VolumeX className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">{isArabic ? 'لا يوجد مكتومين' : 'No muted members'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Banned Tab */}
          <TabsContent value="banned" className="flex-1 overflow-hidden px-4 pb-4 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {bannedMembers.length > 0 ? (
                  bannedMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                    >
                      <Avatar className="h-11 w-11 opacity-60">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {(member.profile?.display_name || member.profile?.username || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {member.profile?.display_name || member.profile?.username || 'مستخدم'}
                        </span>
                        {member.ban_reason && (
                          <p className="text-xs text-destructive mt-0.5">
                            <Info className="w-3 h-3 inline me-1" />
                            {member.ban_reason}
                          </p>
                        )}
                        {member.banned_until && (
                          <p className="text-xs text-muted-foreground">
                            {isArabic ? 'حتى' : 'Until'}: {new Date(member.banned_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => unbanMember(member.id)}
                      >
                        {isArabic ? 'رفع الحظر' : 'Unban'}
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Ban className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">{isArabic ? 'لا يوجد محظورين' : 'No banned members'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={actionType === 'ban'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              {isArabic ? 'حظر العضو' : 'Ban Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `سيتم حظر ${selectedMember?.profile?.display_name || 'العضو'} من هذه الغرفة`
                : `${selectedMember?.profile?.display_name || 'Member'} will be banned from this room`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={isArabic ? 'سبب الحظر (مطلوب)...' : 'Ban reason (required)...'}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <Select value={banDuration} onValueChange={setBanDuration}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'مدة الحظر' : 'Ban duration'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{isArabic ? 'يوم واحد' : '1 Day'}</SelectItem>
                <SelectItem value="3">{isArabic ? '3 أيام' : '3 Days'}</SelectItem>
                <SelectItem value="7">{isArabic ? 'أسبوع' : '1 Week'}</SelectItem>
                <SelectItem value="30">{isArabic ? 'شهر' : '1 Month'}</SelectItem>
                <SelectItem value="permanent">{isArabic ? 'دائم' : 'Permanent'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={!banReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArabic ? 'حظر' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mute Dialog */}
      <AlertDialog open={actionType === 'mute'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <VolumeX className="w-5 h-5 text-amber-500" />
              {isArabic ? 'كتم العضو' : 'Mute Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `سيتم كتم ${selectedMember?.profile?.display_name || 'العضو'} - لن يستطيع إرسال رسائل`
                : `${selectedMember?.profile?.display_name || 'Member'} won't be able to send messages`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={isArabic ? 'سبب الكتم (مطلوب)...' : 'Mute reason (required)...'}
              value={muteReason}
              onChange={(e) => setMuteReason(e.target.value)}
            />
            <Select value={muteDuration} onValueChange={setMuteDuration}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'مدة الكتم' : 'Mute duration'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{isArabic ? 'ساعة واحدة' : '1 Hour'}</SelectItem>
                <SelectItem value="6">{isArabic ? '6 ساعات' : '6 Hours'}</SelectItem>
                <SelectItem value="24">{isArabic ? 'يوم كامل' : '24 Hours'}</SelectItem>
                <SelectItem value="72">{isArabic ? '3 أيام' : '3 Days'}</SelectItem>
                <SelectItem value="168">{isArabic ? 'أسبوع' : '1 Week'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMute}
              disabled={!muteReason.trim()}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {isArabic ? 'كتم' : 'Mute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Dialog */}
      <AlertDialog open={actionType === 'remove'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-destructive" />
              {isArabic ? 'إزالة العضو' : 'Remove Member'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من إزالة ${selectedMember?.profile?.display_name || 'العضو'}؟`
                : `Are you sure you want to remove ${selectedMember?.profile?.display_name || 'this member'}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isArabic ? 'إزالة' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <AlertDialog open={actionType === 'role'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {isArabic ? 'تغيير الدور' : 'Change Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `اختر الدور الجديد لـ ${selectedMember?.profile?.display_name || 'العضو'}`
                : `Select new role for ${selectedMember?.profile?.display_name || 'this member'}`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button
              variant={selectedMember?.role === 'moderator' ? 'default' : 'outline'}
              onClick={() => handleRoleChange('moderator')}
              className="justify-start h-12"
            >
              <Shield className="w-5 h-5 me-3 text-blue-500" />
              <div className="text-start">
                <p className="font-medium">{isArabic ? 'مشرف' : 'Moderator'}</p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'يمكنه إدارة الأعضاء العاديين' : 'Can manage regular members'}</p>
              </div>
            </Button>
            <Button
              variant={selectedMember?.role === 'member' ? 'default' : 'outline'}
              onClick={() => handleRoleChange('member')}
              className="justify-start h-12"
            >
              <Users className="w-5 h-5 me-3" />
              <div className="text-start">
                <p className="font-medium">{isArabic ? 'عضو' : 'Member'}</p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'صلاحيات عادية فقط' : 'Regular permissions only'}</p>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
