import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useMessaging';

interface AppLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export const AppLayout = ({ children, showNotifications = true }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadTotal } = useConversations();

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Buttons */}
      {showNotifications && user && (
        <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
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
      <BottomNav />
    </div>
  );
};
