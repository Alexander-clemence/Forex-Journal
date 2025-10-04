'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp
} from 'lucide-react';

export default function MinimalHomePage() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-500`}>
      {/* Main Content */}
      <div className="flex h-screen">
        {/* Left Side - App Hero */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          {/* Trading Chart Visualization */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-2/3 h-2/3" viewBox="0 0 400 300" fill="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8"/>
                </linearGradient>
              </defs>
              <path
                d="M50,200 Q100,150 150,180 T250,120 Q300,100 350,140"
                stroke="url(#chartGradient)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M50,220 Q100,170 150,200 T250,140 Q300,120 350,160"
                stroke="url(#chartGradient)"
                strokeWidth="2"
                fill="none"
                opacity="0.5"
                className="animate-pulse"
                style={{ animationDelay: '1s' }}
              />
            </svg>
          </div>

          {/* Floating Trading Icons */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 opacity-20">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-12 animate-pulse">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="absolute top-1/3 right-1/3 opacity-15">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl flex items-center justify-center transform -rotate-6 animate-pulse" style={{ animationDelay: '2s' }}>
                <span className="text-white font-bold">$</span>
              </div>
            </div>
            <div className="absolute bottom-1/3 left-1/3 opacity-10">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center transform rotate-45 animate-pulse" style={{ animationDelay: '3s' }}>
                <span className="text-white font-bold text-lg">📈</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center max-w-2xl px-8">
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse scale-150"></div>
                  <TrendingUp className="relative h-20 w-20 text-blue-500" />
                </div>
              </div>
              
              <h1 className={`text-7xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>
              FX - Journal
               
              </h1>
            </div>

            <p className={`text-2xl mb-12 font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xl mx-auto leading-relaxed`}>
              Master your trades. Analyze your performance. 
              <span className="block mt-2">Elevate your trading game.</span>
            </p>

            <Link href="./login">
              <button className="w-80 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white px-12 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl backdrop-blur-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Right Side - Decorative Element */}
        <div className="w-96 relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20"></div>
          
          {/* Abstract Trading Visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Animated Rings */}
              <div className="absolute inset-0 w-64 h-64 rounded-full border-2 border-blue-500/30 animate-spin" style={{ animationDuration: '20s' }}></div>
              <div className="absolute inset-4 w-56 h-56 rounded-full border-2 border-purple-500/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-8 w-48 h-48 rounded-full border-2 border-cyan-500/25 animate-spin" style={{ animationDuration: '10s' }}></div>
              
              {/* Center Glow */}
              <div className="absolute inset-24 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse blur-sm"></div>
              <div className="absolute inset-28 w-8 h-8 bg-white rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Floating Data Points */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 ${isDarkMode ? 'bg-white/40' : 'bg-gray-800/40'} rounded-full animate-pulse`}
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: `${30 + Math.sin(i) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${2 + (i % 3)}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}