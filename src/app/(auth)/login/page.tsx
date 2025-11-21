'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { TrendingUp, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';

// Welcome Back Screen for Already Signed-in Users
function WelcomeBackScreen({ userEmail }: { userEmail: string }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[
          { left: 10, top: 20, size: 2, delay: 0.5, duration: 3 },
          { left: 85, top: 15, size: 3, delay: 1.2, duration: 4 },
          { left: 25, top: 70, size: 2, delay: 0.8, duration: 3.5 },
          { left: 90, top: 80, size: 4, delay: 1.8, duration: 2.5 },
          { left: 15, top: 45, size: 2, delay: 0.3, duration: 4.2 },
          { left: 75, top: 25, size: 3, delay: 1.5, duration: 3.8 },
          { left: 45, top: 85, size: 2, delay: 0.9, duration: 3.2 },
          { left: 60, top: 10, size: 4, delay: 2.1, duration: 2.8 },
          { left: 30, top: 55, size: 3, delay: 1.1, duration: 3.9 },
          { left: 80, top: 65, size: 2, delay: 0.6, duration: 4.1 },
          { left: 5, top: 35, size: 4, delay: 1.9, duration: 2.7 },
          { left: 95, top: 40, size: 3, delay: 1.3, duration: 3.6 },
          { left: 50, top: 5, size: 2, delay: 0.4, duration: 4.3 },
          { left: 20, top: 90, size: 3, delay: 1.7, duration: 3.1 },
          { left: 70, top: 50, size: 2, delay: 0.7, duration: 3.7 }
        ].map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <div className="relative text-center space-y-8 z-10">
        {/* Welcome Back Logo */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse scale-150"></div>
            <TrendingUp className="relative h-16 w-16 text-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
          <div className="ml-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
              Welcome Back!
            </span>
          </div>
        </div>

        {/* Success Checkmark Animation */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-emerald-500 animate-checkmark" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-3">
          <p className="text-2xl font-bold text-white animate-fade-in">
            Welcome back, trader!
          </p>
          <p className="text-emerald-300 font-medium animate-pulse">
            🎯 Taking you to your dashboard...
          </p>
          <p className="text-sm text-emerald-200 opacity-80">
            {userEmail}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-400 to-green-400 h-full rounded-full animate-progress"></div>
          </div>
        </div>

        {/* Trading Stats Preview */}
        <div className="flex items-center justify-center space-x-8 text-sm text-emerald-200">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>📈</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>💰</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>📊</span>
          <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>🎯</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes checkmark {
          0% { stroke-dasharray: 0 50; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dasharray: 50 0; opacity: 1; }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float infinite ease-in-out;
        }
        
        .animate-checkmark {
          stroke-dasharray: 50;
          animation: checkmark 2s ease-in-out;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

// Creative Loading Animation Component for Sign In
function LoginLoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-violet-900 via-blue-900 to-cyan-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[
          { left: 12, top: 18, size: 3, delay: 0.4, duration: 3.2 },
          { left: 88, top: 22, size: 2, delay: 1.1, duration: 4.1 },
          { left: 35, top: 65, size: 4, delay: 0.7, duration: 2.8 },
          { left: 75, top: 85, size: 2, delay: 1.8, duration: 3.6 },
          { left: 8, top: 42, size: 3, delay: 0.2, duration: 4.3 },
          { left: 92, top: 38, size: 2, delay: 1.5, duration: 3.9 },
          { left: 45, top: 12, size: 4, delay: 0.9, duration: 2.5 },
          { left: 62, top: 78, size: 3, delay: 1.3, duration: 3.7 },
          { left: 25, top: 55, size: 2, delay: 0.6, duration: 4.2 },
          { left: 85, top: 45, size: 4, delay: 1.9, duration: 2.9 },
          { left: 18, top: 82, size: 3, delay: 0.8, duration: 3.4 },
          { left: 78, top: 15, size: 2, delay: 1.2, duration: 4.0 },
          { left: 52, top: 68, size: 4, delay: 0.5, duration: 2.7 },
          { left: 38, top: 28, size: 3, delay: 1.6, duration: 3.8 },
          { left: 68, top: 58, size: 2, delay: 0.3, duration: 4.4 },
          { left: 15, top: 35, size: 4, delay: 1.4, duration: 2.6 },
          { left: 95, top: 72, size: 3, delay: 0.1, duration: 3.5 },
          { left: 42, top: 88, size: 2, delay: 1.7, duration: 4.1 },
          { left: 82, top: 25, size: 4, delay: 0.9, duration: 2.8 },
          { left: 28, top: 48, size: 3, delay: 1.0, duration: 3.3 }
        ].map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Trading chart lines animation */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M0,50 Q25,30 50,45 T100,35"
            stroke="url(#gradient1)"
            strokeWidth="0.5"
            fill="none"
            className="animate-draw"
          />
          <path
            d="M0,60 Q25,40 50,55 T100,45"
            stroke="url(#gradient2)"
            strokeWidth="0.3"
            fill="none"
            className="animate-draw"
            style={{ animationDelay: '0.5s' }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative text-center space-y-8 z-10">
        {/* Floating Logo with Glow */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse scale-150"></div>
            <TrendingUp className="relative h-16 w-16 text-cyan-400 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
          <div className="ml-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent animate-pulse">
              Trading Journal
            </span>
          </div>
        </div>

        {/* Multi-layered Loading Spinner */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-md animate-ping"></div>
            
            {/* Outer spinning ring */}
            <div className="relative w-20 h-20 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-900 via-blue-900 to-cyan-900"></div>
            </div>
            
            {/* Middle ring */}
            <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-2 border-transparent bg-gradient-to-r from-violet-500 to-blue-500 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-900 via-blue-900 to-cyan-900"></div>
            </div>
            
            {/* Inner pulsing core */}
            <div className="absolute top-6 left-6 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse shadow-lg shadow-cyan-500/50"></div>
            
            {/* Center dot */}
            <div className="absolute top-8 left-8 w-4 h-4 rounded-full bg-white animate-ping"></div>
          </div>
        </div>

        {/* Animated Text */}
        <div className="space-y-3">
          <p className="text-2xl font-bold text-white animate-fade-in">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>S</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>i</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>g</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>n</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>i</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>n</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>g</span>
            <span className="mx-2"></span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>y</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>o</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>u</span>
            <span className="mx-2"></span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '1.0s' }}>i</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>n</span>
          </p>
          <p className="text-cyan-300 font-medium animate-pulse">
            🚀 Preparing your trading universe...
          </p>
        </div>

        {/* Trading-themed Progress Indicators */}
        <div className="space-y-4">
          {/* Stock bars animation */}
          <div className="flex items-end justify-center space-x-1">
            {[18, 25, 15, 22, 28, 12, 20].map((height, i) => (
              <div
                key={i}
                className="bg-gradient-to-t from-green-500 to-cyan-400 rounded-sm animate-pulse"
                style={{
                  width: '4px',
                  height: `${height}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
          
          {/* Currency symbols */}
          <div className="flex items-center justify-center space-x-6 text-xl">
            <span className="animate-bounce text-green-400" style={{ animationDelay: '0s' }}>$</span>
            <span className="animate-bounce text-blue-400" style={{ animationDelay: '0.3s' }}>€</span>
            <span className="animate-bounce text-yellow-400" style={{ animationDelay: '0.6s' }}>£</span>
            <span className="animate-bounce text-purple-400" style={{ animationDelay: '0.9s' }}>¥</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes draw {
          0% { stroke-dasharray: 0 100; }
          100% { stroke-dasharray: 100 0; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float infinite ease-in-out;
        }
        
        .animate-draw {
          stroke-dasharray: 100;
          animation: draw 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const highlights = [
    {
      title: 'Frictionless journaling',
      description: 'Log trades in seconds with keyboard shortcuts and saved presets.'
    },
    {
      title: 'Psychology checks',
      description: 'Tag moods and market sentiment so you can spot behavioral patterns.'
    },
    {
      title: 'Security first',
      description: '2FA-ready auth, encrypted Supabase storage, and inactivity guards.'
    }
  ];

  // Handle signed-in users with welcome back screen
  useEffect(() => {
    if (user && !loading) {
      setShowWelcomeBack(true);
      // Show welcome back screen for 2 seconds, then redirect
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
        setIsSubmitting(false);
      }
      // Success case: useEffect will handle redirect
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Show loading state with better UX for already signed-in users
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600 animate-pulse" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">
              Trading Journal
            </span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // Show welcome back screen for already signed-in users
  if (showWelcomeBack && user) {
    return <WelcomeBackScreen userEmail={user.email || 'trader'} />;
  }

  return (
    <>
      {isSubmitting && <LoginLoadingOverlay />}

      <div className="relative min-h-screen bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_45%)] opacity-70" />
        <SkipNavLink href="#login-form" className="m-4" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-16 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-300">FX Journal</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
                Own your process.<br />
                Trade with clarity.
              </h1>
              <p className="mt-4 text-base text-slate-300 max-w-xl">
                We combine structured journaling, psychology tracking, and institutional-grade analytics so every trade
                becomes a lesson—not a guess.
              </p>
            </div>

            <dl
              className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              data-tour="login-highlights"
            >
              {highlights.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-blue-300" />
                  <div>
                    <dt className="font-medium text-white">{item.title}</dt>
                    <dd className="text-sm text-slate-300">{item.description}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <div>
                <p className="font-semibold text-white">New here?</p>
                <span>Save trades and revisit insights anytime.</span>
              </div>
              <div>
                <p className="font-semibold text-white">Need help?</p>
                <Link href="/support" className="text-blue-300 underline-offset-4 hover:underline">
                  Contact support
                </Link>
              </div>
            </div>
          </div>

          <SkipNavContent id="login-form">
            <div
              data-tour="login-form"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur"
            >
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-3 text-white">
                  <TrendingUp className="h-7 w-7 text-blue-400" />
                  <span className="text-2xl font-semibold">Sign in to FX Journal</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Secure access to your trading workspace</p>
              </div>

              <Card className="bg-slate-950/50 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Welcome back</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter your credentials to continue tracking progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive" role="alert">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@broker.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Signing in…
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-sm text-slate-400">
                    <Link href="/forgot-password" className="text-blue-300 hover:underline">
                      Forgot your password?
                    </Link>
                    <div className="mt-2">
                      <Link href="/" className="hover:text-white">
                        ← Back to home
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SkipNavContent>
        </div>
      </div>
    </>
  );
}