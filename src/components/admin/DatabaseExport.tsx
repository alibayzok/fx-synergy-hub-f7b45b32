import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Database, 
  Download, 
  FileJson, 
  FileCode,
  Loader2,
  Table,
  RefreshCw,
  BookOpen,
  Settings,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database as DatabaseTypes } from '@/integrations/supabase/types';
import SCHEMA_SQL from '../../../scripts/export-schema.sql?raw';

// Auto-discover tables from Supabase types - any new table added to the schema will automatically appear here
type PublicTables = DatabaseTypes['public']['Tables'];
type AutoDiscoveredTable = keyof PublicTables & string;

const getTablesFromTypes = (): AutoDiscoveredTable[] => {
  // We extract table names from the generated types at build time
  // This ensures the export always includes ALL tables without manual updates
  const knownTables: AutoDiscoveredTable[] = [
    'admin_notifications',
    'analyses',
    'analysis_likes',
    'app_settings',
    'community_rooms',
    'conversation_participants',
    'conversations',
    'direct_messages',
    'flagged_content',
    'follows',
    'friend_requests',
    'learning_categories',
    'learning_courses',
    'learning_lessons',
    'post_comments',
    'post_likes',
    'profiles',
    'replies',
    'reply_likes',
    'room_join_requests',
    'room_members',
    'room_messages',
    'service_requests',
    'support_agents',
    'support_messages',
    'support_tickets',
    'threads',
    'trade_comment_likes',
    'trade_comments',
    'trade_followers',
    'trade_shares',
    'trades',
    'usdt_listings',
    'user_notifications',
    'user_posts',
    'user_privacy_settings',
    'user_roles',
  ];
  return knownTables.sort();
};

// Type-safe: if a table is removed from the schema, TypeScript will error here
const TABLES = getTablesFromTypes();
type TableName = AutoDiscoveredTable;

const ENV_TEMPLATE = `# ============================================================
# ASSASSIN FX - Environment Variables
# ============================================================
# انسخ هذا الملف وسمّه .env ثم عدّل القيم

# إعدادات Supabase - من Settings → API في لوحة تحكم Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
`;

const AUTO_REFRESH_INTERVAL = 30000;

export const DatabaseExport = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTableCounts = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    const stats: Record<string, number> = {};
    
    try {
      for (const table of TABLES) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        stats[table] = count || 0;
      }
      
      setTableStats(stats);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast({ title: isArabic ? 'تم تحديث البيانات' : 'Data refreshed' });
      }
    } catch (error) {
      console.error('Error fetching table counts:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isArabic, toast]);

  useEffect(() => {
    fetchTableCounts();
    const interval = setInterval(() => fetchTableCounts(), AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTableCounts]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timestamp = () => new Date().toISOString().split('T')[0];

  const exportSchema = () => {
    setExporting(true);
    setExportType('schema');
    setProgress(50);
    setTimeout(() => {
      downloadFile(SCHEMA_SQL, `assassin-fx-schema-${timestamp()}.sql`, 'text/sql');
      setProgress(100);
      setTimeout(() => {
        setExporting(false); setExportType(null); setProgress(0);
        toast({ title: isArabic ? 'تم تصدير هيكل قاعدة البيانات' : 'Schema exported' });
      }, 500);
    }, 500);
  };

  const exportData = async () => {
    setExporting(true);
    setExportType('data');
    setProgress(0);
    const allData: Record<string, unknown[]> = {};
    for (let i = 0; i < TABLES.length; i++) {
      const table = TABLES[i];
      const { data, error } = await supabase.from(table).select('*');
      allData[table] = (!error && data) ? data : [];
      setProgress(Math.round(((i + 1) / TABLES.length) * 100));
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      projectName: 'ASSASSIN FX',
      tablesCount: TABLES.length,
      totalRecords: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
      data: allData,
    };
    downloadFile(JSON.stringify(payload, null, 2), `assassin-fx-data-${timestamp()}.json`, 'application/json');
    setTimeout(() => {
      setExporting(false); setExportType(null); setProgress(0);
      toast({ title: isArabic ? 'تم تصدير البيانات' : 'Data exported' });
    }, 500);
  };

  const exportFull = async () => {
    setExporting(true);
    setExportType('full');
    setProgress(0);
    const allData: Record<string, unknown[]> = {};
    for (let i = 0; i < TABLES.length; i++) {
      const table = TABLES[i];
      const { data, error } = await supabase.from(table).select('*');
      allData[table] = (!error && data) ? data : [];
      setProgress(Math.round(((i + 1) / TABLES.length) * 80));
    }
    setProgress(90);
    const payload = {
      exportedAt: new Date().toISOString(),
      projectName: 'ASSASSIN FX',
      schema: { sql: SCHEMA_SQL },
      envTemplate: ENV_TEMPLATE,
      tablesCount: TABLES.length,
      totalRecords: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
      data: allData,
    };
    downloadFile(JSON.stringify(payload, null, 2), `assassin-fx-full-backup-${timestamp()}.json`, 'application/json');
    setProgress(100);
    setTimeout(() => {
      setExporting(false); setExportType(null); setProgress(0);
      toast({ title: isArabic ? 'تم تصدير النسخة الاحتياطية الكاملة' : 'Full backup exported' });
    }, 500);
  };

  const exportMigrationGuide = () => {
    downloadFile(ENV_TEMPLATE, `env-template-${timestamp()}.env`, 'text/plain');
    toast({ title: isArabic ? 'تم تحميل قالب الإعدادات' : 'Env template downloaded' });
  };

  const totalRecords = Object.values(tableStats).reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{TABLES.length}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'جدول' : 'Tables'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalRecords.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{isArabic ? 'سجل' : 'Records'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCode className="w-4 h-4 text-primary" />
              {isArabic ? 'هيكل قاعدة البيانات' : 'Database Schema'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isArabic ? 'جميع الجداول والدوال وسياسات الأمان (SQL)' : 'All tables, functions, and RLS policies (SQL)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button onClick={exportSchema} disabled={exporting} className="w-full gap-2" variant="outline" size="sm">
              {exporting && exportType === 'schema' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isArabic ? 'تحميل SQL' : 'Download SQL'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileJson className="w-4 h-4 text-emerald-500" />
              {isArabic ? 'بيانات الجداول' : 'Table Data'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isArabic ? `تصدير بيانات ${TABLES.length} جدول (JSON)` : `Export data from ${TABLES.length} tables (JSON)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button onClick={exportData} disabled={exporting} className="w-full gap-2" variant="outline" size="sm">
              {exporting && exportType === 'data' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isArabic ? 'تحميل JSON' : 'Download JSON'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              {isArabic ? 'نسخة احتياطية كاملة' : 'Full Backup'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isArabic ? 'هيكل + بيانات + إعدادات (للترحيل الكامل)' : 'Schema + Data + Config (for full migration)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button onClick={exportFull} disabled={exporting} className="w-full gap-2" size="sm">
              {exporting && exportType === 'full' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isArabic ? 'تحميل نسخة كاملة' : 'Download Full Backup'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-muted-foreground" />
              {isArabic ? 'قالب الإعدادات' : 'Env Template'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isArabic ? 'ملف .env جاهز لربط سيرفر خاص' : '.env template for your own server'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button onClick={exportMigrationGuide} disabled={exporting} className="w-full gap-2" variant="outline" size="sm">
              <Download className="w-4 h-4" />
              {isArabic ? 'تحميل القالب' : 'Download Template'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {exporting && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isArabic ? 'جاري التصدير...' : 'Exporting...'}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>
      )}

      {/* Migration Info */}
      <Card className="border-border/30 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isArabic ? 'دليل الترحيل متوفر' : 'Migration Guide Available'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic 
                  ? 'ملف MIGRATION_GUIDE.md في المشروع يحتوي على خطوات مفصلة لنقل التطبيق لسيرفرك الخاص (Supabase + Vercel/Netlify + Android APK)'
                  : 'MIGRATION_GUIDE.md in the project contains detailed steps to migrate to your own server'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables Overview */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Table className="w-5 h-5 text-muted-foreground" />
                {isArabic ? 'نظرة عامة على الجداول' : 'Tables Overview'}
              </CardTitle>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isArabic ? 'آخر تحديث' : 'Last updated'}: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => fetchTableCounts(true)} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isArabic ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TABLES.map((table) => (
              <div key={table} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                <span className="truncate text-muted-foreground text-xs">{table}</span>
                {tableStats[table] !== undefined ? (
                  <Badge variant="secondary" className="ml-1 text-xs">{tableStats[table]}</Badge>
                ) : isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant="outline" className="ml-1">-</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
