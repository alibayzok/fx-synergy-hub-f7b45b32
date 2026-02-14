import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, Circle, Trophy, ChevronDown, ChevronUp, Star, MessageSquare, TrendingUp, Heart, PenLine, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyQuests, DailyQuestWithProgress } from '@/hooks/useDailyQuests';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare, TrendingUp, Heart, PenLine, LogIn, Star,
};

const QuestItem = ({ quest, isRTL }: { quest: DailyQuestWithProgress; isRTL: boolean }) => {
  const Icon = iconMap[quest.icon] || Star;
  const title = isRTL ? quest.title_ar : quest.title_en;
  const desc = isRTL ? quest.description_ar : quest.description_en;

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
        quest.completed 
          ? 'bg-primary/10 border border-primary/20' 
          : 'bg-muted/30 border border-border/30'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        quest.completed 
          ? 'bg-primary/20 text-primary' 
          : 'bg-muted/50 text-muted-foreground'
      }`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${quest.completed ? 'text-primary line-through opacity-70' : 'text-foreground'}`}>
          {title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!quest.completed && quest.target_count > 1 && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {quest.current_count}/{quest.target_count}
          </span>
        )}
        <Badge variant={quest.completed ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-5">
          +{quest.points_reward}
        </Badge>
        {quest.completed ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </motion.div>
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40" />
        )}
      </div>
    </motion.div>
  );
};

export const DailyQuestsWidget = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { quests, streak, loading, completedCount, totalCount, progressPercent, allCompleted } = useDailyQuests();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (quests.length === 0) return null;

  const totalPoints = quests.reduce((sum, q) => sum + q.points_reward, 0);
  const earnedPoints = quests.filter(q => q.completed).reduce((sum, q) => sum + q.points_reward, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3.5 flex items-center gap-3 hover:bg-accent/5 transition-colors"
      >
        {/* Streak flame */}
        <div className="relative shrink-0">
          <motion.div
            animate={streak.current_streak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              allCompleted 
                ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30'
                : streak.current_streak > 0
                  ? 'bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/30'
                  : 'bg-muted/40 border border-border/30'
            }`}
          >
            <Flame className={`w-5.5 h-5.5 ${
              allCompleted ? 'text-primary-foreground' : streak.current_streak > 0 ? 'text-destructive' : 'text-muted-foreground'
            }`} />
          </motion.div>
          {streak.current_streak > 0 && (
            <span className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {streak.current_streak}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 text-start">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {isRTL ? 'المهام اليومية' : 'Daily Quests'}
            </h3>
            {allCompleted && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Badge className="bg-primary/20 text-primary text-[10px] border-primary/30">
                  <Trophy className="w-3 h-3 me-0.5" />
                  {isRTL ? 'مكتمل!' : 'Done!'}
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-primary">
            {earnedPoints}/{totalPoints}
            <Star className="w-3 h-3 inline ms-0.5 -mt-0.5" />
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Streak info bar */}
      {streak.current_streak > 0 && (
        <div className="px-3.5 pb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-destructive/80">
            <Flame className="w-3 h-3" />
            {isRTL 
              ? `${streak.current_streak} ${streak.current_streak === 1 ? 'يوم' : 'أيام'} متتالية 🔥`
              : `${streak.current_streak} day streak 🔥`
            }
            {streak.current_streak === streak.longest_streak && streak.current_streak > 1 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-destructive/30 text-destructive">
                {isRTL ? 'رقم قياسي!' : 'Best!'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Expandable quest list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              {quests.map(quest => (
                <QuestItem key={quest.id} quest={quest} isRTL={isRTL} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
