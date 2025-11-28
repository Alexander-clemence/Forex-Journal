'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Trade } from '@/lib/types/trades';
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  email: string;
  display_name?: string;
  username?: string;
  role: string;
  timezone?: string;
  default_currency?: string;
  created_at: string;
  updated_at: string;
}

interface ExportData {
  trades: Trade[];
  profile: Profile | null;
  summary: {
    totalTrades: number;
    totalPnL: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    dateRange: string;
    openTrades: number;
    closedTrades: number;
  };
}

// Static configuration arrays
const exportTypes = [
  { value: 'all', label: 'Complete Report', description: 'All trades and performance summary' },
  { value: 'trades', label: 'Trades Only', description: 'Trading activity without summary' },
  { value: 'summary', label: 'Summary Report', description: 'Performance metrics only' }
];

const dateRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' }
];

// Memoized utility function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Memoized Message Components
const ErrorMessage = memo(({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
    <div className="flex">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <div className="ml-3"><p className="text-red-800">{message}</p></div>
      <button onClick={onClose} className="ml-auto">
        <X className="h-4 w-4 text-red-400" />
      </button>
    </div>
  </div>
));
ErrorMessage.displayName = 'ErrorMessage';

const SuccessMessage = memo(({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
    <div className="flex">
      <Check className="h-5 w-5 text-green-400" />
      <div className="ml-3"><p className="text-green-800">{message}</p></div>
      <button onClick={onClose} className="ml-auto">
        <X className="h-4 w-4 text-green-400" />
      </button>
    </div>
  </div>
));
SuccessMessage.displayName = 'SuccessMessage';

// Memoized Loading Spinner
const LoadingSpinner = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Summary Card
const SummaryCard = memo(({ 
  value, 
  label, 
  color 
}: { 
  value: string | number; 
  label: string; 
  color: string;
}) => (
  <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${color}`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm opacity-90">{label}</div>
  </div>
));
SummaryCard.displayName = 'SummaryCard';

// Memoized Trade Row
const TradeRow = memo(({ trade }: { trade: Trade }) => {
  const pnlColor = useMemo(() => {
    if (!trade.profit_loss) return 'text-gray-500';
    return trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600';
  }, [trade.profit_loss]);

  const statusColor = useMemo(() => {
    switch (trade.status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [trade.status]);

  return (
    <TableRow>
      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{trade.symbol}</TableCell>
      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{trade.side.toUpperCase()}</TableCell>
      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{trade.quantity}</TableCell>
      <TableCell className="px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatCurrency(trade.entry_price)}</TableCell>
      <TableCell className={cn("px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium", pnlColor)}>
        {trade.profit_loss ? formatCurrency(trade.profit_loss) : '-'}
      </TableCell>
      <TableCell className="px-2 sm:px-3 lg:px-4 py-2">
        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${statusColor} dark:opacity-90`}>
          {trade.status.toUpperCase()}
        </span>
      </TableCell>
    </TableRow>
  );
});
TradeRow.displayName = 'TradeRow';

export default function ExportDataComponent() {
  const authData = useAuth();
  const [exportType, setExportType] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<ExportData | null>(null);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { 
        setError(''); 
        setSuccess(''); 
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Memoized date filter calculation
  const getDateFilter = useCallback(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate).toISOString() : null,
          end: customEndDate ? new Date(customEndDate).toISOString() : null
        };
      default:
        return { start: null, end: null };
    }

    return {
      start: startDate.toISOString(),
      end: now.toISOString()
    };
  }, [dateRange, customStartDate, customEndDate]);

  // Memoized PDF content generator
  const generatePDFContent = useCallback((data: ExportData): string => {
    const { trades, profile, summary } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My Trading Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #4F46E5; margin: 0; }
        .header .date { color: #666; font-size: 14px; }
        .header .user-info { color: #666; font-size: 14px; margin-top: 10px; }
        .summary { background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #F9FAFB; padding: 12px; text-align: left; border-bottom: 2px solid #E5E7EB; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
        .profit { color: #059669; font-weight: 600; }
        .loss { color: #DC2626; font-weight: 600; }
        .status-open { color: #D97706; font-weight: 600; }
        .status-closed { color: #059669; font-weight: 600; }
        .status-cancelled { color: #6B7280; font-weight: 600; }
        .no-data { text-align: center; color: #6B7280; font-style: italic; padding: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>My Trading Report</h1>
        <div class="date">Generated on ${new Date().toLocaleString()}</div>
        <div class="date">Period: ${summary.dateRange}</div>
        ${profile ? `<div class="user-info">Trader: ${profile.display_name || 'N/A'} (${profile.email})</div>` : ''}
    </div>

    ${exportType === 'all' || exportType === 'summary' ? `
    <div class="summary">
        <h2>Performance Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value">${summary.totalTrades}</div>
                <div class="summary-label">Total Trades</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${summary.openTrades}</div>
                <div class="summary-label">Open Trades</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${summary.closedTrades}</div>
                <div class="summary-label">Closed Trades</div>
            </div>
            <div class="summary-item">
                <div class="summary-value ${summary.totalPnL >= 0 ? 'profit' : 'loss'}">
                    $${summary.totalPnL.toFixed(2)}
                </div>
                <div class="summary-label">Total P&L</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${summary.winRate.toFixed(1)}%</div>
                <div class="summary-label">Win Rate</div>
            </div>
            <div class="summary-item">
                <div class="summary-value profit">$${summary.avgWin.toFixed(2)}</div>
                <div class="summary-label">Avg Win</div>
            </div>
            <div class="summary-item">
                <div class="summary-value loss">$${summary.avgLoss.toFixed(2)}</div>
                <div class="summary-label">Avg Loss</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${summary.avgWin > 0 && summary.avgLoss > 0 ? (summary.avgWin / summary.avgLoss).toFixed(2) : '0.00'}</div>
                <div class="summary-label">Win/Loss Ratio</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${exportType === 'all' || exportType === 'trades' ? `
    <div class="section">
        <h2>Trading Activity (${trades.length} trades)</h2>
        ${trades.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>P&L</th>
                    <th>Status</th>
                    <th>Strategy</th>
                    <th>R:R Ratio</th>
                </tr>
            </thead>
            <tbody>
                ${trades.map(trade => `
                <tr>
                    <td>${new Date(trade.entry_date).toLocaleDateString()}</td>
                    <td>${trade.symbol}</td>
                    <td>${trade.side.toUpperCase()}</td>
                    <td>${trade.quantity}</td>
                    <td>$${trade.entry_price.toFixed(2)}</td>
                    <td>${trade.exit_price ? '$' + trade.exit_price.toFixed(2) : '-'}</td>
                    <td class="${trade.profit_loss ? (trade.profit_loss >= 0 ? 'profit' : 'loss') : ''}">
                        ${trade.profit_loss ? '$' + trade.profit_loss.toFixed(2) : '-'}
                    </td>
                    <td class="status-${trade.status}">${trade.status.toUpperCase()}</td>
                    <td>${trade.strategy || '-'}</td>
                    <td>${trade.risk_reward_ratio ? trade.risk_reward_ratio.toFixed(2) : '-'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<div class="no-data">No trades found for the selected period</div>'}
    </div>
    ` : ''}

    <div class="section">
        <p style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 40px;">
            This report contains your personal trading data. Keep it confidential.
        </p>
    </div>
</body>
</html>`;
  }, [exportType]);

  const fetchExportData = useCallback(async (): Promise<ExportData> => {
    if (!authData?.user?.id) {
      throw new Error('User not authenticated');
    }

    const dateFilter = getDateFilter();
    
    let tradesQuery = supabase
      .from('trades')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('entry_date', { ascending: false });

    if (dateFilter.start) {
      tradesQuery = tradesQuery.gte('entry_date', dateFilter.start);
    }
    if (dateFilter.end) {
      tradesQuery = tradesQuery.lte('entry_date', dateFilter.end);
    }

    const profileQuery = supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const [tradesResult, profileResult] = await Promise.all([tradesQuery, profileQuery]);

    if (tradesResult.error) throw tradesResult.error;

    const trades = (tradesResult.data || []) as Trade[];
    const profile = profileResult.data || null;

    const openTrades = trades.filter(t => t.status === 'open').length;
    const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null && t.profit_loss !== undefined);
    const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades.length 
      : 0;
    
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)) / losingTrades.length 
      : 0;

    const summary = {
      totalTrades: trades.length,
      openTrades,
      closedTrades: closedTrades.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      dateRange: dateRange === 'custom' 
        ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}`
        : dateRanges.find(r => r.value === dateRange)?.label || 'All time'
    };

    return { trades, profile, summary };
  }, [authData?.user?.id, getDateFilter, dateRange, customStartDate, customEndDate]);

  const generatePDF = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchExportData();
      
      const pdfContent = generatePDFContent(data);
      
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-trading-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Report generated successfully! Check your downloads.');
    } catch (err) {
      setError('Failed to generate report: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchExportData, generatePDFContent]);

  const generatePreview = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchExportData();
      setPreviewData(data);
    } catch (err) {
      setError('Failed to generate preview: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchExportData]);

  const clearError = useCallback(() => setError(''), []);
  const clearSuccess = useCallback(() => setSuccess(''), []);

  // Memoized summary cards data
  const summaryCards = useMemo(() => {
    if (!previewData) return null;
    
    return [
      { value: previewData.summary.totalTrades, label: 'Total Trades', color: 'bg-blue-50 text-blue-600' },
      { value: previewData.summary.openTrades, label: 'Open Trades', color: 'bg-purple-50 text-purple-600' },
      { 
        value: formatCurrency(previewData.summary.totalPnL), 
        label: 'Total P&L', 
        color: previewData.summary.totalPnL >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      },
      { value: `${previewData.summary.winRate.toFixed(1)}%`, label: 'Win Rate', color: 'bg-yellow-50 text-yellow-600' }
    ];
  }, [previewData]);

  if (!authData || !authData.user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
        {/* Messages */}
        {error && <ErrorMessage message={error} onClose={clearError} />}
        {success && <SuccessMessage message={success} onClose={clearSuccess} />}

        {/* Export Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6" id="export-options">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Export Configuration</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div id="export-date-range">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Report Type
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {exportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={generatePreview}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span>Preview Data</span>
            </button>
            
            <button
              onClick={generatePDF}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span>Generate PDF</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        {previewData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Data Preview</h2>
            
            {previewData.profile && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100 mb-2">Trader Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Name: </span>
                    <span className="text-blue-800 dark:text-blue-200">{previewData.profile.display_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Email: </span>
                    <span className="text-blue-800">{previewData.profile.email}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Timezone: </span>
                    <span className="text-blue-800">{previewData.profile.timezone || 'UTC'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Currency: </span>
                    <span className="text-blue-800">{previewData.profile.default_currency || 'USD'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {summaryCards && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {summaryCards.map((card, index) => (
                  <SummaryCard key={index} {...card} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(previewData.summary.avgWin)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Win</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(previewData.summary.avgLoss)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Loss</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {previewData.summary.avgWin > 0 && previewData.summary.avgLoss > 0 
                    ? (previewData.summary.avgWin / previewData.summary.avgLoss).toFixed(2)
                    : '0.00'
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Win/Loss Ratio</div>
              </div>
            </div>

            {(exportType === 'all' || exportType === 'trades') && previewData.trades.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Recent Trades (showing first 10)</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                      <TableRow>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Symbol</TableHead>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Side</TableHead>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Quantity</TableHead>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400 hidden sm:table-cell">Entry</TableHead>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">P&L</TableHead>
                        <TableHead className="px-2 sm:px-3 lg:px-4 py-2 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.trades.slice(0, 10).map((trade) => (
                        <TradeRow key={trade.id} trade={trade} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.trades.length > 10 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ... and {previewData.trades.length - 10} more trades
                  </p>
                )}
              </div>
            )}

            {previewData.trades.length === 0 && (exportType === 'all' || exportType === 'trades') && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trades found for the selected period</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}