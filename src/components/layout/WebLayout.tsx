import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, X, Megaphone } from 'lucide-react';
import { WebSidebar } from './WebSidebar';
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
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface WebLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export const WebLayout = ({ children, showNotifications = true }: WebLayoutProps) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { unreadTotal } = useConversations();
  const { profile } = useProfile();
  const { getSetting, getBoolean } = useAppSettings();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [popupShown, setPopupShown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const maintenanceMode = getBoolean('maintenance_mode');
  const maintenanceMessage = getSetting('maintenance_message', 'التطبيق تحت الصيانة، يرجى المحاولة لاحقاً');
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
    if (profile?.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (profile?.first_name) return profile.first_name.slice(0, 1).toUpperCase();
    return <User className="w-4 h-4" />;
  };

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">وضع الصيانة</h1>
          <p className="text-muted-foreground">{maintenanceMessage}</p>
        </div>
      </div>
    );
  }

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

      {/* Sidebar */}
      <WebSidebar />

      {/* Main Content Area - offset by sidebar width */}
      <div className="ms-[240px]">
        {/* Top Header Bar */}
        {showNotifications && user && (
          <header
            className={cn(
              "sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border/30 shadow-sm",
              bannerActive && bannerText && !bannerDismissed && "mt-[36px]"
            )}
          >
            <div className="flex items-center justify-end gap-2 px-6 py-2.5">
              <AdminSignupNotifications />
              <SupportNotificationsIcon />
              <FriendRequestsPanel />
              <NotificationsPanel />
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
              <ThemeToggle />
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
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="min-h-[calc(100vh-120px)]">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 bg-card/50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Forex Assassin. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/40">
              <button onClick={() => navigate('/support')} className="hover:text-foreground transition-colors">
                {isRTL ? 'الدعم' : 'Support'}
              </button>
              <button onClick={() => navigate('/docs')} className="hover:text-foreground transition-colors">
                {isRTL ? 'المستندات' : 'Docs'}
              </button>
            </div>
          </div>
        </footer>
      </div>

      <FloatingAIButton />
    </div>
  );
};

