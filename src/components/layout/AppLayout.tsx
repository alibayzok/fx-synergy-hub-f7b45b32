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
      {/* Header Actions */}
      {showNotifications && user && (
        <div className="fixed top-3 start-3 end-3 z-50 flex items-center justify-between">
          {/* Right side - Profile */}
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md rounded-full px-1.5 py-1 border border-border/20 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full hover:bg-accent/50 transition-colors p-0 overflow-hidden"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>

          {/* Left side - Actions */}
          <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-md rounded-full px-1 py-1 border border-border/20 shadow-lg">
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
              className="relative h-8 w-8 rounded-full hover:bg-accent/50 transition-colors"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {unreadTotal > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-0.5 -end-0.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center text-[8px] font-bold rounded-full"
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
