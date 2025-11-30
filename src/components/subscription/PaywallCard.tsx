'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';

interface PaywallCardProps {
  title?: string;
  description?: string;
  feature?: string;
}

export function PaywallCard({ 
  title = 'Premium Feature',
  description = 'This feature is available for premium subscribers.',
  feature
}: PaywallCardProps) {
  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {feature && `Unlock ${feature} and more premium features with a subscription.`}
          {!feature && 'Upgrade to premium to access this feature and more.'}
        </p>
      </CardContent>
      <CardFooter>
        <Link href="/pricing">
          <Button className="w-full" variant="default">
            <Crown className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}



