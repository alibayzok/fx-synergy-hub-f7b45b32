import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Users, Clock, Crown, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Trade } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TradeCardProps {
  trade: Trade;
  onFollow?: () => void;
  onDiscussion?: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tp_hit: 'bg-profit/20 text-profit border-profit/30',
  sl_hit: 'bg-loss/20 text-loss border-loss/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  closed_manual: 'bg-muted text-muted-foreground border-border',
};

export const TradeCard = ({ trade, onFollow, onDiscussion }: TradeCardProps) => {
  const { t } = useTranslation();
  const isBuy = trade.direction === 'buy';
  const isVip = trade.visibility === 'vip';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        "bg-card hover:bg-card/80",
        isVip ? "border-vip/30 vip-glow" : "border-border/50"
      )}
    >
      {/* VIP Badge */}
      {isVip && (
        <div className="absolute -top-2 -end-2">
          <Badge variant="outline" className="bg-vip text-vip-foreground border-vip gap-1 text-xs">
            <Crown className="w-3 h-3" />
            VIP
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Direction Arrow */}
          <div className={cn(
            "p-2 rounded-lg",
            isBuy ? "bg-profit/20" : "bg-loss/20"
          )}>
            {isBuy ? (
              <ArrowUp className="w-5 h-5 text-profit" />
            ) : (
              <ArrowDown className="w-5 h-5 text-loss" />
            )}
          </div>
          
          {/* Symbol & Direction */}
          <div>
            <h3 className="font-bold text-lg text-foreground">{trade.symbol}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                "font-medium",
                isBuy ? "text-profit" : "text-loss"
              )}>
                {t(`trades.${trade.direction}`)}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{trade.timeframe}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={cn("text-xs", statusColors[trade.status])}
        >
          {t(`trades.${trade.status}`)}
        </Badge>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-3 gap-3 mb-3 p-3 rounded-lg bg-muted/30">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('trades.entry')}</p>
          <p className="trading-number font-semibold text-foreground">
            {trade.entry_price.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(`trades.${trade.entry_type}`)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('trades.stopLoss')}</p>
          <p className="trading-number font-semibold text-loss">
            {trade.sl_price.toLocaleString('en-US')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('trades.takeProfit')}</p>
          <div className="flex flex-col gap-0.5">
            {trade.tp_prices.map((tp, i) => (
              <p key={i} className="trading-number font-semibold text-profit text-sm">
                {tp.toLocaleString('en-US')}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {trade.reason}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="trading-number">{trade.followers_count}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(trade.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscussion}
            className="h-8 px-3"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onFollow}
            className="h-8 px-3 border-primary/50 hover:bg-primary hover:text-primary-foreground"
          >
            {t('trades.follow')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
