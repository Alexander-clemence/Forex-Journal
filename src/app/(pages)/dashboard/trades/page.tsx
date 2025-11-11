'use client';

import { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTrades } from '@/lib/hooks/useTrades';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { TradeFilters as TradeFilterType } from '@/lib/types/trades';
import { Trade } from '@/lib/types/trades';
import { TradeFilters } from '@/components/trades/TradeFilters';
import { TradeCard } from '@/components/trades/TradeCard';
import { useTradeListStore } from '@/lib/stores/tradeListStore';
import { useShallow } from 'zustand/react/shallow';

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

export default function TradesPage() {
  const router = useRouter();
  const { trades, loading, stats } = useTrades();
  
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
    const matchesSearch = !debouncedSearch || 
      trade.symbol.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      trade.strategy?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesFilters = 
      (!filters.status || trade.status === filters.status) &&
      (!filters.side || trade.side === filters.side) &&
      (!filters.strategy || trade.strategy === filters.strategy);

    return matchesSearch && matchesFilters;
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

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-');
    setSort(field as 'date' | 'pnl' | 'symbol', order as 'asc' | 'desc');
  }, [setSort]);

  const handleToggleFilters = useCallback(() => {
    toggleFilters();
  }, [toggleFilters]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Trades
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and analyze your trading history
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
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
              Add Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Trades" value={statsDisplay.total} />
        <StatCard label="Open Trades" value={statsDisplay.open} className="text-blue-600" />
        <StatCard label="Closed Trades" value={statsDisplay.closed} />
        <StatCard label="Total P&L" value={statsDisplay.pnl} className={statsDisplay.pnlClass} />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search trades by symbol, strategy, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="pnl-desc">Highest P&L</option>
                <option value="pnl-asc">Lowest P&L</option>
                <option value="symbol-asc">Symbol A-Z</option>
                <option value="symbol-desc">Symbol Z-A</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <TradeFilters filters={filters} onFiltersChange={updateFilters} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trades Grid */}
      {filteredTrades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {trades.length === 0 
                ? "No trades found. Start by adding your first trade!"
                : "No trades match your search criteria."
              }
            </p>
            <Link href="/dashboard/trades/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Trade
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTrades.map((trade) => (
              <TradeCard 
                key={trade.id}
                trade={trade} 
                onTradeDeleted={handleTradeDeleted}
              />
            ))}
          </div>
          
          {/* Intersection observer trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <TradeCardSkeleton />
                  <TradeCardSkeleton />
                  <TradeCardSkeleton />
                </div>
              )}
            </div>
          )}
          
          {/* Show count */}
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            Showing {visibleTrades.length} of {filteredTrades.length} trades
          </div>
        </>
      )}
    </div>
  );
}