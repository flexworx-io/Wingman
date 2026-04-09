import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowLeft,
  Chrome, Building2, Sparkles, Shield, CheckCircle2, AlertCircle
} from 'lucide-react';

type AuthMode = 'select' | 'login' | 'register' | 'forgot' | 'verify' | 'reset';

// Microsoft SVG icon
const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

// Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Auth() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('select');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse URL params for token-based flows
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const flow = params.get('flow');
    if (token && flow === 'verify') { setVerifyToken(token); setMode('verify'); }
    if (token && flow === 'reset') { setResetToken(token); setMode('reset'); }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, loading, navigate]);

  const registerMutation = trpc.authFull.email.register.useMutation({
    onSuccess: (data) => {
      toast.success('Account created! Check your email to verify.');
      if (data.verificationToken) {
        toast.info(`Dev mode — verification token: ${data.verificationToken.slice(0, 12)}...`, { duration: 10000 });
      }
      setMode('verify');
    },
    onError: (err) => toast.error(err.message),
  });

  const loginMutation = trpc.authFull.email.login.useMutation({
    onSuccess: (data) => {
      toast.success('Welcome back!');
      // Set session cookie and redirect
      document.cookie = `app_session_id=${data.sessionToken}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      setTimeout(() => {
        navigate(data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
        window.location.reload();
      }, 500);
    },
    onError: (err) => toast.error(err.message),
  });

  const forgotMutation = trpc.authFull.email.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      if (data.resetToken) {
        toast.info(`Dev mode — reset token: ${data.resetToken.slice(0, 12)}...`, { duration: 10000 });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.authFull.email.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Password reset! You can now sign in.');
      setMode('login');
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyMutation = trpc.authFull.email.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success('Email verified! You can now sign in.');
      setMode('login');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    registerMutation.mutate({ email, password, name, origin: window.location.origin });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ email, origin: window.location.origin });
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    resetMutation.mutate({ token: resetToken, newPassword });
  };

  const handleVerify = async () => {
    if (!verifyToken) { toast.error('No verification token found'); return; }
    verifyMutation.mutate({ token: verifyToken });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Wingman
            </span>
          </a>
        </div>

        <AnimatePresence mode="wait">
          {/* ─── PROVIDER SELECTION ─── */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome to Wingman</h1>
              <p className="text-white/50 text-center text-sm mb-8">Your AI social intermediary awaits</p>

              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center gap-3"
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>

                <Button
                  onClick={handleMicrosoftLogin}
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 flex items-center gap-3"
                >
                  <MicrosoftIcon />
                  Continue with Microsoft
                </Button>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <Button
                  onClick={() => setMode('login')}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continue with Email
                </Button>
              </div>

              <p className="text-center text-white/30 text-xs mt-6">
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-purple-400 hover:text-purple-300 underline">
                  Create one
                </button>
              </p>

              <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-white/30 text-xs">
                  <Shield className="w-3 h-3" />
                  End-to-end encrypted
                </div>
                <div className="flex items-center gap-1.5 text-white/30 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  SOC 2 compliant
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── EMAIL LOGIN ─── */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <button onClick={() => setMode('select')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-white mb-6">Sign in to Wingman</h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('forgot')} className="text-purple-400 hover:text-purple-300 text-sm">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-10 bg-white/5 border-white/20 text-white hover:bg-white/10 text-sm flex items-center gap-2">
                  <GoogleIcon /> Continue with Google
                </Button>
                <Button onClick={handleMicrosoftLogin} variant="outline" className="w-full h-10 bg-white/5 border-white/20 text-white hover:bg-white/10 text-sm flex items-center gap-2">
                  <MicrosoftIcon /> Continue with Microsoft
                </Button>
              </div>

              <p className="text-center text-white/30 text-xs mt-4">
                No account?{' '}
                <button onClick={() => setMode('register')} className="text-purple-400 hover:text-purple-300 underline">Create one</button>
              </p>
            </motion.div>
          )}

          {/* ─── REGISTER ─── */}
          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <button onClick={() => setMode('select')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-white/40 text-sm mb-6">Start your Wingman journey</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                      minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= i * 3
                            ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-green-500'
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-white/30">
                      {password.length < 8 ? 'Too short' : password.length < 12 ? 'Fair' : password.length < 16 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-white/30 text-xs mt-4">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-purple-400 hover:text-purple-300 underline">Sign in</button>
              </p>

              <p className="text-center text-white/20 text-xs mt-3">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          )}

          {/* ─── FORGOT PASSWORD ─── */}
          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <button onClick={() => setMode('login')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
              <h2 className="text-xl font-bold text-white mb-2">Reset your password</h2>
              <p className="text-white/40 text-sm mb-6">We'll send a reset link to your email.</p>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                >
                  {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ─── RESET PASSWORD ─── */}
          {mode === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold text-white mb-2">Set new password</h2>
              <p className="text-white/40 text-sm mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ─── EMAIL VERIFICATION ─── */}
          {mode === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-white/50 text-sm mb-6">
                We sent a verification link to <span className="text-purple-400">{email || 'your email'}</span>.
                Click the link to activate your account.
              </p>

              {verifyToken && (
                <div className="mb-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Verification token detected
                    </div>
                  </div>
                  <Button
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold"
                  >
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify Email Now'}
                  </Button>
                </div>
              )}

              <p className="text-white/30 text-xs">
                Didn't receive it?{' '}
                <button onClick={() => setMode('register')} className="text-purple-400 hover:text-purple-300 underline">
                  Try again
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
