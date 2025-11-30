'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function WelcomeTrialDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const welcome = searchParams.get('welcome');
    if (welcome === 'trial') {
      setOpen(true);
      // Remove the query parameter from URL
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to FX Journal!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your account has been confirmed successfully.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">30-Day Free Trial</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You now have access to all premium features for 30 days! Explore advanced analytics, 
              export capabilities, and more. Upgrade anytime to continue after your trial ends.
            </p>
          </div>
          <div className="space-y-2">
            <Link href="/dashboard/settings?tab=subscription" className="block">
              <Button className="w-full" onClick={() => setOpen(false)}>
                <Crown className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

