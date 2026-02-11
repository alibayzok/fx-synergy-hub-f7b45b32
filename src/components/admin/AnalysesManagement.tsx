import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, Heart, Crown, FileText, Clock, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAnalyses } from '@/hooks/useAnalyses';
import { AnalysisFormDialog } from './AnalysisFormDialog';
import { cn } from '@/lib/utils';

interface Analysis {
  id: string;
  title: string;
  content: string;
  symbol: string | null;
  asset_type: 'forex' | 'metals' | 'crypto' | null;
  timeframe: 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  visibility: 'free' | 'vip';
  attachments: string[];
  views_count: number;
  likes_count: number;
  created_at: string;
}

export const AnalysesManagement = () => {
  const { t } = useTranslation();
  const { analyses, loading, deleteAnalysis } = useAnalyses();
  
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setShowFormDialog(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAnalysis(deleteId);
      setDeleteId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setSelectedAnalysis(null);
  };

  const freeCount = analyses.filter(a => a.visibility === 'free').length;
  const vipCount = analyses.filter(a => a.visibility === 'vip').length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-purple-500/15 via-purple-600/5 to-transparent border border-purple-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/20">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة التحليلات</h2>
              <p className="text-xs text-muted-foreground/70">
                {analyses.length} تحليل • {freeCount} مجاني • {vipCount} VIP
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setSelectedAnalysis(null); setShowFormDialog(true); }}
            className="gap-2 rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            تحليل جديد
          </Button>
        </div>
      </motion.div>

      {/* Analyses List */}
      <AnimatePresence mode="popLayout">
        {analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <FileText className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">لا توجد تحليلات بعد</p>
            <p className="text-sm text-muted-foreground/60 mt-1">ابدأ بنشر أول تحليل</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01]",
                  analysis.visibility === 'vip' 
                    ? "bg-gradient-to-br from-amber-500/8 to-transparent border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.06)]" 
                    : "bg-card/50 border-border/25 hover:border-border/40"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{analysis.title}</h3>
                      {analysis.visibility === 'vip' && (
                        <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/25 gap-1 text-[10px] rounded-lg">
                          <Crown className="w-3 h-3" />
                          VIP
                        </Badge>
                      )}
                      {analysis.symbol && (
                        <Badge variant="secondary" className="text-xs rounded-lg">{analysis.symbol}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs rounded-lg">{analysis.timeframe}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-3">{analysis.content}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="trading-number">{analysis.views_count}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="trading-number">{analysis.likes_count}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(analysis.created_at).toLocaleDateString('ar')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleEdit(analysis)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-loss hover:text-loss hover:bg-loss/10" onClick={() => setDeleteId(analysis.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnalysisFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        analysis={selectedAnalysis}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحليل</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا التحليل؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-loss hover:bg-loss/90">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
