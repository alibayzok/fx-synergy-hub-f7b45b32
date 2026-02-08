import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Users, Clock, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Trade } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useTranslation as useI18n } from 'react-i18next';

interface TradeCardProps {
  trade: Trade;
  onClick?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  pending: { 
    bg: 'bg-yellow-500/15', 
    text: 'text-yellow-400', 
    border: 'border-yellow-500/30' 
  },
  running: { 
    bg: 'bg-blue-500/15', 
    text: 'text-blue-400', 
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
  },
  tp_hit: { 
    bg: 'bg-profit/15', 
    text: 'text-profit', 
    border: 'border-profit/30' 
  },
  sl_hit: { 
    bg: 'bg-loss/15', 
    text: 'text-loss', 
    border: 'border-loss/30' 
  },
  cancelled: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    border: 'border-border' 
  },
  closed_manual: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    border: 'border-border' 
  },
};

export const TradeCard = ({ trade, onClick }: TradeCardProps) => {
  const { t, i18n } = useTranslation();
  const isBuy = trade.direction === 'buy';
  const isVip = trade.visibility === 'vip';
  const isRtl = i18n.language === 'ar';
  const statusStyle = statusConfig[trade.status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl border transition-all cursor-pointer group",
        "bg-gradient-to-br from-card to-card/80",
        isVip 
          ? "border-vip/40 shadow-[0_0_20px_rgba(255,215,0,0.15)]" 
          : "border-border/50 hover:border-border",
        statusStyle.glow
      )}
    >
      {/* VIP Ribbon */}
      {isVip && (
        <div className="absolute -top-px -end-px">
          <div className="relative">
            <div className="absolute inset-0 bg-vip blur-sm opacity-50" />
            <Badge 
              variant="outline" 
              className="relative bg-gradient-to-r from-vip to-yellow-400 text-vip-foreground border-0 gap-1 text-[10px] font-bold rounded-none rounded-es-lg rounded-se-xl px-2"
            >
              <Crown className="w-3 h-3" />
              VIP
            </Badge>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start gap-3">
        {/* Direction Indicator */}
        <div className={cn(
          "relative p-3 rounded-xl shrink-0",
          isBuy 
            ? "bg-gradient-to-br from-profit/20 to-profit/5" 
            : "bg-gradient-to-br from-loss/20 to-loss/5"
        )}>
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-50",
            isBuy ? "bg-profit/10" : "bg-loss/10"
          )} />
          {isBuy ? (
            <ArrowUp className="relative w-6 h-6 text-profit" />
          ) : (
            <ArrowDown className="relative w-6 h-6 text-loss" />
          )}
        </div>

        {/* Trade Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground tracking-tight">
                {trade.symbol}
              </h3>
              <span className={cn(
                "text-sm font-semibold",
                isBuy ? "text-profit" : "text-loss"
              )}>
                {t(`trades.${trade.direction}`)}
              </span>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium",
                statusStyle.bg,
                statusStyle.text,
                statusStyle.border
              )}
            >
              {t(`trades.${trade.status}`)}
            </Badge>
          </div>

          {/* Price Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-muted/40 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                {t('trades.entry')}
              </p>
              <p className="trading-number text-sm font-semibold text-foreground">
                {trade.entry_price.toLocaleString('en-US')}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-loss/10 text-center border border-loss/20">
              <p className="text-[10px] text-loss uppercase tracking-wider mb-0.5">
                SL
              </p>
              <p className="trading-number text-sm font-semibold text-loss">
                {trade.sl_price.toLocaleString('en-US')}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-profit/10 text-center border border-profit/20">
              <p className="text-[10px] text-profit uppercase tracking-wider mb-0.5">
                TP
              </p>
              <p className="trading-number text-sm font-semibold text-profit">
                {trade.tp_prices[0]?.toLocaleString('en-US')}
                {trade.tp_prices.length > 1 && (
                  <span className="text-[10px] opacity-70"> +{trade.tp_prices.length - 1}</span>
                )}
              </p>
            </div>
          </div>

          {/* Reason Preview */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
            {trade.reason}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="trading-number">{trade.followers_count || 0}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(trade.created_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              <Badge variant="secondary" className="text-[10px] h-5">
                {trade.timeframe}
              </Badge>
            </div>

            {/* View Details Arrow */}
            <div className={cn(
              "flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            )}>
              <span className="hidden sm:inline">التفاصيل</span>
              {isRtl ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Running Indicator Animation */}
      {trade.status === 'running' && (
        <div className="absolute top-2 start-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        </div>
      )}
    </motion.div>
  );
};
