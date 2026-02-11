import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Plus, ArrowLeft, LayoutDashboard, BarChart3, ClipboardList,
  Database, FileText, AlertTriangle, GraduationCap, Settings2, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { UserManagement } from '@/components/admin/UserManagement';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { ServiceRequestsManagement } from '@/components/admin/ServiceRequestsManagement';
import { DatabaseExport } from '@/components/admin/DatabaseExport';
import { AnalysesManagement } from '@/components/admin/AnalysesManagement';
import FlaggedContentManagement from '@/components/admin/FlaggedContentManagement';
import { CoursesManagement } from '@/components/admin/CoursesManagement';
import { CMSManagement } from '@/components/admin/CMSManagement';
import { SignalsManagement } from '@/components/admin/SignalsManagement';

const AdminPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">{t('common.loading')}</p></div>;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{t('admin.title')}</h1>
            </div>
          </div>
          <AdminNotifications />
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 text-xs sm:text-sm">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.requests')}</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">المخالفات</span>
            </TabsTrigger>
            <TabsTrigger value="analyses" className="gap-1 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">التحليلات</span>
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-1 text-xs sm:text-sm">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">الإشارات</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1 text-xs sm:text-sm">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">الكورسات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="cms" className="gap-1 text-xs sm:text-sm">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">CMS</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1 text-xs sm:text-sm">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.export.tab')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t('admin.activity.title')}
              </h3>
              <RecentActivity />
            </div>
          </TabsContent>

          <TabsContent value="requests"><ServiceRequestsManagement /></TabsContent>
          <TabsContent value="moderation"><FlaggedContentManagement /></TabsContent>
          <TabsContent value="analyses"><AnalysesManagement /></TabsContent>
          <TabsContent value="signals"><SignalsManagement /></TabsContent>
          <TabsContent value="courses"><CoursesManagement /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="cms"><CMSManagement /></TabsContent>
          <TabsContent value="export"><DatabaseExport /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
