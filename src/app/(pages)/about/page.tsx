'use client';

import Link from 'next/link';
import { ForexJournalIcon } from '@/components/ui/ForexJournalIcon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AboutPage() {
  const { user } = useAuth();
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About FX Journal
          </h1>
          <p className="text-xl text-muted-foreground">
            Built for traders who take their craft seriously
          </p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
            <p className="leading-relaxed">
              FX Journal was created to help traders track their performance, understand their psychology, 
              and make data-driven decisions. We believe that consistent journaling and analysis are the 
              keys to long-term trading success.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">What We Offer</h2>
            <p className="leading-relaxed">
              Our platform provides comprehensive trade tracking, advanced analytics, psychology monitoring, 
              and secure data storage. Whether you're a day trader, swing trader, or long-term investor, 
              FX Journal helps you stay organized and make better trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Privacy & Security</h2>
            <p className="leading-relaxed">
              Your trading data is yours alone. We use industry-standard encryption and security practices 
              to ensure your information remains private and secure. We never share your data with third parties.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

