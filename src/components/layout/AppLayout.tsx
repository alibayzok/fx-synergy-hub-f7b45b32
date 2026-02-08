import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { FloatingAIButton } from './FloatingAIButton';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
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
    <div className="min-h-screen bg-background">
      {/* Floating Buttons */}
      {showNotifications && user && (
        <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
          {/* Profile Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative glass-card border border-border/30 hover:bg-primary/10 p-0 overflow-hidden"
            onClick={() => navigate('/profile')}
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>

          {/* Messages Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative glass-card border border-border/30 hover:bg-primary/10"
            onClick={() => navigate('/messages')}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadTotal > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -end-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
              >
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </Badge>
            )}
          </Button>
          
          {/* Notifications */}
          <NotificationsPanel />
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
