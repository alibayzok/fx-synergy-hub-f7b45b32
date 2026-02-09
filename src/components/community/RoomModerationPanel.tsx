import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useRoomModeration, RoomMember, RoomJoinRequest } from '@/hooks/useRoomManagement';
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
  const { isAdmin } = useAuth();
  const isArabic = i18n.language === 'ar';
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const {
    members,
    pendingRequests,
    loading,
    isModerator,
    approveRequest,
    rejectRequest,
    updateMemberRole,
    banMember,
    unbanMember,
    removeMember
  } = useRoomModeration(roomId);

  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'remove' | 'role' | null>(null);
  const [banReason, setBanReason] = useState('');

  const roleColors = {
    owner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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

  const handleBan = async () => {
    if (selectedMember && banReason) {
      await banMember(selectedMember.id, banReason);
      setSelectedMember(null);
      setActionType(null);
      setBanReason('');
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
              <Settings className="w-5 h-5" />
              {isArabic ? 'إدارة الغرفة' : 'Room Management'}
            </h1>
            <p className="text-sm text-muted-foreground">{roomName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              {isArabic ? 'الأعضاء' : 'Members'}
              <Badge variant="secondary" className="text-xs">{approvedMembers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {isArabic ? 'الطلبات' : 'Requests'}
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="text-xs">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="banned" className="gap-2">
              <Ban className="w-4 h-4" />
              {isArabic ? 'المحظورين' : 'Banned'}
              <Badge variant="secondary" className="text-xs">{bannedMembers.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="px-4 pb-4">
            <div className="space-y-2 mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : approvedMembers.length > 0 ? (
                approvedMembers.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(member.profile?.display_name || member.profile?.username || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {member.profile?.display_name || member.profile?.username || 'مستخدم'}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px]", roleColors[member.role])}>
                            <RoleIcon className="w-3 h-3 me-1" />
                            {isArabic 
                              ? member.role === 'owner' ? 'مالك' : member.role === 'moderator' ? 'مشرف' : 'عضو'
                              : member.role
                            }
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? 'انضم' : 'Joined'} {formatTime(member.joined_at)}
                        </p>
                      </div>

                      {(isModerator || isAdmin) && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMember(member);
                                  setActionType('role');
                                }}>
                                  <Shield className="w-4 h-4 me-2" />
                                  {isArabic ? 'تغيير الدور' : 'Change Role'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedMember(member);
                                setActionType('ban');
                              }}
                              className="text-amber-500"
                            >
                              <Ban className="w-4 h-4 me-2" />
                              {isArabic ? 'حظر' : 'Ban'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedMember(member);
                                setActionType('remove');
                              }}
                              className="text-destructive"
                            >
                              <UserMinus className="w-4 h-4 me-2" />
                              {isArabic ? 'إزالة' : 'Remove'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? 'لا يوجد أعضاء' : 'No members'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="px-4 pb-4">
            <div className="space-y-2 mt-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card/50 border border-border/30"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(request.profile?.display_name || request.profile?.username || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          {request.profile?.display_name || request.profile?.username || 'مستخدم'}
                        </span>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-1">{request.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(request.created_at)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-profit hover:bg-profit/10"
                          onClick={() => approveRequest(request.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? 'لا توجد طلبات معلقة' : 'No pending requests'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Banned Tab */}
          <TabsContent value="banned" className="px-4 pb-4">
            <div className="space-y-2 mt-4">
              {bannedMembers.length > 0 ? (
                bannedMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
                  >
                    <Avatar className="h-10 w-10 opacity-50">
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
                        <p className="text-xs text-destructive">{member.ban_reason}</p>
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
                      onClick={() => unbanMember(member.id)}
                    >
                      {isArabic ? 'رفع الحظر' : 'Unban'}
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? 'لا يوجد محظورين' : 'No banned members'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban Dialog */}
      <AlertDialog open={actionType === 'ban'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'حظر العضو' : 'Ban Member'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic 
                ? `سيتم حظر ${selectedMember?.profile?.display_name || 'العضو'} من هذه الغرفة`
                : `${selectedMember?.profile?.display_name || 'Member'} will be banned from this room`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder={isArabic ? 'سبب الحظر...' : 'Ban reason...'}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} className="bg-destructive text-destructive-foreground">
              {isArabic ? 'حظر' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Dialog */}
      <AlertDialog open={actionType === 'remove'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'إزالة العضو' : 'Remove Member'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic 
                ? `هل أنت متأكد من إزالة ${selectedMember?.profile?.display_name || 'العضو'}؟`
                : `Are you sure you want to remove ${selectedMember?.profile?.display_name || 'this member'}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              {isArabic ? 'إزالة' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <AlertDialog open={actionType === 'role'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'تغيير الدور' : 'Change Role'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic ? 'اختر الدور الجديد للعضو' : 'Select new role for this member'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant={selectedMember?.role === 'moderator' ? 'default' : 'outline'}
              onClick={() => handleRoleChange('moderator')}
              className="justify-start"
            >
              <Shield className="w-4 h-4 me-2" />
              {isArabic ? 'مشرف' : 'Moderator'}
            </Button>
            <Button
              variant={selectedMember?.role === 'member' ? 'default' : 'outline'}
              onClick={() => handleRoleChange('member')}
              className="justify-start"
            >
              <Users className="w-4 h-4 me-2" />
              {isArabic ? 'عضو' : 'Member'}
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
