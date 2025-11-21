'use client';

import { useEffect, useRef, useMemo, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrades } from '@/lib/hooks/useTrades';
import { Plus, Search, Filter, Download, Upload, BookmarkPlus, Bookmark, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { TradeFilters as TradeFilterType } from '@/lib/types/trades';
import { Trade } from '@/lib/types/trades';
import { TradeFilters } from '@/components/trades/TradeFilters';
import { TradeCard } from '@/components/trades/TradeCard';
import { useTradeListStore } from '@/lib/stores/tradeListStore';
import { useShallow } from 'zustand/react/shallow';
import { useTradeFilterPresetsStore } from '@/lib/stores/tradeFilterPresetsStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { toast } from 'sonner';

// Memoized loading skeleton
const TradeCardSkeleton = memo(() => (
  <Card>
    <CardContent className="p-5">
      <div className="animate-pulse space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </CardContent>
  </Card>
));
TradeCardSkeleton.displayName = 'TradeCardSkeleton';

// Memoized stat card component
const StatCard = memo(({ label, value, className = '' }: { label: string; value: string | number; className?: string }) => (
  <Card>
    <CardContent className="p-4">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${className}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

// Constants
const ITEMS_PER_PAGE = 15;
const LOAD_MORE_THRESHOLD = 0.5;
const DEBOUNCE_DELAY = 300;
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'pnl-desc', label: 'Highest P&L' },
  { value: 'pnl-asc', label: 'Lowest P&L' },
  { value: 'symbol-asc', label: 'Symbol A-Z' },
  { value: 'symbol-desc', label: 'Symbol Z-A' }
] as const;

export default function TradesPage() {
  const router = useRouter();
  const { trades, loading, stats } = useTrades();
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    searchTerm,
    debouncedSearch,
    showFilters,
    filters,
    sortBy,
    sortOrder,
    displayedTrades,
    isLoadingMore,
    setSearchTerm,
    setDebouncedSearch,
    toggleFilters,
    setFilters: updateFilters,
    setSort,
    increaseDisplayedTrades,
    setIsLoadingMore,
    resetDisplayedTrades,
  } = useTradeListStore(useShallow((state) => ({
    searchTerm: state.searchTerm,
    debouncedSearch: state.debouncedSearch,
    showFilters: state.showFilters,
    filters: state.filters,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    displayedTrades: state.displayedTrades,
    isLoadingMore: state.isLoadingMore,
    setSearchTerm: state.setSearchTerm,
    setDebouncedSearch: state.setDebouncedSearch,
    toggleFilters: state.toggleFilters,
    setFilters: state.setFilters,
    setSort: state.setSort,
    increaseDisplayedTrades: state.increaseDisplayedTrades,
    setIsLoadingMore: state.setIsLoadingMore,
    resetDisplayedTrades: state.resetDisplayedTrades,
  })));

  const { presets, savePreset, deletePreset } = useTradeFilterPresetsStore(
    useShallow((state) => ({
      presets: state.presets,
      savePreset: state.savePreset,
      deletePreset: state.deletePreset
    }))
  );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  //@ts-ignore
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Memoized filter function
  const filterTrade = useCallback((trade: Trade) => {
    const search = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      trade.symbol.toLowerCase().includes(search) ||
      (trade.strategy?.toLowerCase().includes(search)) ||
      (trade.notes?.toLowerCase().includes(search));

    const matchesStatus = !filters.status || trade.status === filters.status;
    const matchesSide = !filters.side || trade.side === filters.side;

    const matchesStrategy =
      !filters.strategy ||
      trade.strategy?.toLowerCase().includes(filters.strategy.toLowerCase());

    const matchesSymbol =
      !filters.symbol ||
      trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase());

    const matchesMood =
      !filters.mood || trade.mood === filters.mood;

    const matchesSentiment =
      !filters.market_sentiment || trade.market_sentiment === filters.market_sentiment;

    const matchesPerformance =
      filters.performance_rating === undefined ||
      trade.performance_rating === filters.performance_rating;

    let matchesDate = true;
    if (filters.date_from || filters.date_to) {
      const entryDate = trade.entry_date ? new Date(trade.entry_date) : undefined;
      if (!entryDate) {
        matchesDate = false;
      } else {
        if (filters.date_from) {
          matchesDate = matchesDate && entryDate >= new Date(filters.date_from);
        }
        if (filters.date_to) {
          matchesDate = matchesDate && entryDate <= new Date(filters.date_to);
        }
      }
    }

    const pnl = trade.profit_loss ?? 0;
    const matchesMinPnl =
      filters.min_pnl === undefined || pnl >= filters.min_pnl;
    const matchesMaxPnl =
      filters.max_pnl === undefined || pnl <= filters.max_pnl;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSide &&
      matchesStrategy &&
      matchesSymbol &&
      matchesMood &&
      matchesSentiment &&
      matchesPerformance &&
      matchesDate &&
      matchesMinPnl &&
      matchesMaxPnl
    );
  }, [debouncedSearch, filters]);

  // Memoized sort function
  const sortTrades = useCallback((a: Trade, b: Trade) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.entry_date).getTime();
        bValue = new Date(b.entry_date).getTime();
        break;
      case 'pnl':
        aValue = a.profit_loss || 0;
        bValue = b.profit_loss || 0;
        break;
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      default:
        return 0;
    }

    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return aValue > bValue ? multiplier : aValue < bValue ? -multiplier : 0;
  }, [sortBy, sortOrder]);

  // Memoized filtered and sorted trades
  const filteredTrades = useMemo(() => {
    return trades.filter(filterTrade).sort(sortTrades);
  }, [trades, filterTrade, sortTrades]);

  // Get currently visible trades
  const visibleTrades = useMemo(() => 
    filteredTrades.slice(0, displayedTrades),
    [filteredTrades, displayedTrades]
  );

  const hasMore = displayedTrades < filteredTrades.length;

  // Memoized handlers
  const handleTradeDeleted = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split('-');
    setSort(field as 'date' | 'pnl' | 'symbol', order as 'asc' | 'desc');
  }, [setSort]);

  const handleToggleFilters = useCallback(() => {
    toggleFilters();
  }, [toggleFilters]);

  useEffect(() => {
    const focusSearch = () => {
      searchInputRef.current?.focus();
    };
    const toggleFiltersEvent = () => {
      handleToggleFilters();
    };
    globalThis.window?.addEventListener('focus-trade-search', focusSearch);
    globalThis.window?.addEventListener('toggle-trade-filters', toggleFiltersEvent);
    return () => {
      globalThis.window?.removeEventListener('focus-trade-search', focusSearch);
      globalThis.window?.removeEventListener('toggle-trade-filters', toggleFiltersEvent);
    };
  }, [handleToggleFilters]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          increaseDisplayedTrades(filteredTrades.length);
          setIsLoadingMore(false);
        }, 100);
      });
    }
  }, [hasMore, isLoadingMore, filteredTrades.length, increaseDisplayedTrades, setIsLoadingMore]);

  const openSavePresetDialog = useCallback(() => {
    setPresetName('');
    setIsSavePresetOpen(true);
  }, []);

  const handleConfirmSavePreset = useCallback(() => {
    const trimmed = presetName.trim();
    if (!trimmed) {
      toast.error('Preset name required', {
        description: 'Please enter a name to save this preset.'
      });
      return;
    }
    const filtersSnapshot = JSON.parse(JSON.stringify(filters || {})) as TradeFilterType;
    savePreset({
      name: trimmed,
      searchTerm,
      filters: filtersSnapshot,
      sortBy,
      sortOrder
    });
    toast.success('Preset saved', { description: trimmed });
    setIsSavePresetOpen(false);
    setPresetName('');
  }, [filters, savePreset, searchTerm, sortBy, sortOrder, presetName]);

  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setSearchTerm(preset.searchTerm);
    setDebouncedSearch(preset.searchTerm);
    updateFilters(preset.filters || {});
    setSort(preset.sortBy, preset.sortOrder);
    toast.success('Preset applied', { description: preset.name });
  }, [presets, setSearchTerm, setDebouncedSearch, updateFilters, setSort]);

  const handleDeletePreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    deletePreset(presetId);
    toast.success('Preset deleted', { description: preset?.name });
  }, [presets, deletePreset]);


  const activeFilterChips = useMemo(() => {
    const chips: { key: keyof TradeFilterType; label: string; value: string }[] = [];
    if (filters.status) chips.push({ key: 'status', label: 'Status', value: filters.status });
    if (filters.side) chips.push({ key: 'side', label: 'Side', value: filters.side });
    if (filters.strategy) chips.push({ key: 'strategy', label: 'Strategy', value: filters.strategy });
    if (filters.symbol) chips.push({ key: 'symbol', label: 'Symbol', value: filters.symbol });
    if (filters.mood) chips.push({ key: 'mood', label: 'Mood', value: filters.mood });
    if (filters.market_sentiment) {
      chips.push({ key: 'market_sentiment', label: 'Sentiment', value: filters.market_sentiment });
    }
    if (filters.performance_rating !== undefined) {
      chips.push({
        key: 'performance_rating',
        label: 'Rating',
        value: filters.performance_rating.toString()
      });
    }
    if (filters.date_from) chips.push({ key: 'date_from', label: 'From', value: filters.date_from });
    if (filters.date_to) chips.push({ key: 'date_to', label: 'To', value: filters.date_to });
    if (filters.min_pnl !== undefined) {
      chips.push({ key: 'min_pnl', label: 'Min P&L', value: filters.min_pnl.toString() });
    }
    if (filters.max_pnl !== undefined) {
      chips.push({ key: 'max_pnl', label: 'Max P&L', value: filters.max_pnl.toString() });
    }
    return chips;
  }, [filters]);

  const handleClearChip = useCallback((key: keyof TradeFilterType) => {
    const updated = { ...filters };
    delete updated[key];
    updateFilters(updated);
  }, [filters, updateFilters]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: LOAD_MORE_THRESHOLD, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore]);

  // Reset displayed trades when filters change
  useEffect(() => {
    resetDisplayedTrades();
  }, [debouncedSearch, filters, sortBy, sortOrder, resetDisplayedTrades]);

  // Memoized stats
  const statsDisplay = useMemo(() => ({
    total: stats.totalTrades.toString(),
    open: stats.openTrades.toString(),
    closed: stats.closedTrades.toString(),
    pnl: `$${stats.totalPnL.toFixed(2)}`,
    pnlClass: stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
  }), [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="trades-heading" className="space-y-4">
        <SectionHeading
          id="trades-heading"
          title="All trades"
          description="Track executions, filter by context, and spot opportunities across your journal."
          tourId="trades-heading"
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/dashboard/trades/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add trade
              </Button>
            </Link>
          </div>
        </SectionHeading>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total trades" value={statsDisplay.total} />
          <StatCard label="Open trades" value={statsDisplay.open} className="text-blue-600" />
          <StatCard label="Closed trades" value={statsDisplay.closed} />
          <StatCard label="Total P&L" value={statsDisplay.pnl} className={statsDisplay.pnlClass} />
        </div>
      </section>

      <section aria-labelledby="filters-heading" className="space-y-4">
        <SectionHeading
          id="filters-heading"
          title="Search & filters"
          description="Layer filters, moods, and presets to zero in on specific playbooks or sessions."
          tourId="filters-heading"
        />
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex-1">
                <Label htmlFor="trade-search" className="sr-only">
                  Search trades
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="trade-search"
                    placeholder="Search trades by symbol, strategy, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleToggleFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide filters' : 'Show filters'}
                </Button>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="Sort trades" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showFilters && (
              <div className="border-t pt-4">
                <TradeFilters filters={filters} onFiltersChange={updateFilters} />
              </div>
            )}

            {activeFilterChips.length > 0 && (
              <div className="space-y-2" aria-live="polite">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active filters</p>
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={`${chip.key}-${chip.value}`}
                      onClick={() => handleClearChip(chip.key)}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-blue-500"
                    >
                      <span className="font-medium">{chip.label}:</span>
                      <span>{chip.value}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateFilters({})}>
                    Clear all
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Save frequently used combinations to keep your workflow fast.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={openSavePresetDialog}>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save preset
                </Button>
                {presets.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Presets
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <DropdownMenuLabel>Apply preset</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {presets.map((preset) => (
                        <DropdownMenuItem
                          key={preset.id}
                          onSelect={(event) => {
                            event.preventDefault();
                            handleApplyPreset(preset.id);
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{preset.name}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDeletePreset(preset.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">No presets yet</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current filters</DialogTitle>
            <DialogDescription>
              Give this combination of filters a name so you can quickly apply it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 py-4">
            <Label htmlFor="preset-name">Preset name</Label>
            <Input
              id="preset-name"
              placeholder="e.g. Open EURUSD longs"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavePresetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSavePreset}>
              Save preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-labelledby="results-heading" className="space-y-4">
        <SectionHeading
          id="results-heading"
          title="Trades list"
          description="Review cards chronologically, load more as you scroll, and manage each trade inline."
          tourId="results-heading"
        />
        {filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {trades.length === 0
                  ? 'No trades found. Start by adding your first trade!'
                  : 'No trades match your search criteria.'}
              </p>
              <Link href="/dashboard/trades/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first trade
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} onTradeDeleted={handleTradeDeleted} />
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {isLoadingMore && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <TradeCardSkeleton />
                    <TradeCardSkeleton />
                    <TradeCardSkeleton />
                  </div>
                )}
              </div>
            )}

            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              Showing {visibleTrades.length} of {filteredTrades.length} trades
            </div>
          </>
        )}
      </section>
    </div>
  );
}