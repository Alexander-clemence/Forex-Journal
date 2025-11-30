'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { TrendingUp, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';
import { SkipNavLink, SkipNavContent } from '@/components/ui/skip-nav';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ForexJournalIcon } from '@/components/ui/ForexJournalIcon';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.displayName || undefined
      );

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // Check if email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        setSignupSuccess(true);
        toast.success('Account created! Please check your email to confirm your account.');
      } else {
        // If email confirmation is not required (shouldn't happen in production)
        router.push('/dashboard');
      }
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-primary animate-pulse" />
            <span className="ml-2 text-2xl font-bold text-foreground">
              FX Journal
            </span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show success message after signup
  if (signupSuccess) {
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
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-foreground">Check Your Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                We've sent a confirmation link to {formData.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-primary/10 border-primary/20">
                <AlertDescription className="text-foreground">
                  Please check your email and click the confirmation link to activate your account. 
                  You'll be able to sign in once your email is confirmed.
                </AlertDescription>
              </Alert>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setSignupSuccess(false)}
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full mt-4">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--primary)/0.25),transparent_45%)] opacity-70" />
        
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
            </div>
          </div>
        </nav>
        
        <SkipNavLink href="#signup-form" className="m-4" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-16 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-primary">FX Journal</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-foreground">
                Start your trading journey.<br />
                Track every move.
              </h1>
              <p className="mt-4 text-base text-muted-foreground max-w-xl">
                Join thousands of traders who use FX Journal to track their performance, 
                analyze their psychology, and make data-driven decisions.
              </p>
            </div>

            <dl className="space-y-4 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <dt className="font-medium text-foreground">Secure & Private</dt>
                  <dd className="text-sm text-muted-foreground">Your data is encrypted and stored securely</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <dt className="font-medium text-foreground">Free to Start</dt>
                  <dd className="text-sm text-muted-foreground">Begin tracking your trades immediately</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <dt className="font-medium text-foreground">Powerful Analytics</dt>
                  <dd className="text-sm text-muted-foreground">Get insights from your trading history</dd>
                </div>
              </div>
            </dl>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">Already have an account?</p>
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>

          <SkipNavContent id="signup-form">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-3 text-foreground">
                  <TrendingUp className="h-7 w-7 text-primary" />
                  <span className="text-2xl font-semibold">Create your account</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Start tracking your trades today</p>
              </div>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Sign up</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter your details to create your account.
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
                      <Label htmlFor="displayName">Display Name (Optional)</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        placeholder="Your name"
                        value={formData.displayName}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
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
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isSubmitting}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Creating account…
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                    <div className="mt-2">
                      <Link href="/login" className="text-primary hover:underline">
                        Already have an account? Sign in
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

