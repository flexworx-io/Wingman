/**
 * MAESTRO Personality Synthesis Engine — Showcase Page
 * Demonstrates all 8 MAESTRO UI components with live tRPC data
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PersonalityDNAHelix,
  CompatibilityRadar,
  ForgeRevealCinematic,
  WingmanOriginCard,
  WhyWeMatchedCard,
  FriendSyncChallenge,
  FutureYouMode,
  ConfidenceMeter,
  type TraitScore,
  type WingmanIdentity,
} from '@/components/maestro';
import { Cpu, ArrowLeft, Play, RefreshCw } from 'lucide-react';

// Demo data for components
const DEMO_TRAITS: TraitScore[] = [
  { trait: 'WARMTH', score: 85, label: 'Warmth' },
  { trait: 'HUMOR', score: 72, label: 'Humor' },
  { trait: 'DIRECTNESS', score: 68, label: 'Directness' },
  { trait: 'RELIABILITY', score: 91, label: 'Reliability' },
  { trait: 'INITIATIVE', score: 78, label: 'Initiative' },
  { trait: 'RESILIENCE', score: 65, label: 'Resilience' },
  { trait: 'EMOTIONAL_AWARENESS', score: 88, label: 'Empathy' },
  { trait: 'CURIOSITY', score: 94, label: 'Curiosity' },
];

const DEMO_MATCH_TRAITS: TraitScore[] = [
  { trait: 'WARMTH', score: 79, label: 'Warmth' },
  { trait: 'HUMOR', score: 88, label: 'Humor' },
  { trait: 'DIRECTNESS', score: 55, label: 'Directness' },
  { trait: 'RELIABILITY', score: 82, label: 'Reliability' },
  { trait: 'INITIATIVE', score: 91, label: 'Initiative' },
  { trait: 'RESILIENCE', score: 74, label: 'Resilience' },
  { trait: 'EMOTIONAL_AWARENESS', score: 69, label: 'Empathy' },
  { trait: 'CURIOSITY', score: 87, label: 'Curiosity' },
];

const DEMO_WINGMAN: WingmanIdentity = {
  name: 'ARIA',
  tagline: 'The Architect of Authentic Connections',
  about: 'ARIA operates at the intersection of warmth and precision, creating spaces where genuine bonds form naturally.',
  catchphrase: 'Every connection is a story waiting to be written.',
  signatureStrength: 'Emotional Intelligence',
  avatarStyle: 'cosmic',
  avatarColor: 'purple',
};

const DEMO_MATCH_WINGMAN: WingmanIdentity = {
  name: 'NOVA',
  tagline: 'The Catalyst of Unexpected Adventures',
  about: 'NOVA brings spontaneity and depth to every interaction, turning chance encounters into meaningful chapters.',
  catchphrase: 'Life is too short for shallow conversations.',
  signatureStrength: 'Creative Energy',
};

export default function MaestroShowcase() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [showReveal, setShowReveal] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Try to get real wingman data
  const wingmanQuery = trpc.wingman.getMyWingman.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const realWingman: WingmanIdentity = wingmanQuery.data ? {
    name: wingmanQuery.data.wingmanName ?? DEMO_WINGMAN.name,
    tagline: wingmanQuery.data.tagline ?? DEMO_WINGMAN.tagline,
    about: wingmanQuery.data.aboutMe ?? DEMO_WINGMAN.about,
    catchphrase: wingmanQuery.data.catchphrase ?? DEMO_WINGMAN.catchphrase,
    signatureStrength: wingmanQuery.data.signatureStrength ?? DEMO_WINGMAN.signatureStrength,
  } : DEMO_WINGMAN;

  const sections = [
    { id: 'helix', label: 'DNA Helix', description: 'Animated personality strand visualization' },
    { id: 'radar', label: 'Compatibility Radar', description: 'Multi-trait overlap chart' },
    { id: 'reveal', label: 'Forge Reveal', description: 'Cinematic identity reveal sequence' },
    { id: 'origin', label: 'Origin Card', description: 'Shareable Wingman identity card' },
    { id: 'matched', label: 'Why We Matched', description: 'Compatibility breakdown card' },
    { id: 'sync', label: 'Friend Sync', description: 'Invite friends to sync personalities' },
    { id: 'future', label: 'Future You', description: 'Personality growth projection' },
    { id: 'confidence', label: 'Confidence Meter', description: 'Synthesis certainty gauge' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Aurora */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-8 px-3 text-sm gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">MAESTRO Engine</h1>
                <p className="text-xs text-white/40">Personality Synthesis Components</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowReveal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2 text-sm"
          >
            <Play className="w-4 h-4" /> Forge Reveal Demo
          </Button>
        </div>
      </div>

      {/* Forge Reveal Cinematic */}
      <ForgeRevealCinematic
        wingman={realWingman}
        show={showReveal}
        onComplete={() => { setShowReveal(false); toast.success('Wingman forged!'); }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Section nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeSection === s.id
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40'
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setActiveSection(null)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40"
          >
            Show All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. DNA Helix */}
          {(!activeSection || activeSection === 'helix') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-1">Personality DNA Helix</h3>
              <p className="text-white/40 text-xs mb-4">Animated strand visualization of your 8 core traits</p>
              <div className="flex justify-center">
                <PersonalityDNAHelix traits={DEMO_TRAITS} size={120} animated />
              </div>
            </motion.div>
          )}

          {/* 2. Compatibility Radar */}
          {(!activeSection || activeSection === 'radar') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <CompatibilityRadar
                userTraits={DEMO_TRAITS}
                matchTraits={DEMO_MATCH_TRAITS}
                title="You vs NOVA — Compatibility Radar"
              />
            </motion.div>
          )}

          {/* 3. Origin Card */}
          {(!activeSection || activeSection === 'origin') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="mb-2">
                <h3 className="text-white font-semibold">Wingman Origin Card</h3>
                <p className="text-white/40 text-xs">Shareable identity card for social sharing</p>
              </div>
              <WingmanOriginCard
                wingman={realWingman}
                topTraits={DEMO_TRAITS.slice(0, 5)}
                userId={user?.id}
              />
            </motion.div>
          )}

          {/* 4. Why We Matched */}
          {(!activeSection || activeSection === 'matched') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="mb-2">
                <h3 className="text-white font-semibold">Why We Matched</h3>
                <p className="text-white/40 text-xs">Compatibility breakdown between two Wingmen</p>
              </div>
              <WhyWeMatchedCard
                myWingman={realWingman}
                theirWingman={DEMO_MATCH_WINGMAN}
                compatibilityScore={87}
                sharedTraits={['Curiosity', 'Warmth', 'Reliability']}
                complementaryTraits={['Humor ↔ Directness', 'Initiative ↔ Empathy']}
              />
            </motion.div>
          )}

          {/* 5. Friend Sync */}
          {(!activeSection || activeSection === 'sync') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="mb-2">
                <h3 className="text-white font-semibold">Friend Sync Challenge</h3>
                <p className="text-white/40 text-xs">Invite friends to discover compatibility</p>
              </div>
              <FriendSyncChallenge
                myWingman={realWingman}
                onInvite={(email) => console.log('Invited:', email)}
              />
            </motion.div>
          )}

          {/* 6. Future You */}
          {(!activeSection || activeSection === 'future') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="mb-2">
                <h3 className="text-white font-semibold">Future You Mode</h3>
                <p className="text-white/40 text-xs">Personality growth projection over time</p>
              </div>
              <FutureYouMode
                currentTraits={DEMO_TRAITS}
                timeframe="6 months"
              />
            </motion.div>
          )}

          {/* 7. Confidence Meter */}
          {(!activeSection || activeSection === 'confidence') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center">
              <h3 className="text-white font-semibold mb-1 self-start">Confidence Meter</h3>
              <p className="text-white/40 text-xs mb-6 self-start">Synthesis certainty gauge with animated fill</p>
              <div className="flex gap-8 flex-wrap justify-center">
                <ConfidenceMeter confidence={87} label="Trait Synthesis" animated />
                <ConfidenceMeter confidence={62} label="Match Accuracy" animated />
                <ConfidenceMeter confidence={94} label="Identity Clarity" animated />
              </div>
            </motion.div>
          )}

          {/* 8. Forge Reveal trigger */}
          {(!activeSection || activeSection === 'reveal') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-purple-900/30 to-cyan-900/20 border border-purple-500/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]">
              <h3 className="text-white font-semibold mb-2">Forge Reveal Cinematic</h3>
              <p className="text-white/50 text-sm text-center mb-6">
                Full-screen cinematic sequence that reveals your Wingman identity after synthesis.
              </p>
              <Button
                onClick={() => setShowReveal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
              >
                <Play className="w-4 h-4" /> Launch Reveal
              </Button>
            </motion.div>
          )}
        </div>

        {/* Live data section */}
        {isAuthenticated && wingmanQuery.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Your Live Wingman Data</h3>
              <Button
                onClick={() => wingmanQuery.refetch()}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2 text-sm h-8"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>
            <WingmanOriginCard wingman={realWingman} topTraits={DEMO_TRAITS.slice(0, 5)} userId={user?.id} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
