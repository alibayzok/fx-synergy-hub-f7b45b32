import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, ArrowLeft, LayoutDashboard, BarChart3, ClipboardList,
  Database, FileText, AlertTriangle, GraduationCap, Settings2, Radio, Crown,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ArticlesManagement } from '@/components/admin/ArticlesManagement';
import { ServicesAndBrokersManagement } from '@/components/admin/ServicesAndBrokersManagement';
import { VerificationManagement } from '@/components/admin/VerificationManagement';
import { ReferralManagement } from '@/components/admin/ReferralManagement';

const contentSections = [
  {
    title: 'إدارة المحتوى',
    titleEn: 'Content Management',
    description: 'إدارة المحتوى والمنشورات والتحليلات',
    items: [
      { value: 'analyses', icon: FileText, label: 'التحليلات', labelEn: 'Analyses', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
      { value: 'signals', icon: Radio, label: 'الإشارات', labelEn: 'Signals', color: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-500', borderColor: 'border-emerald-500/20' },
      { value: 'articles', icon: FileText, label: 'المقالات', labelEn: 'Articles', color: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-500', borderColor: 'border-violet-500/20' },
      { value: 'courses', icon: GraduationCap, label: 'الكورسات', labelEn: 'Courses', color: 'from-amber-500/20 to-yellow-500/20', iconColor: 'text-amber-500', borderColor: 'border-amber-500/20' },
      { value: 'moderation', icon: AlertTriangle, label: 'المخالفات', labelEn: 'Moderation', color: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-500', borderColor: 'border-red-500/20' },
    ],
  },
  {
    title: 'إدارة النظام',
    titleEn: 'System Management',
    description: 'المستخدمين والطلبات والإعدادات',
    items: [
      { value: 'users', icon: Users, label: 'المستخدمين', labelEn: 'Users', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
      { value: 'verification', icon: Shield, label: 'التوثيق', labelEn: 'Verification', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
      { value: 'referrals', icon: Users, label: 'الإحالات', labelEn: 'Referrals', color: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-500', borderColor: 'border-pink-500/20' },
      { value: 'requests', icon: ClipboardList, label: 'الطلبات', labelEn: 'Requests', color: 'from-orange-500/20 to-amber-500/20', iconColor: 'text-orange-500', borderColor: 'border-orange-500/20' },
      { value: 'services-mgmt', icon: BarChart3, label: 'الخدمات', labelEn: 'Services', color: 'from-teal-500/20 to-cyan-500/20', iconColor: 'text-teal-500', borderColor: 'border-teal-500/20' },
      { value: 'cms', icon: Settings2, label: 'CMS', labelEn: 'CMS', color: 'from-slate-500/20 to-gray-500/20', iconColor: 'text-slate-400', borderColor: 'border-slate-500/20' },
      { value: 'export', icon: Database, label: 'تصدير', labelEn: 'Export', color: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-500', borderColor: 'border-indigo-500/20' },
    ],
  },
];

const componentMap: Record<string, React.FC> = {
  requests: ServiceRequestsManagement,
  'services-mgmt': ServicesAndBrokersManagement,
  moderation: FlaggedContentManagement,
  analyses: AnalysesManagement,
  signals: SignalsManagement,
  courses: CoursesManagement,
  users: UserManagement,
  articles: ArticlesManagement,
  cms: CMSManagement,
  export: DatabaseExport,
  verification: VerificationManagement,
  referrals: ReferralManagement,
};

const AdminPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isModerator, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Moderators can access content sections, admins can access everything
  const hasAccess = isAdmin || isModerator;
  const moderatorOnlyItems = ['analyses', 'signals', 'articles', 'courses', 'moderation', 'verification', 'users'];

  useEffect(() => {
    if (!authLoading && !hasAccess) navigate('/');
  }, [hasAccess, authLoading, navigate]);

  // Block moderators from accessing system sections
  useEffect(() => {
    if (!isAdmin && activeSection && !moderatorOnlyItems.includes(activeSection)) {
      setActiveSection(null);
    }
  }, [isAdmin, activeSection]);

  if (authLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Moderators only see content sections, admins see everything
  const visibleSections = isAdmin 
    ? contentSections 
    : contentSections.map(s => ({
        ...s,
        items: s.items.filter(i => moderatorOnlyItems.includes(i.value))
      })).filter(s => s.items.length > 0);

  // Find active item info for breadcrumb
  const activeItem = contentSections.flatMap(s => s.items).find(i => i.value === activeSection);
  const ActiveComponent = activeSection ? componentMap[activeSection] : null;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeSection ? setActiveSection(null) : navigate('/')}
              className="rounded-xl hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  {activeItem ? <activeItem.icon className={cn("w-5 h-5", activeItem.iconColor)} /> : <Shield className="w-5 h-5 text-primary" />}
                </div>
                <div className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  {activeItem ? (isRTL ? activeItem.label : activeItem.labelEn) : t('admin.title')}
                </h1>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                  {activeItem ? (isRTL ? 'لوحة التحكم' : 'Admin Panel') : 'مركز التحكم الرئيسي'}
                </p>
              </div>
            </div>
          </div>
          <AdminNotifications />
        </div>
      </header>

      <div className="p-4 pb-24">
        {activeSection && ActiveComponent ? (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ActiveComponent />
          </motion.div>
        ) : (
          <div className="space-y-6">
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

            {/* Stats - admin only */}
            {isAdmin && <DashboardStats />}

            {/* Quick Actions - admin only */}
            {(isAdmin || isModerator) && (
              <div className={cn("grid gap-3", isAdmin ? "grid-cols-2" : "grid-cols-1")}>
                {isAdmin && (
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
                )}
                <Button
                  onClick={() => navigate('/support-dashboard')}
                  variant="outline"
                  className="h-auto py-4 rounded-2xl gap-2 text-sm font-semibold border-border/30 hover:bg-card/50"
                >
                  <Shield className="w-5 h-5 text-primary" />
                  لوحة الدعم
                </Button>
              </div>
            )}

            {/* Card Sections */}
            {visibleSections.map((section, sIdx) => (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + sIdx * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h3 className="text-base font-bold text-foreground">{isRTL ? section.title : section.titleEn}</h3>
                  <span className="text-[11px] text-muted-foreground">({section.items.length})</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {section.items.map((item, idx) => (
                    <motion.button
                      key={item.value}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + sIdx * 0.08 + idx * 0.04 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveSection(item.value)}
                      className={cn(
                        "group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl text-center",
                        "bg-card/60 border border-border/30 backdrop-blur-sm",
                        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                        "transition-all duration-200"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        item.color, item.borderColor, "border"
                      )}>
                        <item.icon className={cn("w-5.5 h-5.5", item.iconColor)} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {isRTL ? item.label : item.labelEn}
                      </span>
                      <ChevronRight className="absolute top-3 end-3 w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors rtl:rotate-180" />
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            ))}

            {/* Recent Activity - admin only */}
            {(isAdmin || isModerator) && (
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 px-1">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h3 className="text-base font-bold text-foreground">{t('admin.activity.title')}</h3>
                </div>
                <RecentActivity />
              </motion.section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
