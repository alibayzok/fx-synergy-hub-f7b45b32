import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Eye, Heart, TrendingUp, TrendingDown, Lock, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const AnalysesPage = () => {
  const { t, i18n } = useTranslation();
  const { analyses, loading, likeAnalysis, unlikeAnalysis } = useAnalyses();
  const { isVip } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [likedAnalyses, setLikedAnalyses] = useState<Set<string>>(new Set());

  const locale = i18n.language === 'ar' ? ar : enUS;

  const filteredAnalyses = analyses.filter(analysis => {
    if (activeFilter === 'all') return true;
    return analysis.asset_type === activeFilter;
  });

  const handleLike = async (analysisId: string) => {
    if (likedAnalyses.has(analysisId)) {
      await unlikeAnalysis(analysisId);
      setLikedAnalyses(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });
    } else {
      await likeAnalysis(analysisId);
      setLikedAnalyses(prev => new Set(prev).add(analysisId));
    }
  };

  const getAssetTypeColor = (type: string | null) => {
    switch (type) {
      case 'forex': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'crypto': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'metals': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAssetTypeLabel = (type: string | null) => {
    switch (type) {
      case 'forex': return 'فوركس';
      case 'crypto': return 'كريبتو';
      case 'metals': return 'معادن';
      default: return 'عام';
    }
  };

  return (
    <AppLayout>
      <div className="p-4 pb-24 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">التحليلات</h1>
              <p className="text-sm text-muted-foreground">تحليلات فنية احترافية</p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} dir="rtl">
          <TabsList className="w-full grid grid-cols-4 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
            <TabsTrigger value="forex" className="text-xs">فوركس</TabsTrigger>
            <TabsTrigger value="crypto" className="text-xs">كريبتو</TabsTrigger>
            <TabsTrigger value="metals" className="text-xs">معادن</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Analyses List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAnalyses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد تحليلات حالياً</p>
            </motion.div>
          ) : (
            filteredAnalyses.map((analysis, index) => {
              const isLocked = analysis.visibility === 'vip' && !isVip;
              
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden ${isLocked ? 'opacity-75' : ''}`}>
                    {/* VIP Badge */}
                    {analysis.visibility === 'vip' && (
                      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-1.5 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">محتوى VIP</span>
                      </div>
                    )}
                    
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {analysis.symbol && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {analysis.symbol}
                              </Badge>
                            )}
                            <Badge variant="outline" className={getAssetTypeColor(analysis.asset_type)}>
                              {getAssetTypeLabel(analysis.asset_type)}
                            </Badge>
                            {analysis.timeframe && (
                              <Badge variant="secondary" className="text-xs">
                                {analysis.timeframe}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg leading-tight">
                            {analysis.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`relative ${isLocked ? 'max-h-20 overflow-hidden' : ''}`}>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {isLocked ? analysis.content.substring(0, 150) + '...' : analysis.content}
                        </p>
                        {isLocked && (
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex items-end justify-center pb-4">
                            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                              <Lock className="w-4 h-4 ml-2" />
                              ترقية لـ VIP
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {formatDistanceToNow(new Date(analysis.created_at), {
                                addSuffix: true,
                                locale
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{analysis.views_count || 0}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(analysis.id)}
                          className={`gap-1.5 ${likedAnalyses.has(analysis.id) ? 'text-red-500' : 'text-muted-foreground'}`}
                          disabled={isLocked}
                        >
                          <Heart className={`w-4 h-4 ${likedAnalyses.has(analysis.id) ? 'fill-current' : ''}`} />
                          <span>{analysis.likes_count || 0}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AnalysesPage;
