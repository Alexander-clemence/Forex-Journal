'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3,
  Brain,
  Target,
  ArrowRight
} from 'lucide-react';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';
import { useEffect } from 'react';
import { animate, stagger, utils } from 'animejs';

export default function ModernLandingPage() {
  useEffect(() => {
    // Track which elements have been animated
    const animatedElements = new Set<Element>();

    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        
        // Only animate on entering, not leaving
        if (entry.isIntersecting && !animatedElements.has(target)) {
          animatedElements.add(target);
          
          // Hero animations (immediate on first view)
          if (target.classList.contains('hero-subtitle')) {
            animate(target, {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 1000,
              ease: 'out(3)',
              delay: 200
            });
          }
          
          if (target.classList.contains('hero-title')) {
            animate(target, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 1200,
              ease: 'out(3)',
              delay: 400
            });
          }
          
          if (target.classList.contains('hero-description')) {
            animate(target, {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 1000,
              ease: 'out(3)',
              delay: 800
            });
          }
          
          if (target.classList.contains('hero-cta')) {
            animate(target, {
              opacity: [0, 1],
              scale: [0.9, 1],
              duration: 800,
              ease: 'out(3)',
              delay: 1200
            });
          }
          
          // Dashboard skeleton
          if (target.classList.contains('dashboard-skeleton')) {
            animate(target, {
              opacity: [0, 0.6],
              scale: [0.88, 1.02],
              duration: 1500,
              ease: 'out(2)',
              delay: 300
            });
            
            // Animate stats cards after skeleton appears
            setTimeout(() => {
              const statCards = document.querySelectorAll('.stat-card');
              if (statCards.length > 0) {
                animate(Array.from(statCards), {
                  opacity: [0, 1],
                  scale: [0.8, 1],
                  duration: 800,
                  ease: 'outElastic(1, 0.6)',
                  delay: stagger(80)
                });
              }
            }, 800);
            
            // Animate chart path
            setTimeout(() => {
              const chartPath = document.querySelector('.chart-path') as SVGPathElement;
              if (chartPath) {
                const pathLength = chartPath.getTotalLength();
                chartPath.style.strokeDasharray = String(pathLength);
                chartPath.style.strokeDashoffset = String(pathLength);
                
                animate('.chart-path', {
                  strokeDashoffset: [pathLength, 0],
                  duration: 2000,
                  ease: 'inOut(2)'
                });
                
                // Animate chart points after line
                setTimeout(() => {
                  const chartPoints = document.querySelectorAll('.chart-point');
                  if (chartPoints.length > 0) {
                    animate(Array.from(chartPoints), {
                      scale: [0, 1],
                      duration: 600,
                      ease: 'outElastic(1, 0.6)',
                      delay: stagger(150)
                    });
                  }
                }, 1000);
              }
            }, 1200);
          }
          
          // Section headings
          if (target.classList.contains('section-heading')) {
            animate(target, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 1000,
              ease: 'out(3)'
            });
            
            // Trigger child animations based on parent section
            const parentSection = target.parentElement;
            
            if (parentSection?.querySelector('.feature-card')) {
              setTimeout(() => {
                const cards = parentSection.querySelectorAll('.feature-card');
                if (cards.length > 0) {
                  cards.forEach(card => animatedElements.add(card));
                  animate(Array.from(cards), {
                    opacity: [0, 1],
                    translateY: [40, 0],
                    duration: 1000,
                    ease: 'out(3)',
                    delay: stagger(150)
                  });
                }
              }, 300);
            }
            
            if (parentSection?.querySelector('.benefit-card')) {
              setTimeout(() => {
                const cards = parentSection.querySelectorAll('.benefit-card');
                if (cards.length > 0) {
                  cards.forEach(card => animatedElements.add(card));
                  animate(Array.from(cards), {
                    opacity: [0, 1],
                    translateY: [40, 0],
                    scale: [0.95, 1],
                    duration: 1000,
                    ease: 'out(3)',
                    delay: stagger(150)
                  });
                }
              }, 300);
            }
          }
        }
      });
    }, observerOptions);

    // Observe all animated elements
    const elementsToObserve = [
      '.hero-subtitle',
      '.hero-title',
      '.hero-description',
      '.hero-cta',
      '.dashboard-skeleton',
      '.section-heading'
    ];

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      elementsToObserve.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => observer.observe(el));
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden text-white">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <SkipNavLink href="#landing-main" className="absolute left-4 top-4" />

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/Forex Journal Logo.png" alt="FX Journal Logo" width={48} height={48} className="h-12 w-12" />
            <span className="text-xl font-bold tracking-tight">FX Journal</span>
          </div>
          
          <Link href="/login">
            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl font-medium transition-all duration-300 border border-white/10 hover:border-white/20">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero & Sections */}
      <SkipNavContent id="landing-main">
      <main className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 pt-0 pb-24 sm:pb-32 space-y-8 sm:space-y-32">
        <section aria-labelledby="hero-heading" className="relative min-h-[100vh] flex items-center overflow-hidden -mt-[40px] sm:-mt-[60px]">
          <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Hero Content - Left Column */}
              <div className="relative z-10 space-y-8 order-2 lg:order-1">
                {/* Main Headline */}
                <p className="hero-subtitle text-sm uppercase tracking-[0.3em] text-slate-400 opacity-0">Journal smarter</p>
                <h1 id="hero-heading" className="hero-title text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1] opacity-0">
                  Trade Smarter,
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Grow Faster
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="hero-description text-base md:text-lg lg:text-xl text-slate-300 mb-12 leading-relaxed opacity-0">
                  Professional-grade trade journaling and analytics platform. Track every trade, analyze performance, and master your trading psychology.
                </p>

                {/* CTA Buttons */}
                <div className="hero-cta flex flex-col sm:flex-row gap-4 opacity-0">
                  <Link href="/login">
                    <button className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </Link>
                  <Link href="#features">
                    <button className="group relative w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-xl font-semibold text-lg transition-all duration-300 border border-white/20 hover:border-white/30">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Learn More
                        <BarChart3 className="h-5 w-5" />
                      </span>
                    </button>
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="hero-description flex flex-wrap gap-6 pt-4 opacity-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm text-slate-400">Real-time analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-sm text-slate-400">Secure & private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-sm text-slate-400">Export reports</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Preview - Right Column */}
              <div className="dashboard-skeleton relative w-full h-[500px] md:h-[550px] lg:h-[600px] pointer-events-none opacity-0 scale-90 order-1 lg:order-2">
                <div className="bg-slate-900/95 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-2xl h-full flex flex-col justify-center gap-5">
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Total P&L */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Total P&L</span>
                    <div className="h-6 w-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-emerald-400">$</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400">$2,458</div>
                  <div className="text-[10px] text-slate-400 mt-1">23 trades</div>
                </div>
                
                {/* Win Rate */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Win Rate</span>
                    <div className="h-6 w-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-emerald-400">🎯</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400">65.2%</div>
                  <div className="text-[10px] text-emerald-500 mt-1">Excellent</div>
                </div>
                
                {/* Open Trades */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Open Trades</span>
                    <div className="h-6 w-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-blue-400">📊</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-blue-400">3</div>
                  <div className="text-[10px] text-slate-400 mt-1">Active</div>
                </div>
                
                {/* Best Trade */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Best Trade</span>
                    <div className="h-6 w-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-emerald-400">↗</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400">$485</div>
                  <div className="text-[10px] text-emerald-500 mt-1">Winner</div>
                </div>
                
                {/* Worst Trade */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Worst Trade</span>
                    <div className="h-6 w-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-red-400">↘</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-red-400">-$125</div>
                  <div className="text-[10px] text-red-500 mt-1">Loss</div>
                </div>
                
                {/* Avg Win vs Loss */}
                <div className="stat-card bg-slate-800/90 border border-slate-700/90 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-300">Win/Loss</span>
                    <div className="h-6 w-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-emerald-400">%</div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-emerald-400">2.1:1</div>
                  <div className="text-[10px] text-slate-400 mt-1">Ratio</div>
                </div>
              </div>
              
              {/* Performance Chart */}
              <div className="bg-slate-800/90 border border-slate-700/90 rounded-xl p-4 sm:p-5">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white">Performance Overview</h4>
                  <p className="text-xs text-slate-300">Your trading performance over time</p>
                </div>
                
                {/* SVG Line Chart */}
                <div className="relative h-48 sm:h-56 w-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full border-t border-slate-700/50"
                        style={{ top: `${i * 25}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* Chart SVG */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroChartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d="M 0 180 L 0 120 Q 50 90, 100 100 T 200 80 T 300 70 L 400 50 L 400 200 L 0 200 Z"
                      fill="url(#heroChartGradient)"
                    />
                    
                    <path
                      className="chart-path"
                      d="M 0 120 Q 50 90, 100 100 T 200 80 T 300 70 L 400 50"
                      fill="none"
                      stroke="rgb(16, 185, 129)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {[
                      { x: 0, y: 120 },
                      { x: 100, y: 100 },
                      { x: 200, y: 80 },
                      { x: 300, y: 70 },
                      { x: 400, y: 50 }
                    ].map((point, i) => (
                      <circle
                        key={i}
                        className="chart-point"
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="rgb(16, 185, 129)"
                      />
                    ))}
                  </svg>
                </div>
                
                <div className="flex justify-between mt-3 text-[10px] text-slate-400">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                  <span>Nov</span>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section id="features" aria-labelledby="features-heading" className="space-y-6 max-w-6xl mx-auto px-2 sm:px-0">
          <div className="section-heading text-center opacity-0">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Why traders switch</p>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-semibold">Designed for focus and follow-through</h2>
          </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: 'Advanced Analytics',
              description: 'Deep insights into your trading performance with comprehensive metrics and visualizations.',
              gradient: 'from-blue-500 to-cyan-500'
            },
            {
              icon: Brain,
              title: 'Psychology Tracking',
              description: 'Monitor your emotional state and market sentiment to improve decision-making.',
              gradient: 'from-purple-500 to-pink-500'
            },
            {
              icon: Target,
              title: 'Performance Metrics',
              description: 'Track win rates, profit factors, and risk-reward ratios across all your trades.',
              gradient: 'from-emerald-500 to-teal-500'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="feature-card group relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 opacity-0"
            >
              <div className={`inline-flex p-3 bg-gradient-to-br ${feature.gradient} rounded-xl mb-4 shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              
              {/* Hover effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
            </div>
          ))}
        </div>
        </section>

        {/* Benefits Section */}
        <section aria-labelledby="benefits-heading" className="relative px-2 sm:px-0">
          <div className="section-heading text-center mb-12 opacity-0">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">The difference</p>
            <h2 id="benefits-heading" className="text-3xl md:text-4xl font-semibold">Why serious traders choose FX Journal</h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Benefit 1 */}
            <div className="benefit-card relative group opacity-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Data-Driven Decisions</h3>
                <p className="text-slate-400 leading-relaxed">
                  Stop guessing. Every trade logged becomes actionable insight. Identify patterns in your wins and losses, understand what works, and refine your edge with concrete data.
                </p>
              </div>
            </div>
            
            {/* Benefit 2 */}
            <div className="benefit-card relative group opacity-0">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Master Your Psychology</h3>
                <p className="text-slate-400 leading-relaxed">
                  Track your emotions, confidence levels, and mental state. Discover how psychology affects your performance and build the discipline that separates profitable traders from the rest.
                </p>
              </div>
            </div>
            
            {/* Benefit 3 */}
            <div className="benefit-card relative group opacity-0">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Lightning Fast Workflow</h3>
                <p className="text-slate-400 leading-relaxed">
                  Built for speed. Log trades in seconds with intuitive forms, smart defaults, and keyboard shortcuts. Spend less time entering data and more time analyzing what matters.
                </p>
              </div>
            </div>
            
            {/* Benefit 4 */}
            <div className="benefit-card relative group opacity-0">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-semibold text-white mb-3">Complete Trading History</h3>
                <p className="text-slate-400 leading-relaxed">
                  Your entire trading journey in one place. Filter by pair, strategy, or date. Export comprehensive reports. Never lose track of a trade or forget a lesson learned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-heading" className="text-center space-y-6 px-2 sm:px-0">
          <h2 id="cta-heading" className="section-heading text-4xl md:text-5xl font-bold opacity-0">
            Ready to transform your trading?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start journaling your trades and unlock insights that drive better performance.
          </p>
          <Link href="/login">
            <button className="group px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <span className="flex items-center gap-2">
                Start Trading Smarter
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </section>
      </main>
      </SkipNavContent>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/Forex Journal Logo.png" alt="FX Journal Logo" width={40} height={40} className="h-10 w-10" />
              <span className="text-white font-semibold">FX Journal</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2025 FX Journal. Professional trading analytics platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}