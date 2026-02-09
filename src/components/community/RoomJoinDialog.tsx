import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DoorOpen, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CommunityRoom } from '@/hooks/useRoomManagement';

// Original interface for backward compatibility
interface RoomJoinDialogPropsWithRoom {
  room: CommunityRoom | null;
  roomName?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roomId: string, message?: string) => Promise<boolean>;
  status?: 'none' | 'pending' | 'approved' | 'rejected' | 'banned';
}

// Simplified interface for RoomChatPanel
interface RoomJoinDialogPropsSimple {
  room?: never;
  roomName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (message?: string) => void;
  status?: never;
}

type RoomJoinDialogProps = RoomJoinDialogPropsWithRoom | RoomJoinDialogPropsSimple;

export const RoomJoinDialog = (props: RoomJoinDialogProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { open, onOpenChange } = props;

  // Determine which variant we're using
  const isSimpleMode = 'roomName' in props && props.roomName !== undefined;
  const room = isSimpleMode ? null : (props as RoomJoinDialogPropsWithRoom).room;
  const roomName = isSimpleMode 
    ? (props as RoomJoinDialogPropsSimple).roomName 
    : (room ? (isArabic ? room.name_ar : room.name) : '');
  const status = isSimpleMode ? 'none' : ((props as RoomJoinDialogPropsWithRoom).status || 'none');

  const handleSubmit = async () => {
    setLoading(true);
    
    if (isSimpleMode) {
      (props as RoomJoinDialogPropsSimple).onSubmit(message);
      setMessage('');
      setLoading(false);
    } else {
      if (!room) {
        setLoading(false);
        return;
      }
      const success = await (props as RoomJoinDialogPropsWithRoom).onSubmit(room.id, message);
      setLoading(false);
      if (success) {
        setMessage('');
        onOpenChange(false);
      }
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {isArabic ? 'طلبك قيد المراجعة' : 'Request Pending'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'سيتم إشعارك عند الموافقة على طلبك'
                  : 'You will be notified when your request is approved'
                }
              </p>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {isArabic ? 'تم رفض طلبك' : 'Request Rejected'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'يمكنك إعادة المحاولة لاحقاً'
                  : 'You can try again later'
                }
              </p>
            </div>
          </div>
        );
      case 'banned':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {isArabic ? 'أنت محظور من هذه الغرفة' : 'You are banned from this room'}
              </h3>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-profit/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-profit" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {isArabic ? 'أنت عضو في هذه الغرفة' : 'You are a member'}
              </h3>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // For non-simple mode, require room
  if (!isSimpleMode && !room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5" />
            {roomName}
          </DialogTitle>
          {room && (
            <DialogDescription>
              {isArabic ? room.description_ar : room.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {status !== 'none' ? (
          getStatusContent()
        ) : (
          <>
            <div className="py-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                {isArabic ? 'رسالة الانضمام (اختياري)' : 'Join Message (optional)'}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isArabic ? 'اكتب رسالة قصيرة...' : 'Write a short message...'}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {isArabic ? 'إرسال طلب الانضمام' : 'Send Join Request'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};