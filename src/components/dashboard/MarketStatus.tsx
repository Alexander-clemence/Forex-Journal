'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarketDataItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Top global assets to track
const TRACKED_ASSETS = [
  { symbol: 'SPY', name: 'S&P 500', type: 'stock' },
  { symbol: 'QQQ', name: 'NASDAQ', type: 'stock' },
  { symbol: 'DIA', name: 'Dow Jones', type: 'stock' },
  { symbol: 'GLD', name: 'Gold', type: 'commodity' },
  { symbol: 'USO', name: 'Oil', type: 'commodity' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' }
];

export function MarketStatus() {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/market-data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setMarketData(result.data);
      setLastUpdate(new Date(result.timestamp));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getMarketStatus = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    
    // US Market hours: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC)
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 14 && hour < 21;
    
    if (isWeekday && isMarketHours) {
      return { status: 'Open', color: 'bg-green-500' };
    } else if (isWeekday && (hour >= 21 || hour < 14)) {
      return { status: 'After Hours', color: 'bg-yellow-500' };
    } else {
      return { status: 'Closed', color: 'bg-red-500' };
    }
  };

  const marketStatus = getMarketStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Market Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMarketData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            US Markets
          </span>
          <div className="flex items-center">
            <div className={`h-2 w-2 ${marketStatus.color} rounded-full mr-2`}></div>
            <span className={`text-sm font-medium ${
              marketStatus.status === 'Open' ? 'text-green-600' : 
              marketStatus.status === 'After Hours' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {marketStatus.status}
            </span>
          </div>
        </div>

        {loading && !marketData.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-red-500">
            {error}
          </div>
        ) : (
          <>
            <div className="space-y-3 text-sm">
              {marketData.map((item) => (
                <div key={item.symbol} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-semibold">
                      ${item.price.toLocaleString()}
                    </span>
                    <div className={`flex items-center ${
                      item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.changePercent >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      <span className="font-medium">
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lastUpdate && (
              <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}