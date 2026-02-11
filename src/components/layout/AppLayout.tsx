import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, X, Megaphone } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { FloatingAIButton } from './FloatingAIButton';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { FriendRequestsPanel } from '@/components/notifications/FriendRequestsPanel';
import { AdminSignupNotifications } from '@/components/notifications/AdminSignupNotifications';
import { SupportNotificationsIcon } from '@/components/notifications/SupportNotificationsIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useMessaging';
import { useProfile } from '@/hooks/useProfile';
import { useAppSettings } from '@/hooks/useAppSettings';

interface AppLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export const AppLayout = ({ children, showNotifications = true }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadTotal } = useConversations();
  const { profile } = useProfile();
  const { getSetting, getBoolean } = useAppSettings();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [popupShown, setPopupShown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const bannerActive = getBoolean('banner_active');
  const bannerText = getSetting('banner_text');
  const bannerColor = getSetting('banner_color', '#f59e0b');
  const popupActive = getBoolean('popup_active');
  const popupTitle = getSetting('popup_title');
  const popupMessage = getSetting('popup_message');

  useEffect(() => {
    if (popupActive && popupMessage && !popupShown) {
      const dismissed = sessionStorage.getItem('cms_popup_dismissed');
      if (!dismissed) {
        setShowPopup(true);
        setPopupShown(true);
      }
    }
  }, [popupActive, popupMessage, popupShown]);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name.slice(0, 1).toUpperCase();
    }
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* CMS Announcement Banner */}
      {bannerActive && bannerText && !bannerDismissed && (
        <div 
          className="fixed top-0 start-0 end-0 z-[60] flex items-center justify-between px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: bannerColor }}
        >
          <div className="flex items-center gap-2 flex-1">
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>{bannerText}</span>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="shrink-0 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CMS Popup Dialog */}
      <Dialog open={showPopup} onOpenChange={(open) => {
        setShowPopup(open);
        if (!open) sessionStorage.setItem('cms_popup_dismissed', 'true');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{popupTitle || 'إعلان'}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground whitespace-pre-wrap">{popupMessage}</p>
        </DialogContent>
      </Dialog>

      {/* Header Bar - Facebook style */}
      {showNotifications && user && (
        <div className="fixed top-0 start-0 end-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/30 shadow-sm">
          <div className="flex items-center justify-center gap-2 px-3 py-2">
            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors p-0 overflow-hidden"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>

            {/* Admin Signup Notifications */}
            <AdminSignupNotifications />

            {/* Support Notifications (agents & admins only) */}
            <SupportNotificationsIcon />

            {/* Friend Requests */}
            <FriendRequestsPanel />

            {/* Notifications */}
            <NotificationsPanel />

            {/* Messages Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              {unreadTotal > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full"
                >
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </Badge>
              )}
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      )}
      
      <main className={`pb-20 ${showNotifications && user ? (bannerActive && bannerText && !bannerDismissed ? 'pt-[88px]' : 'pt-[52px]') : (bannerActive && bannerText && !bannerDismissed ? 'pt-[36px]' : '')}`}>
        {children}
      </main>
      <FloatingAIButton />
      <BottomNav />
    </div>
  );
};
