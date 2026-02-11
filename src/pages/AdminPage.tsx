import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, ArrowLeft, LayoutDashboard, BarChart3, ClipboardList,
  Database, FileText, AlertTriangle, GraduationCap, Settings2, Radio, Crown,
  Sparkles
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

const tabs = [
  { value: 'dashboard', icon: LayoutDashboard, label: 'لوحة القيادة' },
  { value: 'requests', icon: ClipboardList, label: 'الطلبات' },
  { value: 'moderation', icon: AlertTriangle, label: 'المخالفات' },
  { value: 'analyses', icon: FileText, label: 'التحليلات' },
  { value: 'signals', icon: Radio, label: 'الإشارات' },
  { value: 'courses', icon: GraduationCap, label: 'الكورسات' },
  { value: 'users', icon: Users, label: 'المستخدمين' },
  { value: 'cms', icon: Settings2, label: 'CMS' },
  { value: 'export', icon: Database, label: 'تصدير' },
];

const AdminPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">{t('admin.title')}</h1>
                <p className="text-[10px] text-muted-foreground/60 font-medium">مركز التحكم الرئيسي</p>
              </div>
            </div>
          </div>
          <AdminNotifications />
        </div>
      </header>

      <div className="p-4 pb-24">
        <Tabs defaultValue="dashboard" className="space-y-5">
          {/* Enhanced Tab Navigation */}
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full gap-1 p-1 bg-card/50 border border-border/20 rounded-2xl backdrop-blur-sm">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20",
                    "transition-all duration-200"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/15"
            >
              <div className="absolute top-0 end-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    مرحباً بك في مركز التحكم
                  </h2>
                  <p className="text-xs text-muted-foreground">إدارة شاملة لمنصتك من مكان واحد</p>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <DashboardStats />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate('/admin/subscriptions')}
                className={cn(
                  "h-auto py-4 rounded-2xl gap-2 text-sm font-semibold",
                  "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                  "text-white border-0 shadow-lg shadow-amber-500/20"
                )}
              >
                <Crown className="w-5 h-5" />
                إدارة VIP
              </Button>
              <Button
                onClick={() => navigate('/support-dashboard')}
                variant="outline"
                className="h-auto py-4 rounded-2xl gap-2 text-sm font-semibold border-border/30 hover:bg-card/50"
              >
                <Shield className="w-5 h-5 text-primary" />
                لوحة الدعم
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">{t('admin.activity.title')}</h3>
              </div>
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
