import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { FloatingAIButton } from './FloatingAIButton';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { FriendRequestsPanel } from '@/components/notifications/FriendRequestsPanel';
import { AdminSignupNotifications } from '@/components/notifications/AdminSignupNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useMessaging';
import { useProfile } from '@/hooks/useProfile';

interface AppLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export const AppLayout = ({ children, showNotifications = true }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadTotal } = useConversations();
  const { profile } = useProfile();

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
      {/* Header Actions - Single Row */}
      {showNotifications && user && (
        <div className="fixed top-3 start-3 end-3 z-50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-border/20 shadow-lg">
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
      
      <main className="pb-20">
        {children}
      </main>
      <FloatingAIButton />
      <BottomNav />
    </div>
  );
};
