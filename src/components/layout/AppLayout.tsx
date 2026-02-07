import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export const AppLayout = ({ children, showNotifications = true }: AppLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Notifications Button */}
      {showNotifications && user && (
        <div className="fixed top-4 end-4 z-50">
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
