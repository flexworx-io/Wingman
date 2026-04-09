import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Heart, Star, Shield, Target, Sparkles, ArrowRight, ArrowLeft, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const TRAIT_KEYS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalDepth', 'socialEnergy', 'practicalVsImaginative', 'headVsHeart', 'structuredVsFlexible', 'motivationStyle', 'growthMindset', 'purposeFocus', 'honestyOpenness', 'emotionalAwareness', 'socialConfidence', 'flexibility', 'reliability', 'curiosity', 'formality', 'directness', 'humor', 'warmth', 'responseSpeed', 'adventurousness', 'researchMindset', 'intuition', 'teamwork', 'initiative', 'imagination', 'attentionToDetail', 'resilience', 'adaptability', 'independence', 'trust'] as const;

const TRAIT_LABELS: Record<string, string> = {'openness': 'Openness', 'conscientiousness': 'Conscientiousness', 'extraversion': 'Extraversion', 'agreeableness': 'Agreeableness', 'emotionalDepth': 'Emotional Depth', 'socialEnergy': 'Social Energy', 'practicalVsImaginative': 'Practical vs Imaginative', 'headVsHeart': 'Head vs Heart', 'structuredVsFlexible': 'Structured vs Flexible', 'motivationStyle': 'Motivation Style', 'growthMindset': 'Growth Mindset', 'purposeFocus': 'Purpose Focus', 'honestyOpenness': 'Honesty & Openness', 'emotionalAwareness': 'Emotional Awareness', 'socialConfidence': 'Social Confidence', 'flexibility': 'Flexibility', 'reliability': 'Reliability', 'curiosity': 'Curiosity', 'formality': 'Formality', 'directness': 'Directness', 'humor': 'Humor', 'warmth': 'Warmth', 'responseSpeed': 'Response Speed', 'adventurousness': 'Adventurousness', 'researchMindset': 'Research Mindset', 'intuition': 'Intuition', 'teamwork': 'Teamwork', 'initiative': 'Initiative', 'imagination': 'Imagination', 'attentionToDetail': 'Attention to Detail', 'resilience': 'Resilience', 'adaptability': 'Adaptability', 'independence': 'Independence', 'trust': 'Trust'};
const TRAIT_DESCS: Record<string, string> = {'openness': 'Curiosity and openness to new experiences', 'conscientiousness': 'Organization and dependability', 'extraversion': 'Energy from social interactions', 'agreeableness': 'Cooperation and trust in others', 'emotionalDepth': 'Depth of emotional experience', 'socialEnergy': 'Energy level in social situations', 'practicalVsImaginative': 'Preference for practical vs creative thinking', 'headVsHeart': 'Logic vs emotion in decision making', 'structuredVsFlexible': 'Preference for structure vs spontaneity', 'motivationStyle': 'What drives you to take action', 'growthMindset': 'Belief in ability to grow and learn', 'purposeFocus': 'Clarity of life purpose and direction', 'honestyOpenness': 'Transparency and honesty with others', 'emotionalAwareness': 'Awareness of your own emotions', 'socialConfidence': 'Confidence in social situations', 'flexibility': 'Ability to adapt to change', 'reliability': 'Consistency and dependability', 'curiosity': 'Desire to learn and explore', 'formality': 'Preference for formal vs casual interactions', 'directness': 'Clear and honest communication', 'humor': 'Wit and playfulness', 'warmth': 'Genuine care for others', 'responseSpeed': 'How quickly you respond and decide', 'adventurousness': 'Seeking new experiences', 'researchMindset': 'Tendency to research before deciding', 'intuition': 'Trusting gut feelings', 'teamwork': 'Working well with others', 'initiative': 'Taking action without being asked', 'imagination': 'Creative and imaginative thinking', 'attentionToDetail': 'Focus on details and precision', 'resilience': 'Bouncing back from setbacks', 'adaptability': 'Adjusting to new situations', 'independence': 'Self-reliance and autonomy', 'trust': 'Openness and vulnerability with others'};
const TRAIT_CATEGORIES: Record<string, string[]> = {'Core Personality': ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalDepth'], 'Social Style': ['socialEnergy', 'socialConfidence', 'formality', 'directness', 'warmth', 'humor'], 'Thinking Style': ['practicalVsImaginative', 'headVsHeart', 'structuredVsFlexible', 'researchMindset', 'intuition'], 'Motivation & Drive': ['motivationStyle', 'growthMindset', 'purposeFocus', 'initiative', 'imagination'], 'Emotional Intelligence': ['honestyOpenness', 'emotionalAwareness', 'flexibility', 'reliability', 'resilience', 'adaptability'], 'Social Dynamics': ['curiosity', 'adventurousness', 'teamwork', 'independence', 'trust', 'attentionToDetail', 'responseSpeed']};

const INTEREST_CATEGORIES = [
  { category: "Technology", interests: ["AI & Machine Learning", "Blockchain", "Cybersecurity", "Space Tech", "Robotics"] },
  { category: "Arts & Culture", interests: ["Music", "Photography", "Film", "Digital Art", "Writing"] },
  { category: "Wellness", interests: ["Fitness", "Yoga", "Meditation", "Nutrition", "Mental Health"] },
  { category: "Social", interests: ["Travel", "Cooking", "Gaming", "Fashion", "Sports"] },
  { category: "Knowledge", interests: ["Philosophy", "Science", "Business", "Spirituality", "History"] },
  { category: "Adventure", interests: ["Rock Climbing", "Surfing", "Hiking", "Skydiving", "Scuba Diving"] },
];

const SOCIAL_MODES = [
  { id: "friendship", label: "Friendship", emoji: "🤝", desc: "Find genuine friends and companions", color: "from-blue-500 to-cyan-500" },
  { id: "dating", label: "Dating", emoji: "💕", desc: "Discover romantic connections", color: "from-rose-500 to-pink-500" },
  { id: "business", label: "Business", emoji: "💼", desc: "Build professional relationships", color: "from-amber-500 to-orange-500" },
  { id: "family", label: "Family", emoji: "🏡", desc: "Connect with family-oriented people", color: "from-emerald-500 to-teal-500" },
];

const AVATARS = [
  { id: "cartoon" as const, label: "Cosmic", emoji: "🌌", color: "from-violet-600 to-purple-800", desc: "Ethereal and otherworldly" },
  { id: "realistic" as const, label: "Aurora", emoji: "🌠", color: "from-cyan-500 to-blue-600", desc: "Luminous and dynamic" },
  { id: "fantasy" as const, label: "Mythic", emoji: "🔥", color: "from-orange-500 to-red-600", desc: "Bold and legendary" },
  { id: "aspirational" as const, label: "Stellar", emoji: "⭐", color: "from-yellow-400 to-orange-500", desc: "Radiant and inspiring" },
];

const TRUST_LEVELS = [
  { level: 1, name: "Public", desc: "Open discovery — minimal info shared. Your Wingman is visible to everyone.", color: "text-slate-400", bg: "from-slate-500/20 to-slate-600/10", border: "border-slate-500/30" },
  { level: 2, name: "Acquaintance", desc: "Basic profile visible to new connections. Good for casual networking.", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/30" },
  { level: 3, name: "Connection", desc: "Shared interests and compatibility data revealed. The social sweet spot.", color: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/30" },
  { level: 4, name: "Trusted", desc: "Deep personality insights shared. For meaningful relationships.", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30" },
  { level: 5, name: "Inner Circle", desc: "Full access — reserved for your closest connections only.", color: "text-primary", bg: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/30" },
];

const STEPS = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Soul Forge", icon: Brain },
  { id: 3, title: "Interests", icon: Heart },
  { id: 4, title: "Avatar", icon: Star },
  { id: 5, title: "Social Mode", icon: Target },
  { id: 6, title: "Trust", icon: Shield },
  { id: 7, title: "Activate", icon: Zap },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [interestCategories, setInterestCategories] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<"cartoon"|"realistic"|"fantasy"|"aspirational">("cartoon");
  const [wingmanName, setWingmanName] = useState("");
  const [socialModes, setSocialModes] = useState<string[]>(["friendship"]);
  const [trustLevel, setTrustLevel] = useState(2);
  const [activating, setActivating] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [activationPhase, setActivationPhase] = useState(0);

  const createWingman = trpc.wingman.createWingman.useMutation();
  const saveTraits = trpc.soulForge.saveTraits.useMutation();
  const saveInterests = trpc.interests.save.useMutation();
  const activateWingman = trpc.wingman.activateWingman.useMutation();
  const generateAvatar = trpc.soulForge.generateAvatar.useMutation();

  const toggleInterest = (category: string, interest: string) => {
    const key = `${category}:${interest}`;
    if (interests.includes(interest)) {
      setInterests(prev => prev.filter(i => i !== interest));
      setInterestCategories(prev => { const n = { ...prev }; delete n[interest]; return n; });
    } else {
      setInterests(prev => [...prev, interest]);
      setInterestCategories(prev => ({ ...prev, [interest]: category }));
    }
  };

  const handleGenerateAvatar = async () => {
    if (!wingmanName.trim()) { toast.error("Name your Wingman first"); return; }
    setGeneratingAvatar(true);
    try {
      // Derive top traits from slider values
      const sortedTraits = Object.entries(traits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([k]) => TRAIT_LABELS[k] || k);
      const archetypes: Record<string, string> = {
        cartoon: "Cosmic Explorer", realistic: "Aurora Guide",
        fantasy: "Mythic Sage", aspirational: "Stellar Visionary",
      };
      const aesthetics: Record<string, string> = {
        cartoon: "ethereal cosmic nebula", realistic: "aurora borealis luminous",
        fantasy: "mythic fire and shadow", aspirational: "golden stellar radiance",
      };
      const result = await generateAvatar.mutateAsync({
        style: avatar,
        aesthetic: aesthetics[avatar] ?? "aurora neon",
        personalityArchetype: archetypes[avatar] ?? "Explorer",
        topTraits: sortedTraits.length > 0 ? sortedTraits : ["openness", "curiosity", "warmth"],
      });
      setGeneratedAvatarUrl(result.avatarUrl ?? null);
      toast.success("Avatar generated!");
    } catch {
      toast.error("Avatar generation failed — using style preview");
    } finally {
      setGeneratingAvatar(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>
        <div className="glass-card p-10 text-center max-w-md relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign In to Begin</h2>
          <p className="text-muted-foreground mb-6">Create your account to start forging your Wingman.</p>
          <Button className="btn-aurora w-full" onClick={() => window.location.href = getLoginUrl()}>
            Sign In / Create Account
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const ACTIVATION_PHASES = [
    "Calibrating personality matrix...",
    "Forging neural pathways...",
    "Encoding 34 soul traits...",
    "Awakening social intelligence...",
    "Synchronizing with the network...",
    "Your Wingman is alive!",
  ];

  const handleActivate = async () => {
    if (!wingmanName.trim()) { toast.error("Please name your Wingman"); return; }
    setActivating(true);
    setActivationPhase(0);

    // Animate through phases
    const phaseInterval = setInterval(() => {
      setActivationPhase(p => {
        if (p >= ACTIVATION_PHASES.length - 2) { clearInterval(phaseInterval); return p; }
        return p + 1;
      });
    }, 700);

    try {
      const result = await createWingman.mutateAsync({
        wingmanName: wingmanName.trim(),
        avatarStyle: avatar,
        socialMode: socialModes,
        personalityArchetype: "Explorer",
        ...(generatedAvatarUrl ? { avatarUrl: generatedAvatarUrl } : {}),
      });
      const wingmanId = result.wingmanId;

      if (wingmanId && Object.keys(traits).length > 0) {
        const traitInput = Object.fromEntries(
          TRAIT_KEYS.map(k => [k, traits[k] ?? 50])
        ) as Record<typeof TRAIT_KEYS[number], number>;
        await saveTraits.mutateAsync({ wingmanId, traits: traitInput, selectedStyles: [avatar] });
      }

      if (interests.length > 0) {
        const interestObjects = interests.map(i => ({
          category: interestCategories[i] || "General",
          interest: i,
        }));
        await saveInterests.mutateAsync({ interests: interestObjects });
      }

      await activateWingman.mutateAsync({ wingmanId });

      clearInterval(phaseInterval);
      setActivationPhase(ACTIVATION_PHASES.length - 1);
      toast.success(`${wingmanName} is now active!`);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (e: any) {
      clearInterval(phaseInterval);
      toast.error(e?.message || "Activation failed. Please try again.");
      setActivating(false);
      setActivationPhase(0);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-display font-bold text-sm gradient-text">Soul Forge</span>
            </div>
            <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between mt-2">
            {STEPS.map(({ id, title, icon: Icon }) => (
              <div key={id} className={"flex flex-col items-center gap-1 " + (id <= step ? "opacity-100" : "opacity-30")}>
                <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs " + (id < step ? "bg-primary text-white" : id === step ? "bg-primary/20 border border-primary text-primary" : "bg-muted text-muted-foreground")}>
                  {id < step ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </div>
                <span className="text-[9px] text-muted-foreground hidden sm:block">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-32 relative z-10">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center animate-fade-up">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse-glow">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">Welcome to Soul Forge</Badge>
            <h1 className="font-display text-5xl font-bold mb-4 gradient-text">Forge Your Wingman</h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              In the next 7 steps, you will craft an AI agent that represents your authentic self — your personal Wingman who discovers compatible people and makes introductions on your behalf.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
              {[
                { icon: "🧠", title: "34-Trait Assessment", desc: "Map your complete personality DNA" },
                { icon: "🤖", title: "AI Agent Creation", desc: "Your Wingman comes to life" },
                { icon: "🌐", title: "Network Discovery", desc: "Find your people automatically" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="glass-card p-5">
                  <div className="text-3xl mb-3">{icon}</div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <Button className="btn-aurora px-10 py-4 rounded-xl text-base" onClick={() => setStep(2)}>
              Begin Soul Forge <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Soul Forge — 34 Traits */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-violet-500/10 text-violet-400 border-violet-500/20">Soul Forge Assessment</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Map Your Personality DNA</h2>
              <p className="text-muted-foreground">Adjust all 34 trait sliders to reflect your authentic self. These power your Wingman's matching algorithm.</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-primary">{Object.keys(traits).length}</span>
                <span className="text-sm text-muted-foreground">/ 34 traits mapped</span>
              </div>
            </div>
            <div className="space-y-8">
              {Object.entries(TRAIT_CATEGORIES).map(([category, keys]) => (
                <div key={category} className="glass-card p-6">
                  <h3 className="font-semibold text-sm text-primary mb-4 uppercase tracking-wider">{category}</h3>
                  <div className="space-y-5">
                    {keys.map(traitKey => (
                      <div key={traitKey}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">{TRAIT_LABELS[traitKey]}</span>
                            <p className="text-xs text-muted-foreground">{TRAIT_DESCS[traitKey]}</p>
                          </div>
                          <span className="text-sm font-bold text-primary w-8 text-right">{traits[traitKey] ?? 50}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="range" min="0" max="100" step="5"
                            value={traits[traitKey] ?? 50}
                            onChange={e => setTraits(prev => ({ ...prev, [traitKey]: Number(e.target.value) }))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, oklch(0.7 0.2 280) 0%, oklch(0.7 0.2 280) ${traits[traitKey] ?? 50}%, oklch(0.3 0.05 280) ${traits[traitKey] ?? 50}%, oklch(0.3 0.05 280) 100%)`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-rose-500/10 text-rose-400 border-rose-500/20">Interests & Passions</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">What Lights You Up?</h2>
              <p className="text-muted-foreground">Select at least 3 interests. Your Wingman uses these to find people who share your passions.</p>
              <div className="mt-3">
                <span className="text-sm font-bold text-primary">{interests.length}</span>
                <span className="text-sm text-muted-foreground"> selected</span>
              </div>
            </div>
            <div className="space-y-6">
              {INTEREST_CATEGORIES.map(({ category, interests: categoryInterests }) => (
                <div key={category} className="glass-card p-5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(category, interest)}
                        className={"px-4 py-2 rounded-full text-sm font-medium transition-all border " + (interests.includes(interest) ? "bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20" : "glass border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Avatar Designer */}
        {step === 4 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20">Wingman Identity</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Design Your Wingman</h2>
              <p className="text-muted-foreground">Choose a visual style, name your Wingman, then generate a unique AI avatar.</p>
            </div>

            {/* Avatar style selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {AVATARS.map(av => (
                <button key={av.id} onClick={() => { setAvatar(av.id); setGeneratedAvatarUrl(null); }}
                  className={"glass-card p-5 text-center transition-all border-2 " + (avatar === av.id ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary/30")}>
                  <div className={"w-14 h-14 rounded-2xl bg-gradient-to-br " + av.color + " flex items-center justify-center mx-auto mb-2 text-2xl shadow-lg"}>{av.emoji}</div>
                  <p className="font-semibold text-sm">{av.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{av.desc}</p>
                </button>
              ))}
            </div>

            {/* Name input */}
            <div className="glass-card p-6 mb-6">
              <label className="block text-sm font-medium mb-2">Name Your Wingman</label>
              <input type="text" value={wingmanName} onChange={e => setWingmanName(e.target.value)}
                placeholder="e.g. ARIA, NOVA, ECHO, SAGE, ORION..."
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-lg font-semibold"
                maxLength={20} />
              <p className="text-xs text-muted-foreground mt-2">This is how your Wingman introduces itself to others.</p>
            </div>

            {/* AI Avatar generation */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">AI-Generated Avatar</p>
                  <p className="text-xs text-muted-foreground">Generate a unique visual identity based on your traits and style</p>
                </div>
                <Button
                  variant="outline"
                  className="glass border-primary/40 text-primary hover:bg-primary/10"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !wingmanName.trim()}
                >
                  {generatingAvatar ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><ImageIcon className="w-4 h-4 mr-2" /> Generate Avatar</>}
                </Button>
              </div>
              {generatedAvatarUrl ? (
                <div className="relative">
                  <img src={generatedAvatarUrl} alt="Generated Wingman Avatar" className="w-full max-w-xs mx-auto rounded-2xl shadow-2xl border border-primary/30" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✓ Generated</Badge>
                  </div>
                </div>
              ) : (
                <div className={"w-32 h-32 rounded-3xl bg-gradient-to-br mx-auto flex items-center justify-center text-4xl shadow-xl " + AVATARS.find(a => a.id === avatar)?.color}>
                  {AVATARS.find(a => a.id === avatar)?.emoji}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Social Mode */}
        {step === 5 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-rose-500/10 text-rose-400 border-rose-500/20">Social Mode</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">What Are You Looking For?</h2>
              <p className="text-muted-foreground">Select all that apply. Your Wingman will focus its discovery efforts accordingly.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {SOCIAL_MODES.map(mode => (
                <button key={mode.id}
                  onClick={() => setSocialModes(prev => prev.includes(mode.id) ? prev.filter(m => m !== mode.id) : [...prev, mode.id])}
                  className={"glass-card p-6 text-left transition-all border-2 " + (socialModes.includes(mode.id) ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary/30")}>
                  <div className={"w-12 h-12 rounded-2xl bg-gradient-to-br " + mode.color + " flex items-center justify-center mb-4 text-2xl shadow-lg"}>{mode.emoji}</div>
                  <h3 className="font-bold text-lg mb-1">{mode.label}</h3>
                  <p className="text-sm text-muted-foreground">{mode.desc}</p>
                  {socialModes.includes(mode.id) && <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium"><Check className="w-3 h-3" /> Selected</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Trust Level */}
        {step === 6 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Trust Configuration</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Set Your Default Trust Level</h2>
              <p className="text-muted-foreground">This controls how much information your Wingman shares with new connections. You can change this anytime.</p>
            </div>
            <div className="space-y-3">
              {TRUST_LEVELS.map(({ level, name, desc, color, bg, border }) => (
                <button
                  key={level}
                  onClick={() => setTrustLevel(level)}
                  className={"w-full glass-card p-5 text-left transition-all border-2 flex items-center gap-4 " + (trustLevel === level ? "border-primary shadow-lg shadow-primary/10 bg-gradient-to-r " + bg : "border-transparent hover:border-primary/30")}
                >
                  <div className={"w-12 h-12 rounded-full bg-gradient-to-br " + bg + " border " + border + " flex items-center justify-center font-bold text-lg " + color}>{level}</div>
                  <div className="flex-1">
                    <p className={"font-bold " + color}>{name}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  {trustLevel === level && <Check className={"w-5 h-5 " + color} />}
                </button>
              ))}
            </div>
            <div className="mt-6 glass-card p-4 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Selected: {TRUST_LEVELS.find(t => t.level === trustLevel)?.name}</span> — Your Wingman will use this as the default when meeting new connections. You can set individual trust levels for each connection later.
              </p>
            </div>
          </div>
        )}

        {/* Step 7: Activation Ceremony */}
        {step === 7 && (
          <div className="text-center animate-fade-up">
            <div className={"w-36 h-36 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all " + (activating ? "animate-pulse-glow scale-110" : "hover:scale-105")}>
              {activating ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : (
                <Zap className="w-16 h-16 text-white" />
              )}
            </div>

            {activating ? (
              <>
                <h2 className="font-display text-4xl font-bold mb-4 gradient-text">
                  {ACTIVATION_PHASES[activationPhase]}
                </h2>
                <div className="flex justify-center gap-2 mb-8">
                  {ACTIVATION_PHASES.map((_, i) => (
                    <div key={i} className={"w-2 h-2 rounded-full transition-all " + (i <= activationPhase ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
                <div className="grid sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
                  <div className="glass-card p-4 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Traits Encoded</p>
                    <p className="font-bold text-primary">{Object.keys(traits).length} / 34</p>
                  </div>
                  <div className="glass-card p-4 border border-cyan-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Interests</p>
                    <p className="font-bold text-cyan-400">{interests.length} passions</p>
                  </div>
                  <div className="glass-card p-4 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">Social Modes</p>
                    <p className="font-bold text-emerald-400">{socialModes.length} active</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-4xl font-bold mb-4">Ready to Activate?</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                  Your Wingman <span className="text-primary font-bold">"{wingmanName || "unnamed"}"</span> is ready to be activated. Once live, it will begin discovering compatible connections on your behalf.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left max-w-xl mx-auto">
                  <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Traits Mapped</p>
                    <p className="font-bold text-primary">{Object.keys(traits).length} / 34</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Interests</p>
                    <p className="font-bold text-cyan-400">{interests.length} selected</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground mb-1">Social Modes</p>
                    <p className="font-bold text-emerald-400">{socialModes.length} active</p>
                  </div>
                </div>
                {generatedAvatarUrl && (
                  <div className="mb-8">
                    <img src={generatedAvatarUrl} alt={wingmanName} className="w-24 h-24 rounded-2xl mx-auto shadow-xl border-2 border-primary/40" />
                  </div>
                )}
                <Button className="btn-aurora px-12 py-5 rounded-xl text-lg" onClick={handleActivate}>
                  <Zap className="w-5 h-5 mr-2" /> Activate {wingmanName || "Wingman"}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || activating} className="glass border-border">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < 7 && (
            <Button className="btn-aurora rounded-xl px-8"
              onClick={() => {
                if (step === 3 && interests.length < 3) { toast.error("Select at least 3 interests"); return; }
                if (step === 5 && socialModes.length === 0) { toast.error("Select at least one social mode"); return; }
                setStep(s => s + 1);
              }}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
