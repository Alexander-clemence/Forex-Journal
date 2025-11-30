'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { 
  Receipt, 
  Loader2, 
  Download,
  Calendar,
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/subscription';
import { toast } from 'sonner';

interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  amount: number;
  currency: string;
  provider: string | null;
  external_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  raw_response: any;
  subscription_plans?: {
    name: string;
    code: string;
  } | null;
}

export default function BillingHistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const loadTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          subscription_plans (
            name,
            code
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  const getProviderIcon = (provider: string | null) => {
    if (!provider) return <CreditCard className="h-4 w-4" />;
    
    switch (provider.toLowerCase()) {
      case 'visa':
      case 'mastercard':
        return <CreditCard className="h-4 w-4" />;
      case 'mpesa':
      case 'tigopesa':
      case 'airtelmoney':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getProviderLabel = (provider: string | null) => {
    if (!provider) return 'N/A';
    
    switch (provider.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'mpesa':
        return 'M-Pesa';
      case 'tigopesa':
        return 'TigoPesa';
      case 'airtelmoney':
        return 'Airtel Money';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const handleDownloadReceipt = (transaction: PaymentTransaction) => {
    // Create a simple receipt text
    const receipt = `
FX Journal - Payment Receipt
============================

Transaction ID: ${transaction.id}
Date: ${formatDate(transaction.created_at)}
Status: ${transaction.status.toUpperCase()}

Plan: ${transaction.subscription_plans?.name || 'N/A'}
Amount: ${formatCurrency(transaction.amount, transaction.currency)}
Payment Method: ${getProviderLabel(transaction.provider)}

${transaction.external_id ? `External ID: ${transaction.external_id}\n` : ''}
${transaction.error_message ? `Error: ${transaction.error_message}\n` : ''}

Thank you for your payment!
    `.trim();

    // Create a blob and download
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Receipt downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        id="billing-heading"
        title="Billing History"
        description="View your payment transactions and receipts"
      />

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You haven't made any payments yet. Your transaction history will appear here once you complete a payment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Transactions
            </CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Payment Method</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Transaction ID</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {formatDate(transaction.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-foreground">
                          {transaction.subscription_plans?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(transaction.provider)}
                          <span className="text-sm text-muted-foreground">
                            {getProviderLabel(transaction.provider)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-mono text-muted-foreground">
                          {transaction.external_id || transaction.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(transaction)}
                            className="h-8"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + (t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'success' ? t.amount : 0), 0),
                  transactions[0]?.currency || 'TZS'
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Successful Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {transactions.filter(t => t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'success').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

