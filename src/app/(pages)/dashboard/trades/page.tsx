'use client';

import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTrades } from '@/lib/hooks/useTrades';
import { Plus, Search, Filter, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { TradeFilters as TradeFilterType } from '@/lib/types/trades';
import { Trade } from '@/lib/types/trades';

// Lazy load heavy components
const TradeFilters = lazy(() => import('@/app/components/trades/TradeFilters').then(mod => ({ default: mod.TradeFilters })));
const TradeCard = lazy(() => import('@/app/components/trades/TradeCard').then(mod => ({ default: mod.TradeCard })));

// Memoized loading skeleton
const TradeCardSkeleton = memo(() => (
  <Card>
    <CardContent className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TradeFilterType>({});
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'symbol'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displayedTrades, setDisplayedTrades] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
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
    setSortBy(field as 'date' | 'pnl' | 'symbol');
    setSortOrder(order as 'asc' | 'desc');
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          setDisplayedTrades(prev => Math.min(prev + ITEMS_PER_PAGE, filteredTrades.length));
          setIsLoadingMore(false);
        }, 100);
      });
    }
  }, [hasMore, isLoadingMore, filteredTrades.length]);

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
    setDisplayedTrades(ITEMS_PER_PAGE);
  }, [debouncedSearch, filters, sortBy, sortOrder]);

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
          <Link href="./dashboard/trades/new">
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
                onClick={toggleFilters}
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
              <Suspense fallback={<div className="h-20 animate-pulse bg-gray-100 dark:bg-gray-800 rounded"></div>}>
                <TradeFilters filters={filters} onFiltersChange={setFilters} />
              </Suspense>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trades List */}
      <div className="space-y-4">
        {filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {trades.length === 0 
                  ? "No trades found. Start by adding your first trade!"
                  : "No trades match your search criteria."
                }
              </p>
              <Link href="./dashboard/trades/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Trade
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {visibleTrades.map((trade) => (
              <Suspense key={trade.id} fallback={<TradeCardSkeleton />}>
                <TradeCard 
                  trade={trade} 
                  onTradeDeleted={handleTradeDeleted}
                />
              </Suspense>
            ))}
            
            {/* Intersection observer trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4">
                {isLoadingMore && (
                  <div className="space-y-4">
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
    </div>
  );
}