import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Crown, 
  Plus,
  ArrowLeft,
  Trash2,
  Edit,
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Database,
  FileText,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TradeFormDialog } from '@/components/admin/TradeFormDialog';
import { UserManagement } from '@/components/admin/UserManagement';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { ServiceRequestsManagement } from '@/components/admin/ServiceRequestsManagement';
import { DatabaseExport } from '@/components/admin/DatabaseExport';
import { AnalysesManagement } from '@/components/admin/AnalysesManagement';
import FlaggedContentManagement from '@/components/admin/FlaggedContentManagement';
import { CoursesManagement } from '@/components/admin/CoursesManagement';
interface Trade {
  id: string;
  symbol: string;
  asset_type: string;
  direction: string;
  entry_price: number;
  sl_price: number;
  tp_prices: number[];
  status: string;
  visibility: string;
  reason: string;
  created_at: string;
}

const AdminPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTrades();
    }
  }, [isAdmin]);

  const fetchTrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setTrades(data || []);
    }
    setLoading(false);
  };

  const handleDeleteTrade = async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({ title: t('admin.tradeDeleted') });
      fetchTrades();
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
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
          <TabsList className="grid w-full grid-cols-8">
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
            <TabsTrigger value="trades" className="gap-1 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.trades')}</span>
            </TabsTrigger>
            <TabsTrigger value="analyses" className="gap-1 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">التحليلات</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1 text-xs sm:text-sm">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">الكورسات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1 text-xs sm:text-sm">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.export.tab')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
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

          {/* Service Requests Tab */}
          <TabsContent value="requests">
            <ServiceRequestsManagement />
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <FlaggedContentManagement />
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t('admin.manageTrades')}</h2>
              <Button onClick={() => { setEditingTrade(null); setShowTradeForm(true); }} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('admin.newTrade')}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('admin.noTrades')}
              </div>
            ) : (
              <div className="space-y-3">
                {trades.map((trade) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card/50 border border-border/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          trade.direction === 'buy' 
                            ? "bg-profit/20 text-profit" 
                            : "bg-loss/20 text-loss"
                        )}>
                          {trade.direction.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{trade.symbol}</p>
                          <p className="text-xs text-muted-foreground trading-number">
                            {t('trades.entry')}: {trade.entry_price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={trade.visibility === 'vip' ? 'default' : 'secondary'}>
                          {trade.visibility === 'vip' && <Crown className="w-3 h-3 mr-1" />}
                          {trade.visibility.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{trade.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingTrade(trade); setShowTradeForm(true); }}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="gap-1 text-loss hover:text-loss"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analyses Tab */}
          <TabsContent value="analyses">
            <AnalysesManagement />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <CoursesManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <DatabaseExport />
          </TabsContent>
        </Tabs>
      </div>

      {/* Trade Form Dialog */}
      <TradeFormDialog
        open={showTradeForm}
        onOpenChange={setShowTradeForm}
        trade={editingTrade}
        onSuccess={() => {
          setShowTradeForm(false);
          setEditingTrade(null);
          fetchTrades();
        }}
      />
    </div>
  );
};

export default AdminPage;
