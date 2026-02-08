import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, Heart, Crown, FileText, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">إدارة التحليلات</h2>
          <Badge variant="secondary" className="trading-number">{analyses.length}</Badge>
        </div>
        <Button
          onClick={() => {
            setSelectedAnalysis(null);
            setShowFormDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          تحليل جديد
        </Button>
      </div>

      {/* Analyses List */}
      <AnimatePresence mode="popLayout">
        {analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد تحليلات بعد</p>
            <p className="text-sm text-muted-foreground">ابدأ بنشر أول تحليل</p>
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
                  "p-4 rounded-xl border transition-all",
                  "bg-card hover:bg-card/80",
                  analysis.visibility === 'vip' 
                    ? "border-vip/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]" 
                    : "border-border/50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{analysis.title}</h3>
                      {analysis.visibility === 'vip' && (
                        <Badge variant="outline" className="bg-vip text-vip-foreground border-vip gap-1 text-[10px]">
                          <Crown className="w-3 h-3" />
                          VIP
                        </Badge>
                      )}
                      {analysis.symbol && (
                        <Badge variant="secondary" className="text-xs">
                          {analysis.symbol}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {analysis.timeframe}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {analysis.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(analysis)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-loss hover:text-loss"
                      onClick={() => setDeleteId(analysis.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Form Dialog */}
      <AnalysisFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        analysis={selectedAnalysis}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحليل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التحليل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-loss hover:bg-loss/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
