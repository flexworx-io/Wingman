/**
 * MAESTRO UI Component Library
 * Personality Synthesis Engine Visual Components
 *
 * Components:
 * - PersonalityDNAHelix — animated double helix for trait visualization
 * - CompatibilityRadar — recharts radar chart for trait overlap
 * - ForgeRevealCinematic — full-screen reveal animation
 * - WingmanOriginCard — shareable identity card
 * - WhyWeMatchedCard — compatibility explanation card
 * - FriendSyncChallenge — invite friends to sync personalities
 * - FutureYouMode — predictive personality projection
 * - ConfidenceMeter — animated confidence/certainty gauge
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { Sparkles, Share2, Users, TrendingUp, Zap, Star, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TraitScore {
  trait: string;
  score: number; // 0–100
  label?: string;
}

export interface WingmanIdentity {
  name: string;
  tagline: string;
  about: string;
  catchphrase: string;
  signatureStrength: string;
  avatarStyle?: string;
  avatarColor?: string;
}

// ─── 1. Personality DNA Helix ─────────────────────────────────────────────────
interface DNAHelixProps {
  traits: TraitScore[];
  size?: number;
  animated?: boolean;
}

export function PersonalityDNAHelix({ traits, size = 200, animated = true }: DNAHelixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size;
    const H = size * 2;
    canvas.width = W;
    canvas.height = H;

    const STRAND_COUNT = Math.min(traits.length, 12);
    const colors = [
      '#a855f7', '#06b6d4', '#f59e0b', '#10b981',
      '#f43f5e', '#3b82f6', '#8b5cf6', '#14b8a6',
      '#ec4899', '#84cc16', '#f97316', '#6366f1',
    ];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      timeRef.current += 0.02;
      const t = timeRef.current;

      for (let i = 0; i < STRAND_COUNT; i++) {
        const trait = traits[i];
        const color = colors[i % colors.length];
        const amplitude = (W / 2 - 10) * (trait.score / 100);
        const frequency = 0.04;
        const phase = (i / STRAND_COUNT) * Math.PI * 2;

        // Draw strand
        ctx.beginPath();
        for (let y = 0; y < H; y += 2) {
          const x = W / 2 + amplitude * Math.sin(frequency * y + t + phase);
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color + '88';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw nodes at peaks
        for (let y = 0; y < H; y += 40) {
          const x = W / 2 + amplitude * Math.sin(frequency * y + t + phase);
          const nodeSize = 3 + (trait.score / 100) * 3;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      // Central axis
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (animated) {
        frameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [traits, size, animated]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size * 2 }} className="rounded-xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508] pointer-events-none" />
    </div>
  );
}

// ─── 2. Compatibility Radar Chart ─────────────────────────────────────────────
interface CompatibilityRadarProps {
  userTraits: TraitScore[];
  matchTraits?: TraitScore[];
  title?: string;
}

export function CompatibilityRadar({ userTraits, matchTraits, title = 'Personality Profile' }: CompatibilityRadarProps) {
  const displayTraits = userTraits.slice(0, 8);
  const data = displayTraits.map((t, i) => ({
    trait: t.label ?? t.trait.replace(/_/g, ' ').slice(0, 12),
    you: t.score,
    match: matchTraits?.[i]?.score ?? 0,
  }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="trait" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
          <Radar
            name="You"
            dataKey="you"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {matchTraits && (
            <Radar
              name="Match"
              dataKey="match"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <div className="w-3 h-0.5 bg-purple-500" /> You
        </div>
        {matchTraits && (
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-3 h-0.5 bg-cyan-500" /> Match
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. Forge Reveal Cinematic ────────────────────────────────────────────────
interface ForgeRevealProps {
  wingman: WingmanIdentity;
  onComplete?: () => void;
  show: boolean;
}

export function ForgeRevealCinematic({ wingman, onComplete, show }: ForgeRevealProps) {
  const [phase, setPhase] = useState<'scanning' | 'synthesizing' | 'reveal' | 'done'>('scanning');

  useEffect(() => {
    if (!show) return;
    setPhase('scanning');
    const t1 = setTimeout(() => setPhase('synthesizing'), 1500);
    const t2 = setTimeout(() => setPhase('reveal'), 3000);
    const t3 = setTimeout(() => { setPhase('done'); onComplete?.(); }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#050508] flex items-center justify-center"
      >
        {/* Aurora background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 text-center max-w-md px-6">
          {phase === 'scanning' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-20 h-20 rounded-full border-2 border-purple-500/50 flex items-center justify-center mx-auto mb-6 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-t-2 border-purple-500"
                />
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-white/60 text-lg">Scanning your personality matrix...</p>
            </motion.div>
          )}

          {phase === 'synthesizing' && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex justify-center gap-2 mb-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [20, 60, 20] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-3 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full"
                  />
                ))}
              </div>
              <p className="text-white/60 text-lg">Synthesizing your Wingman identity...</p>
            </motion.div>
          )}

          {(phase === 'reveal' || phase === 'done') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Particle burst */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos((i / 12) * Math.PI * 2) * 120,
                    y: Math.sin((i / 12) * Math.PI * 2) * 120,
                    scale: 0,
                  }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-purple-400"
                />
              ))}

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50">
                <span className="text-4xl font-bold text-white">{wingman.name?.charAt(0) ?? 'W'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{wingman.name}</h2>
              <p className="text-purple-300 text-lg mb-4 italic">"{wingman.tagline}"</p>
              <p className="text-white/60 text-sm">{wingman.about}</p>
              <div className="mt-6 px-4 py-2 rounded-full bg-white/10 border border-white/20 inline-block">
                <span className="text-cyan-300 text-sm font-medium">✦ {wingman.signatureStrength}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── 4. Wingman Origin Card ───────────────────────────────────────────────────
interface OriginCardProps {
  wingman: WingmanIdentity;
  topTraits?: TraitScore[];
  userId?: number;
}

export function WingmanOriginCard({ wingman, topTraits = [], userId }: OriginCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `Meet ${wingman.name} — my AI Wingman on Wingman.vip\n"${wingman.tagline}"\n\nForge yours at wingman.vip`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-purple-900/40 to-cyan-900/20 border border-purple-500/30 rounded-2xl p-6 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-px bg-white" style={{
            left: `${(i / 20) * 100}%`, top: 0, bottom: 0,
            opacity: Math.random() * 0.5 + 0.1,
          }} />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30">
              {wingman.name?.charAt(0) ?? 'W'}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{wingman.name}</h3>
              <p className="text-purple-300 text-sm italic">"{wingman.tagline}"</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-white/60 text-xs">Wingman.vip</span>
          </div>
        </div>

        {topTraits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topTraits.slice(0, 5).map(t => (
              <span key={t.trait} className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs">
                {t.label ?? t.trait.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-white/60 text-xs italic">"{wingman.catchphrase}"</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-white/40 text-xs">
            Signature: <span className="text-cyan-400">{wingman.signatureStrength}</span>
          </div>
          <Button
            size="sm"
            onClick={handleShare}
            className="bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:bg-purple-600/50 gap-1.5 text-xs h-7"
            variant="outline"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Why We Matched Card ───────────────────────────────────────────────────
interface WhyWeMatchedProps {
  myWingman: WingmanIdentity;
  theirWingman: WingmanIdentity;
  compatibilityScore: number;
  sharedTraits: string[];
  complementaryTraits: string[];
}

export function WhyWeMatchedCard({
  myWingman, theirWingman, compatibilityScore, sharedTraits, complementaryTraits,
}: WhyWeMatchedProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold mx-auto mb-1">
            {myWingman.name?.charAt(0)}
          </div>
          <p className="text-white/70 text-xs">{myWingman.name}</p>
        </div>

        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-500/50 flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-white">{compatibilityScore}%</span>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-t-2 border-purple-500 opacity-50"
            />
          </div>
          <p className="text-purple-300 text-xs mt-1">Compatible</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-bold mx-auto mb-1">
            {theirWingman.name?.charAt(0)}
          </div>
          <p className="text-white/70 text-xs">{theirWingman.name}</p>
        </div>
      </div>

      {sharedTraits.length > 0 && (
        <div className="mb-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Shared Strengths</p>
          <div className="flex flex-wrap gap-1.5">
            {sharedTraits.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs">
                ✦ {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {complementaryTraits.length > 0 && (
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Complementary Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {complementaryTraits.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs">
                ↔ {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 6. Friend Sync Challenge ─────────────────────────────────────────────────
interface FriendSyncProps {
  myWingman: WingmanIdentity;
  onInvite?: (email: string) => void;
}

export function FriendSyncChallenge({ myWingman, onInvite }: FriendSyncProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleInvite = () => {
    if (!email) return;
    onInvite?.(email);
    setSent(true);
    toast.success(`Sync challenge sent to ${email}!`);
    setEmail('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/20 border border-purple-500/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Friend Sync Challenge</h3>
          <p className="text-white/50 text-sm">See how compatible you are with friends</p>
        </div>
      </div>

      <p className="text-white/60 text-sm mb-4">
        Invite a friend to forge their Wingman and discover your compatibility score.
        {myWingman.name} is ready to meet their match!
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="flex-1 h-9 px-3 bg-white/5 border border-white/20 rounded-md text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
        />
        <Button
          onClick={handleInvite}
          disabled={!email || sent}
          className="bg-purple-600 hover:bg-purple-500 text-white h-9 px-4 text-sm gap-1.5"
        >
          {sent ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {sent ? 'Sent!' : 'Invite'}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex -space-x-2">
          {['A', 'B', 'C'].map(l => (
            <div key={l} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 border border-[#050508] flex items-center justify-center text-white text-xs font-bold">
              {l}
            </div>
          ))}
        </div>
        <span className="text-white/40 text-xs">3 friends already synced</span>
      </div>
    </div>
  );
}

// ─── 7. Future You Mode ───────────────────────────────────────────────────────
interface FutureYouProps {
  currentTraits: TraitScore[];
  projectedTraits?: TraitScore[];
  timeframe?: string;
}

export function FutureYouMode({ currentTraits, projectedTraits, timeframe = '6 months' }: FutureYouProps) {
  const [showProjection, setShowProjection] = useState(false);

  const growthTraits = currentTraits
    .map((t, i) => ({
      ...t,
      projected: projectedTraits?.[i]?.score ?? Math.min(100, t.score + Math.floor(Math.random() * 15 + 5)),
    }))
    .sort((a, b) => (b.projected - b.score) - (a.projected - a.score))
    .slice(0, 5);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-semibold">Future You Mode</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowProjection(!showProjection)}
          className="bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 text-xs h-7 gap-1.5"
          variant="outline"
        >
          <Zap className="w-3 h-3" />
          {showProjection ? 'Hide' : 'Project'} {timeframe}
        </Button>
      </div>

      <p className="text-white/50 text-sm mb-4">
        Based on your current personality matrix, here's how your Wingman could evolve over {timeframe}:
      </p>

      <div className="space-y-3">
        {growthTraits.map(t => (
          <div key={t.trait}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-sm">{t.label ?? t.trait.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50">{t.score}%</span>
                {showProjection && (
                  <>
                    <ChevronRight className="w-3 h-3 text-cyan-400" />
                    <span className="text-cyan-400 font-medium">{t.projected}%</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: `${t.score}%` }}
                animate={{ width: showProjection ? `${t.projected}%` : `${t.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      {showProjection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
        >
          <p className="text-cyan-300 text-xs">
            ✦ Your Wingman's compatibility range is projected to expand by ~{Math.floor(Math.random() * 10 + 8)}% 
            as these traits strengthen through real-world interactions.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── 8. Confidence Meter ──────────────────────────────────────────────────────
interface ConfidenceMeterProps {
  confidence: number; // 0–100
  label?: string;
  animated?: boolean;
}

export function ConfidenceMeter({ confidence, label = 'Synthesis Confidence', animated = true }: ConfidenceMeterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animated) { setDisplayValue(confidence); return; }
    let start = 0;
    const step = confidence / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= confidence) { setDisplayValue(confidence); clearInterval(timer); }
      else setDisplayValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [confidence, animated]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const color = confidence >= 80 ? '#10b981' : confidence >= 60 ? '#a855f7' : confidence >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{displayValue}%</span>
        </div>
      </div>
      <p className="text-white/50 text-sm text-center">{label}</p>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        confidence >= 80 ? 'bg-green-500/20 text-green-400' :
        confidence >= 60 ? 'bg-purple-500/20 text-purple-400' :
        confidence >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'
      }`}>
        {confidence >= 80 ? 'High Confidence' : confidence >= 60 ? 'Good Confidence' : confidence >= 40 ? 'Moderate' : 'Low Confidence'}
      </div>
    </div>
  );
}
