'use client';

import Link from 'next/link';
import { 
  TrendingUp,
  BarChart3,
  Brain,
  Target,
  ArrowRight
} from 'lucide-react';

export default function ModernLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg" />
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FX Journal</span>
          </div>
          
          <Link href="/login">
            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-xl font-medium transition-all duration-300 border border-white/10 hover:border-white/20">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight leading-none">
            Trade Smarter,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Grow Faster
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Professional-grade trade journaling and analytics platform. Track every trade, analyze performance, and master your trading psychology.
          </p>

          {/* CTA */}
          <Link href="/login">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105">
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto">
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
              className="group relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105"
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

        {/* Visual Dashboard Preview */}
        <div className="mt-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Mock Dashboard */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="h-4 w-20 bg-white/10 rounded mb-3 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    <div className="h-8 w-24 bg-white/10 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                  </div>
                ))}
              </div>
              
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-64">
                <div className="h-full flex items-end justify-around gap-2">
                  {[65, 45, 80, 30, 70, 55, 90, 25, 60, 75, 40, 85].map((height, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-blue-500/50 to-purple-500/50 rounded-t animate-pulse w-full"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your trading?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
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
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
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