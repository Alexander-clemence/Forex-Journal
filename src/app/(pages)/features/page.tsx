'use client';

import Link from 'next/link';
import { ForexJournalIcon } from '@/components/ui/ForexJournalIcon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BarChart3, Brain, Shield, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function FeaturesPage() {
  const { user } = useAuth();
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track your trading performance with comprehensive analytics, win rates, and profit/loss metrics.'
    },
    {
      icon: Brain,
      title: 'Psychology Tracking',
      description: 'Monitor your emotional state and trading psychology to identify patterns and improve decision-making.'
    },
    {
      icon: TrendingUp,
      title: 'Trade Management',
      description: 'Log and manage all your trades with detailed entry, exit, and performance tracking.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your trading data is encrypted and stored securely. Complete privacy and data protection.'
    },
    {
      icon: Zap,
      title: 'Fast & Efficient',
      description: 'Log trades in seconds with keyboard shortcuts and streamlined workflows.'
    },
    {
      icon: BarChart3,
      title: 'Performance Insights',
      description: 'View comprehensive statistics, P&L charts, and trade timelines to analyze your performance.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ForexJournalIcon size={48} className="h-12 w-12" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              FX Journal
            </span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link href="/features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <button className="px-6 py-2.5 font-medium transition-all duration-300 text-foreground hover:text-primary">
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-6 py-2.5 font-medium transition-all duration-300 text-foreground hover:text-primary">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Powerful Features for Serious Traders
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to track, analyze, and improve your trading performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:bg-card/80 transition-all duration-300"
            >
              <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

