'use client';

import { useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradeFilters as TradeFilterType } from '@/lib/types/trades';
import { X, Brain, BarChart3 } from 'lucide-react';

interface TradeFiltersProps {
  filters: TradeFilterType;
  onFiltersChange: (filters: TradeFilterType) => void;
}

const MOOD_OPTIONS = [
  'confident', 'analytical', 'cautious', 'frustrated', 'disappointed',
  'excited', 'focused', 'nervous', 'optimistic', 'neutral', 'anxious'
] as const;

const MARKET_SENTIMENT_OPTIONS = [
  'bullish', 'bearish', 'sideways', 'volatile', 'uncertain', 'neutral'
] as const;

const PERFORMANCE_RATINGS = [
  { value: '1', label: '1 - Poor' },
  { value: '2', label: '2 - Below Average' },
  { value: '3', label: '3 - Average' },
  { value: '4', label: '4 - Good' },
  { value: '5', label: '5 - Excellent' }
] as const;

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface FilterFieldProps {
  label: string;
  id: string;
  value: string;
  hasValue: boolean;
  onClear: () => void;
  children: React.ReactNode;
}

const FilterField = memo(({ label, id, value, hasValue, onClear, children }: FilterFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      {children}
      {hasValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
));

FilterField.displayName = 'FilterField';

export const TradeFilters = memo(function TradeFilters({ filters, onFiltersChange }: TradeFiltersProps) {
  const updateFilter = useCallback((key: keyof TradeFilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const clearFilter = useCallback((key: keyof TradeFilterType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const activeFilterEntries = useMemo(() => Object.entries(filters), [filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Filters
        </h4>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Basic Trade Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterField
          label="Status"
          id="status-filter"
          value={filters.status || ''}
          hasValue={!!filters.status}
          onClear={() => clearFilter('status')}
        >
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField
          label="Side"
          id="side-filter"
          value={filters.side || ''}
          hasValue={!!filters.side}
          onClear={() => clearFilter('side')}
        >
          <Select
            value={filters.side ?? 'all'}
            onValueChange={(value) => updateFilter('side', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <div className="space-y-2">
          <Label htmlFor="strategy-filter">Strategy</Label>
          <div className="relative">
            <Input
              id="strategy-filter"
              placeholder="Strategy name..."
              value={filters.strategy || ''}
              onChange={(e) => updateFilter('strategy', e.target.value || undefined)}
            />
            {filters.strategy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('strategy')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol-filter">Symbol</Label>
          <div className="relative">
            <Input
              id="symbol-filter"
              placeholder="Instrument symbol..."
              value={filters.symbol || ''}
              onChange={(e) => updateFilter('symbol', e.target.value || undefined)}
            />
            {filters.symbol && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('symbol')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Journal-based Filters */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800 dark:text-purple-400">Psychology Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterField
            label="Mood"
            id="mood-filter"
            value={filters.mood || ''}
            hasValue={!!filters.mood}
            onClear={() => clearFilter('mood')}
          >
            <Select
              value={filters.mood ?? 'all'}
              onValueChange={(value) => updateFilter('mood', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Moods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moods</SelectItem>
                {MOOD_OPTIONS.map(mood => (
                  <SelectItem key={mood} value={mood}>
                    {capitalize(mood)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField
            label="Market Sentiment"
            id="market-sentiment-filter"
            value={filters.market_sentiment || ''}
            hasValue={!!filters.market_sentiment}
            onClear={() => clearFilter('market_sentiment')}
          >
            <Select
              value={filters.market_sentiment ?? 'all'}
              onValueChange={(value) => updateFilter('market_sentiment', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                {MARKET_SENTIMENT_OPTIONS.map(sentiment => (
                  <SelectItem key={sentiment} value={sentiment}>
                    {capitalize(sentiment)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField
            label="Performance Rating"
            id="performance-rating-filter"
            value={filters.performance_rating?.toString() || ''}
            hasValue={!!filters.performance_rating}
            onClear={() => clearFilter('performance_rating')}
          >
            <Select
              value={filters.performance_rating?.toString() ?? 'all'}
              onValueChange={(value) =>
                updateFilter('performance_rating', value === 'all' ? undefined : parseInt(value, 10))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {PERFORMANCE_RATINGS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">From Date</Label>
          <div className="relative">
            <Input
              id="date-from"
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
            />
            {filters.date_from && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('date_from')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">To Date</Label>
          <div className="relative">
            <Input
              id="date-to"
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
            />
            {filters.date_to && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('date_to')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* P&L Range Filters */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800 dark:text-green-400">P&L Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-pnl">Min P&L ($)</Label>
            <div className="relative">
              <Input
                id="min-pnl"
                type="number"
                step="0.01"
                placeholder="Minimum profit/loss..."
                value={filters.min_pnl ?? ''}
                onChange={(e) => updateFilter('min_pnl', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
              {filters.min_pnl !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('min_pnl')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-pnl">Max P&L ($)</Label>
            <div className="relative">
              <Input
                id="max-pnl"
                type="number"
                step="0.01"
                placeholder="Maximum profit/loss..."
                value={filters.max_pnl ?? ''}
                onChange={(e) => updateFilter('max_pnl', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
              {filters.max_pnl !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter('max_pnl')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {activeFilterEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
              >
                <span className="capitalize">
                  {key.replace(/_/g, ' ')}: {value}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter(key as keyof TradeFilterType)}
                  className="h-4 w-4 p-0 hover:bg-blue-200"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});