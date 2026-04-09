import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check, Zap, Shield, Users, Star, Crown, ArrowLeft,
  CreditCard, ExternalLink, AlertCircle, RefreshCw, X
} from 'lucide-react';

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-5 h-5" />,
  premium: <Star className="w-5 h-5" />,
  enterprise: <Crown className="w-5 h-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "from-slate-600 to-slate-700",
  premium: "from-violet-600 to-purple-700",
  enterprise: "from-amber-500 to-orange-600",
};

const PLAN_BORDER: Record<string, string> = {
  free: "border-white/10",
  premium: "border-violet-500/50",
  enterprise: "border-amber-500/50",
};

export default function Billing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      toast.success('🎉 Subscription activated! Welcome to your new plan.');
      // Clean URL
      window.history.replaceState({}, '', '/billing');
    }
    if (params.get('canceled')) {
      toast.info('Checkout canceled. Your plan was not changed.');
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const { data: plans, isLoading: plansLoading } = trpc.billing.getPlans.useQuery();
  const { data: subscription, refetch: refetchSub } = trpc.billing.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info('Redirecting to Stripe checkout...');
        window.open(data.checkoutUrl, '_blank');
      }
      setCheckingOut(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setCheckingOut(null);
    },
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      }
      setOpeningPortal(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setOpeningPortal(false);
    },
  });

  const cancelMutation = trpc.billing.cancelSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCanceling(false);
      refetchSub();
    },
    onError: (err) => {
      toast.error(err.message);
      setCanceling(false);
    },
  });

  const reactivateMutation = trpc.billing.reactivateSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchSub();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCheckout = (planId: 'premium' | 'enterprise') => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    setCheckingOut(planId);
    checkoutMutation.mutate({ planId, interval, origin: window.location.origin });
  };

  const handlePortal = () => {
    setOpeningPortal(true);
    portalMutation.mutate({ origin: window.location.origin });
  };

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) return;
    setCanceling(true);
    cancelMutation.mutate();
  };

  if (loading || plansLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentTier = subscription?.tier ?? 'free';
  const isSubscribed = currentTier !== 'free';

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">Billing & Plans</h1>
          <p className="text-white/50">Choose the plan that fits your social life</p>
        </div>

        {/* Current Subscription Status */}
        {isAuthenticated && subscription && (
          <div className="mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/50 text-sm mb-1">Current Plan</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold capitalize">{currentTier}</span>
                  {subscription.stripeStatus && (
                    <Badge className={`text-xs ${subscription.stripeStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                      {subscription.stripeStatus}
                    </Badge>
                  )}
                  {subscription.cancelAtPeriodEnd && (
                    <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                      Cancels at period end
                    </Badge>
                  )}
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-white/40 text-sm mt-1">
                    {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Renews'} on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isSubscribed && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePortal}
                      disabled={openingPortal}
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      {openingPortal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      <span className="ml-2">Manage Billing</span>
                    </Button>
                    {!subscription.cancelAtPeriodEnd ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={canceling}
                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Plan
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reactivateMutation.mutate()}
                        className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reactivate
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                interval === 'monthly'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                interval === 'yearly'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(plans ?? []).map((plan, i) => {
            const isCurrentPlan = currentTier === plan.id;
            const isFeatured = plan.id === 'premium';
            const price = interval === 'yearly' ? plan.yearlyAmount : plan.monthlyAmount;
            const displayPrice = price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}`;
            const period = price === 0 ? '' : interval === 'yearly' ? '/year' : '/month';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 flex flex-col ${PLAN_BORDER[plan.id]} ${
                  isFeatured ? 'bg-gradient-to-b from-violet-950/50 to-purple-950/30' : 'bg-white/5'
                } ${isCurrentPlan ? 'ring-2 ring-violet-500' : ''}`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_COLORS[plan.id]} flex items-center justify-center mb-3`}>
                    {PLAN_ICONS[plan.id]}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-white/50 text-sm">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">{displayPrice}</span>
                    <span className="text-white/40 text-sm mb-1">{period}</span>
                  </div>
                  {interval === 'yearly' && price > 0 && (
                    <p className="text-green-400 text-xs mt-1">
                      ${((plan.monthlyAmount * 12 - plan.yearlyAmount) / 100).toFixed(2)} saved vs monthly
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-white/70">{feature}</span>
                    </li>
                  ))}
                  {plan.guardianShield && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      <span className="text-cyan-300">Guardian Shield™ safety</span>
                    </li>
                  )}
                </ul>

                {/* CTA */}
                {plan.id === 'free' ? (
                  <Button
                    disabled
                    className="w-full bg-white/10 text-white/50 cursor-not-allowed"
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
                  </Button>
                ) : isCurrentPlan ? (
                  <Button
                    onClick={handlePortal}
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(plan.id as 'premium' | 'enterprise')}
                    disabled={checkingOut === plan.id}
                    className={`w-full font-semibold ${
                      isFeatured
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white'
                    }`}
                  >
                    {checkingOut === plan.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {checkingOut === plan.id ? 'Opening Checkout...' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Test mode notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium mb-1">Test Mode Active</p>
            <p className="text-amber-300/70">
              Use card <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code> with any future expiry and CVC to test payments.
              Claim your Stripe sandbox at{' '}
              <a href="https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVEtOY1Y3R3dXT3BkQW5pLDE3NzYzNjkyODQv100jpBSlhca" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
                dashboard.stripe.com
              </a>
            </p>
          </div>
        </div>

        {/* Enterprise contact */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Need a custom plan for your organization?{' '}
            <a href="mailto:enterprise@wingman.vip" className="text-violet-400 hover:text-violet-300 underline">
              Contact our enterprise team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
