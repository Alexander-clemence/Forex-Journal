'use client';

import { memo, useMemo } from 'react';
import { Trade } from '@/lib/types/trades';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TradeTimelineProps {
  trades: Trade[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const TradeTimeline = memo(function TradeTimeline({ trades }: TradeTimelineProps) {
  const timelineItems = useMemo(() => {
    return trades
      .filter((trade) => trade.entry_date)
      .sort(
        (a, b) =>
          new Date(b.entry_date || b.created_at || '').getTime() -
          new Date(a.entry_date || a.created_at || '').getTime()
      )
      .map((trade) => {
        const dateLabel = trade.entry_date
          ? new Date(trade.entry_date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown date';
        const pnl = trade.profit_loss ?? 0;
        return {
          id: trade.id,
          dateLabel,
          symbol: trade.symbol,
          status: trade.status,
          side: trade.side,
          pnl,
          mood: trade.mood,
          sentiment: trade.market_sentiment,
          notes: trade.notes,
        };
      });
  }, [trades]);

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No trades in this period yet.
        </CardContent>
      </Card>
    );
    }

  return (
    <div className="space-y-4">
      {timelineItems.map((item) => (
        <div key={item.id} className="flex gap-4">
          <div className="w-16 text-sm font-medium text-muted-foreground shrink-0 pt-1.5">
            {item.dateLabel}
          </div>
          <div className="flex-1 border-l border-border pl-4">
            <Card>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{item.symbol}</span>
                    <Badge variant="secondary">{item.status}</Badge>
                    <Badge variant="outline">{item.side}</Badge>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      item.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.pnl >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(item.pnl))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.mood && <Badge variant="outline">Mood: {item.mood}</Badge>}
                  {item.sentiment && <Badge variant="outline">Sentiment: {item.sentiment}</Badge>}
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
});

