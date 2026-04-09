#!/usr/bin/env python3
"""Fix all page files to align with exact backend tRPC procedure names."""
import os

BASE = "/home/ubuntu/wingman-vip/client/src/pages"

def write(filename, content):
    path = os.path.join(BASE, filename)
    with open(path, "w") as f:
        f.write(content.lstrip("\n"))
    size = os.path.getsize(path)
    print(f"Written: {filename} ({size} bytes)")

# ─── ONBOARDING (fixed: wingman.createWingman -> socialMode array, no soulForge.updateTraits) ───
write("Onboarding.tsx", """
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Heart, Star, Shield, Target, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const SOUL_FORGE_TRAITS = [
  { id: "openness", label: "Openness", desc: "Curiosity and openness to new experiences", category: "Core" },
  { id: "conscientiousness", label: "Conscientiousness", desc: "Organization and dependability", category: "Core" },
  { id: "extraversion", label: "Extraversion", desc: "Energy from social interactions", category: "Core" },
  { id: "agreeableness", label: "Agreeableness", desc: "Cooperation and trust in others", category: "Core" },
  { id: "neuroticism", label: "Emotional Stability", desc: "Calmness under pressure", category: "Core" },
  { id: "creativity", label: "Creativity", desc: "Imagination and artistic sense", category: "Expression" },
  { id: "humor", label: "Humor", desc: "Wit and playfulness", category: "Expression" },
  { id: "warmth", label: "Warmth", desc: "Genuine care for others", category: "Social" },
  { id: "empathy", label: "Empathy", desc: "Understanding others feelings", category: "Social" },
  { id: "assertiveness", label: "Assertiveness", desc: "Confidence in expressing views", category: "Social" },
  { id: "adaptability", label: "Adaptability", desc: "Flexibility in changing situations", category: "Resilience" },
  { id: "resilience", label: "Resilience", desc: "Bouncing back from setbacks", category: "Resilience" },
  { id: "ambition", label: "Ambition", desc: "Drive to achieve goals", category: "Drive" },
  { id: "curiosity", label: "Curiosity", desc: "Desire to learn and explore", category: "Drive" },
  { id: "authenticity", label: "Authenticity", desc: "Being true to yourself", category: "Values" },
  { id: "integrity", label: "Integrity", desc: "Honesty and moral principles", category: "Values" },
  { id: "loyalty", label: "Loyalty", desc: "Commitment to relationships", category: "Values" },
  { id: "adventure", label: "Adventurousness", desc: "Seeking new experiences", category: "Lifestyle" },
  { id: "mindfulness", label: "Mindfulness", desc: "Present-moment awareness", category: "Lifestyle" },
  { id: "spontaneity", label: "Spontaneity", desc: "Acting on impulse positively", category: "Lifestyle" },
  { id: "depth", label: "Depth", desc: "Preference for meaningful conversations", category: "Communication" },
  { id: "directness", label: "Directness", desc: "Clear and honest communication", category: "Communication" },
  { id: "listening", label: "Active Listening", desc: "Truly hearing others", category: "Communication" },
  { id: "optimism", label: "Optimism", desc: "Positive outlook on life", category: "Mindset" },
  { id: "pragmatism", label: "Pragmatism", desc: "Practical problem-solving", category: "Mindset" },
  { id: "idealism", label: "Idealism", desc: "Vision for a better world", category: "Mindset" },
  { id: "independence", label: "Independence", desc: "Self-reliance and autonomy", category: "Identity" },
  { id: "collaboration", label: "Collaboration", desc: "Working well with others", category: "Identity" },
  { id: "leadership", label: "Leadership", desc: "Guiding and inspiring others", category: "Identity" },
  { id: "spirituality", label: "Spirituality", desc: "Connection to something greater", category: "Depth" },
  { id: "intellectualism", label: "Intellectualism", desc: "Love of ideas and learning", category: "Depth" },
  { id: "compassion", label: "Compassion", desc: "Deep care for others wellbeing", category: "Heart" },
  { id: "gratitude", label: "Gratitude", desc: "Appreciation for lifes gifts", category: "Heart" },
  { id: "vulnerability", label: "Vulnerability", desc: "Courage to be open and real", category: "Heart" },
];

const INTERESTS = [
  "Technology", "Music", "Art", "Travel", "Fitness", "Cooking", "Reading",
  "Gaming", "Photography", "Film", "Fashion", "Sports", "Nature", "Science",
  "Philosophy", "Business", "Spirituality", "Dance", "Writing", "Volunteering",
];

const SOCIAL_MODES = [
  { id: "friendship", label: "Friendship", emoji: "🤝", desc: "Find genuine friends and companions" },
  { id: "dating", label: "Dating", emoji: "💕", desc: "Discover romantic connections" },
  { id: "business", label: "Business", emoji: "💼", desc: "Build professional relationships" },
  { id: "family", label: "Family", emoji: "🏡", desc: "Connect with family-oriented people" },
];

const AVATARS = [
  { id: "cartoon", label: "Cosmic", emoji: "🌌", color: "from-violet-600 to-purple-800" },
  { id: "realistic", label: "Aurora", emoji: "🌠", color: "from-cyan-500 to-blue-600" },
  { id: "fantasy", label: "Fantasy", emoji: "🔥", color: "from-orange-500 to-red-600" },
  { id: "aspirational", label: "Aspirational", emoji: "⭐", color: "from-yellow-400 to-orange-500" },
];

const STEPS = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Soul Forge", icon: Brain },
  { id: 3, title: "Interests", icon: Heart },
  { id: 4, title: "Avatar", icon: Star },
  { id: 5, title: "Social Mode", icon: Target },
  { id: 6, title: "Trust Config", icon: Shield },
  { id: 7, title: "Activate", icon: Zap },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<"cartoon"|"realistic"|"fantasy"|"aspirational">("cartoon");
  const [wingmanName, setWingmanName] = useState("");
  const [socialModes, setSocialModes] = useState<string[]>(["friendship"]);
  const [trustLevel, setTrustLevel] = useState(2);
  const [activating, setActivating] = useState(false);

  const createWingman = trpc.wingman.createWingman.useMutation();
  const saveTraits = trpc.soulForge.saveTraits.useMutation();
  const saveInterests = trpc.interests.save.useMutation();
  const activateWingman = trpc.wingman.activateWingman.useMutation();

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

  const handleActivate = async () => {
    if (!wingmanName.trim()) { toast.error("Please name your Wingman"); return; }
    setActivating(true);
    try {
      const wingman = await createWingman.mutateAsync({
        wingmanName: wingmanName.trim(),
        avatarStyle: avatar,
        socialMode: socialModes,
        personalityArchetype: "Explorer",
      });
      if (wingman?.id && Object.keys(traits).length > 0) {
        const traitInput = {
          openness: traits.openness || 5, conscientiousness: traits.conscientiousness || 5,
          extraversion: traits.extraversion || 5, agreeableness: traits.agreeableness || 5,
          neuroticism: traits.neuroticism || 5, creativity: traits.creativity || 5,
          humor: traits.humor || 5, warmth: traits.warmth || 5, empathy: traits.empathy || 5,
          assertiveness: traits.assertiveness || 5, adaptability: traits.adaptability || 5,
          resilience: traits.resilience || 5, ambition: traits.ambition || 5,
          curiosity: traits.curiosity || 5, authenticity: traits.authenticity || 5,
          integrity: traits.integrity || 5, loyalty: traits.loyalty || 5,
          adventure: traits.adventure || 5, mindfulness: traits.mindfulness || 5,
          spontaneity: traits.spontaneity || 5, depth: traits.depth || 5,
          directness: traits.directness || 5, listening: traits.listening || 5,
          optimism: traits.optimism || 5, pragmatism: traits.pragmatism || 5,
          idealism: traits.idealism || 5, independence: traits.independence || 5,
          collaboration: traits.collaboration || 5, leadership: traits.leadership || 5,
          spirituality: traits.spirituality || 5, intellectualism: traits.intellectualism || 5,
          compassion: traits.compassion || 5, gratitude: traits.gratitude || 5,
          trust: traits.vulnerability || 5,
        };
        await saveTraits.mutateAsync({ wingmanId: wingman.id, traits: traitInput, selectedStyles: [avatar] });
      }
      if (interests.length > 0) {
        await saveInterests.mutateAsync({ interests });
      }
      await activateWingman.mutateAsync();
      toast.success("Your Wingman is alive!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e: any) {
      toast.error(e?.message || "Activation failed. Please try again.");
      setActivating(false);
    }
  };

  const traitsByCategory = SOUL_FORGE_TRAITS.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof SOUL_FORGE_TRAITS>);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /><div className="aurora-orb aurora-orb-3" /></div>

      <div className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
              <span className="font-display font-bold text-sm gradient-text">Soul Forge</span>
            </div>
            <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1" />
          <div className="flex items-center justify-between mt-2">
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

      <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto relative z-10">
        {step === 1 && (
          <div className="text-center animate-fade-up">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Welcome to <span className="gradient-text">Soul Forge</span></h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              In the next few minutes, you will build your AI personality twin — a Wingman that represents you authentically in the social world.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[{ icon: Brain, title: "34 Traits", desc: "Deep personality mapping" }, { icon: Heart, title: "Your Values", desc: "What matters most to you" }, { icon: Zap, title: "AI Activation", desc: "Your Wingman comes alive" }].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card p-4 text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <Button className="btn-aurora px-10 py-4 rounded-xl text-base" onClick={() => setStep(2)}>
              Begin Soul Forge <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Soul Forge Assessment — 34 Traits</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Map Your Personality DNA</h2>
              <p className="text-muted-foreground">Rate each trait from 1 (low) to 10 (high). Be honest — your Wingman depends on it.</p>
            </div>
            <div className="space-y-8">
              {Object.entries(traitsByCategory).map(([category, categoryTraits]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{category}</h3>
                  <div className="space-y-4">
                    {categoryTraits.map(trait => (
                      <div key={trait.id} className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{trait.label}</p>
                            <p className="text-xs text-muted-foreground">{trait.desc}</p>
                          </div>
                          <span className="text-lg font-bold text-primary w-8 text-center">{traits[trait.id] || 5}</span>
                        </div>
                        <input type="range" min="1" max="10" step="1" value={traits[trait.id] || 5}
                          onChange={e => setTraits(prev => ({ ...prev, [trait.id]: parseInt(e.target.value) }))}
                          className="w-full accent-violet-600 cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>Low</span><span>High</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Your Interests</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">What Lights You Up?</h2>
              <p className="text-muted-foreground">Select at least 3 interests. Your Wingman will use these to find compatible connections.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {INTERESTS.map(interest => (
                <button key={interest}
                  onClick={() => setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])}
                  className={"px-5 py-2.5 rounded-full text-sm font-medium transition-all border " + (interests.includes(interest) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "glass border-border text-muted-foreground hover:text-foreground hover:border-primary/40")}>
                  {interest}
                </button>
              ))}
            </div>
            {interests.length > 0 && <p className="text-center text-sm text-primary mt-6">{interests.length} selected</p>}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20">Wingman Identity</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Design Your Wingman</h2>
              <p className="text-muted-foreground">Choose an avatar style and give your Wingman a name.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {AVATARS.map(av => (
                <button key={av.id} onClick={() => setAvatar(av.id as any)}
                  className={"glass-card p-6 text-center transition-all border-2 " + (avatar === av.id ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary/30")}>
                  <div className={"w-16 h-16 rounded-2xl bg-gradient-to-br " + av.color + " flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg"}>{av.emoji}</div>
                  <p className="font-semibold text-sm">{av.label}</p>
                </button>
              ))}
            </div>
            <div className="glass-card p-6">
              <label className="block text-sm font-medium mb-2">Name Your Wingman</label>
              <input type="text" value={wingmanName} onChange={e => setWingmanName(e.target.value)}
                placeholder="e.g. ARIA, NOVA, ECHO, SAGE..."
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                maxLength={20} />
              <p className="text-xs text-muted-foreground mt-2">This is how your Wingman will introduce itself to others.</p>
            </div>
          </div>
        )}

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
                  className={"glass-card p-6 text-left transition-all border-2 " + (socialModes.includes(mode.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30")}>
                  <div className="text-3xl mb-3">{mode.emoji}</div>
                  <h3 className="font-display font-semibold text-lg mb-1">{mode.label}</h3>
                  <p className="text-sm text-muted-foreground">{mode.desc}</p>
                  {socialModes.includes(mode.id) && <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium"><Check className="w-3 h-3" /> Selected</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Trust Configuration</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Set Your Default Trust Level</h2>
              <p className="text-muted-foreground">This controls how much information your Wingman shares with new connections by default.</p>
            </div>
            <div className="space-y-3">
              {[
                { level: 1, name: "Public", desc: "Open discovery — minimal info shared", color: "text-muted-foreground" },
                { level: 2, name: "Acquaintance", desc: "Basic profile visible to new connections", color: "text-blue-400" },
                { level: 3, name: "Connection", desc: "Shared interests and compatibility data", color: "text-cyan-400" },
                { level: 4, name: "Trusted", desc: "Deep personality insights shared", color: "text-emerald-400" },
                { level: 5, name: "Inner Circle", desc: "Full access — reserved for close connections", color: "text-primary" },
              ].map(({ level, name, desc, color }) => (
                <button key={level} onClick={() => setTrustLevel(level)}
                  className={"w-full glass-card p-5 text-left transition-all border-2 flex items-center gap-4 " + (trustLevel === level ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30")}>
                  <div className={"w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center font-bold " + color}>{level}</div>
                  <div><p className={"font-semibold " + color}>{name}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
                  {trustLevel === level && <Check className="w-5 h-5 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="text-center animate-fade-up">
            <div className={"w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-2xl " + (activating ? "animate-pulse-glow" : "")}>
              <Zap className="w-16 h-16 text-white" />
            </div>
            <h2 className="font-display text-4xl font-bold mb-4">{activating ? "Activating..." : "Ready to Activate?"}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              {activating ? "Your Wingman is coming to life. Calibrating personality matrix..." : `Your Wingman "${wingmanName || "unnamed"}" is ready to be activated.`}
            </p>
            {!activating && (
              <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Traits Mapped</p><p className="font-bold text-primary">{Object.keys(traits).length} / 34</p></div>
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Interests</p><p className="font-bold text-cyan-400">{interests.length} selected</p></div>
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Social Modes</p><p className="font-bold text-emerald-400">{socialModes.length} active</p></div>
              </div>
            )}
            {!activating && (
              <Button className="btn-aurora px-12 py-5 rounded-xl text-lg" onClick={handleActivate}>
                <Zap className="w-5 h-5 mr-2" /> Activate {wingmanName || "Wingman"}
              </Button>
            )}
            {activating && (
              <div className="flex justify-center gap-2">
                {[0,1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: i * 150 + "ms" }} />)}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-12">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="glass border-border">
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
""")

# ─── DASHBOARD (fixed: use wingman.getConnections, wingman.getActivityFeed with input, wingman.activateWingman) ───
write("Dashboard.tsx", """
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Heart, Activity, Users, Shield, Tv, ArrowRight, Bell, Compass, Globe } from "lucide-react";
import { toast } from "sonner";

function CompatibilityMeter({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={"font-bold " + color}>{score}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={"h-full rounded-full transition-all duration-1000 " + color.replace("text-", "bg-")} style={{ width: score + "%" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: activityFeed } = trpc.wingman.getActivityFeed.useQuery({ limit: 20 }, { enabled: isAuthenticated, refetchInterval: 10000 });
  const { data: connections } = trpc.wingman.getConnections.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stories } = trpc.wingman.getStories.useQuery(undefined, { enabled: isAuthenticated });
  const { data: dreamBoard } = trpc.discovery.getDreamBoard.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifications } = trpc.notifications.getAll.useQuery({ limit: 5 }, { enabled: isAuthenticated });

  const activateWingman = trpc.wingman.activateWingman.useMutation({
    onSuccess: () => toast.success("Wingman activated!"),
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const wsUrl = window.location.origin.replace("https://", "wss://").replace("http://", "ws://") + "/ws";
    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "activity") setTickerItems(prev => [data.message, ...prev.slice(0, 19)]);
        } catch {}
      };
    } catch {}
    return () => wsRef.current?.close();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activityFeed) setTickerItems(activityFeed.map((a: any) => a.description));
  }, [activityFeed]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>
        <div className="glass-card p-10 text-center max-w-md relative z-10">
          <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Sign In Required</h2>
          <Button className="btn-aurora mt-4" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!wingman) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="glass-card p-10 text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">No Wingman Yet</h2>
            <p className="text-muted-foreground mb-6">Complete the Soul Forge to activate your AI agent.</p>
            <Link href="/onboarding">
              <Button className="btn-aurora w-full">Start Soul Forge <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span></h1>
            <p className="text-muted-foreground text-sm">Your Wingman is working hard for you</p>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <div className={"w-2 h-2 rounded-full " + (wingman.status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400")} />
            <span className="font-semibold text-sm gradient-text">{wingman.wingmanName}</span>
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{wingman.status}</Badge>
          </div>
        </div>

        <div className="glass-card p-4 mb-6 overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Activity Feed</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {tickerItems.length > 0 ? tickerItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">Your Wingman is initializing...</p>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 holographic">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse-glow">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">{wingman.wingmanName}</h2>
                    <p className="text-xs text-muted-foreground">AI Social Agent • {wingman.personalityArchetype}</p>
                  </div>
                </div>
                {wingman.status !== "active" && (
                  <Button size="sm" className="btn-aurora" onClick={() => activateWingman.mutate()}>
                    <Zap className="w-3.5 h-3.5 mr-1" /> Activate
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Connections", value: wingman.totalConnections || 0, icon: Users, color: "text-cyan-400" },
                  { label: "Introductions", value: wingman.totalIntroductions || 0, icon: Heart, color: "text-rose-400" },
                  { label: "Avg Match", value: (wingman.avgCompatibilityScore || 85) + "%", icon: Shield, color: "text-emerald-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-muted/20">
                    <Icon className={"w-5 h-5 mx-auto mb-1 " + color} />
                    <p className={"font-bold text-lg " + color}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compatibility Meters</h3>
                <CompatibilityMeter score={Math.round(wingman.avgCompatibilityScore || 85)} label="Overall Match Quality" color="text-primary" />
                <CompatibilityMeter score={87} label="Values Alignment" color="text-cyan-400" />
                <CompatibilityMeter score={91} label="Interest Overlap" color="text-emerald-400" />
                <CompatibilityMeter score={78} label="Communication Style" color="text-amber-400" />
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-rose-400" /><h2 className="font-display font-semibold">Dream Board</h2></div>
                <Link href="/dream-board"><button className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(dreamBoard || []).slice(0, 4).map((entry: any, i: number) => (
                  <div key={entry.id || i} className="glass rounded-xl p-3 text-center border border-border hover:border-primary/40 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white">
                      {(entry.targetWingman?.wingmanName || "W")[0]}
                    </div>
                    <p className="text-xs font-medium truncate">{entry.targetWingman?.wingmanName || "Wingman"}</p>
                    <p className="text-[10px] text-primary font-bold">{entry.compatibilityScore || 85}%</p>
                  </div>
                ))}
                {(!dreamBoard || dreamBoard.length === 0) && (
                  <div className="col-span-4 text-center py-6 text-muted-foreground text-sm">Your Wingman is searching for matches...</div>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-amber-400" />
                  <h2 className="font-display font-semibold">Wingman TV</h2>
                  <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">AI Stories</Badge>
                </div>
                <Link href="/wingman-tv"><button className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button></Link>
              </div>
              <div className="space-y-3">
                {(stories || []).slice(0, 3).map((story: any, i: number) => (
                  <div key={story.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Tv className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{story.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{story.summary}</p>
                    </div>
                  </div>
                ))}
                {(!stories || stories.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground text-sm">Stories will appear as your Wingman makes connections...</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold mb-4 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: "/discovery", icon: Compass, label: "Explore Spaces", color: "text-cyan-400" },
                  { href: "/dream-board", icon: Heart, label: "View Dream Board", color: "text-rose-400" },
                  { href: "/trust", icon: Shield, label: "Trust Ladder", color: "text-emerald-400" },
                  { href: "/wingman-tv", icon: Tv, label: "Wingman TV", color: "text-amber-400" },
                  { href: "/travel", icon: Globe, label: "Travel Mode", color: "text-blue-400" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer">
                      <Icon className={"w-4 h-4 " + color} />
                      <span className="text-sm">{label}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm">Recent Connections</h3>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {(connections || []).slice(0, 5).map((conn: any, i: number) => (
                  <div key={conn.id || i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                      {(conn.otherWingman?.wingmanName || "W")[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{conn.otherWingman?.wingmanName || "Wingman"}</p>
                      <p className="text-[10px] text-muted-foreground">{conn.connectionType}</p>
                    </div>
                    <span className="text-[10px] text-primary font-bold ml-auto">{conn.compatibilityScore}%</span>
                  </div>
                ))}
                {(!connections || connections.length === 0) && <p className="text-xs text-muted-foreground text-center py-2">No connections yet</p>}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {(notifications || []).slice(0, 4).map((notif: any, i: number) => (
                  <div key={notif.id || i} className={"p-2.5 rounded-lg text-xs " + (!notif.isRead ? "bg-primary/5 border border-primary/20" : "bg-muted/10")}>
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-1">{notif.message}</p>
                  </div>
                ))}
                {(!notifications || notifications.length === 0) && <p className="text-xs text-muted-foreground text-center py-2">No notifications</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── DISCOVERY (fixed: discovery.getSpaces, discovery.joinSpace, discovery.initiateIntro, discovery.getDreamBoard) ───
write("Discovery.tsx", """
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Users, Heart, Brain, Zap, ArrowRight, Globe } from "lucide-react";
import { toast } from "sonner";

const SPACE_ICONS: Record<string, string> = {
  "Tech Hub": "💻", "Creative Studio": "🎨", "Wellness Garden": "🌿",
  "Business Lounge": "💼", "Adventure Base": "🏔️", "Music Hall": "🎵",
  "Philosophy Circle": "🤔", "Fitness Arena": "💪",
};

export default function Discovery() {
  const { isAuthenticated } = useAuth();
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const { data: spaces } = trpc.discovery.getSpaces.useQuery({ socialMode: selectedMode === "all" ? undefined : selectedMode });
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: dreamBoard } = trpc.discovery.getDreamBoard.useQuery(undefined, { enabled: isAuthenticated });

  const joinSpace = trpc.discovery.joinSpace.useMutation({
    onSuccess: () => toast.success("Your Wingman entered the space and is discovering connections!"),
    onError: () => toast.error("Could not enter space"),
  });

  const initiateIntro = trpc.discovery.initiateIntro.useMutation({
    onSuccess: () => toast.success("Introduction initiated! Your Wingman will handle it."),
    onError: () => toast.error("Could not initiate introduction"),
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Discovery</span> Engine</h1>
            <p className="text-muted-foreground text-sm">Explore virtual spaces and let your Wingman make connections</p>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary animate-spin-slow" />
            <span className="text-sm text-muted-foreground">AI-powered discovery</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "friendship", "dating", "business", "family"].map(mode => (
            <button key={mode} onClick={() => setSelectedMode(mode)}
              className={"px-4 py-2 rounded-full text-sm font-medium transition-all border " + (selectedMode === mode ? "bg-primary text-white border-primary" : "glass border-border text-muted-foreground hover:text-foreground hover:border-primary/40")}>
              {mode === "all" ? "🌐 All Spaces" : mode === "friendship" ? "🤝 Friendship" : mode === "dating" ? "💕 Dating" : mode === "business" ? "💼 Business" : "🏡 Family"}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Virtual Spaces</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(spaces || []).map((space: any) => (
                <div key={space.id} className="glass-card p-5 border border-transparent hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{SPACE_ICONS[space.name] || "🌐"}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" /><span>{space.activeUsers || 0}</span></div>
                  </div>
                  <h3 className="font-display font-semibold mb-1">{space.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{space.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className="text-[10px] bg-muted/30 text-muted-foreground border-border">{space.theme}</Badge>
                    <Button size="sm" className="btn-aurora text-xs px-3 py-1 h-auto"
                      onClick={() => { if (wingman) joinSpace.mutate({ spaceId: space.id }); else toast.error("Activate your Wingman first"); }}>
                      Enter <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!spaces || spaces.length === 0) && (
                <div className="col-span-2 glass-card p-12 text-center">
                  <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading virtual spaces...</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Potential Connections</h2>
            <div className="space-y-3">
              {(dreamBoard || []).slice(0, 6).map((entry: any, i: number) => (
                <div key={entry.id || i} className="glass-card p-4 hover:border-primary/30 transition-all border border-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                      {(entry.targetWingman?.wingmanName || "W")[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{entry.targetWingman?.wingmanName || "Wingman"}</p>
                      <p className="text-xs text-muted-foreground">{entry.connectionType}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-bold text-primary">{entry.compatibilityScore}%</p>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: (entry.compatibilityScore || 80) + "%" }} />
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs glass border-border hover:border-primary/40"
                    onClick={() => initiateIntro.mutate({ targetWingmanId: entry.targetWingmanId })}>
                    <Brain className="w-3 h-3 mr-1" /> Request Introduction
                  </Button>
                </div>
              ))}
              {(!dreamBoard || dreamBoard.length === 0) && (
                <div className="glass-card p-8 text-center">
                  <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Your Wingman is searching for compatible connections...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── TRUST LADDER (fixed: trust.getMyTrustConnections, trust.updateTrustLevel with targetWingmanId + level enum) ───
write("TrustLadder.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, ArrowUp } from "lucide-react";
import { toast } from "sonner";

const TRUST_LEVELS = [
  { level: 1, key: "public" as const, name: "Public", desc: "Open discovery — minimal info shared", color: "text-muted-foreground", bg: "bg-muted/20", border: "border-muted/30" },
  { level: 2, key: "acquaintance" as const, name: "Acquaintance", desc: "Basic profile visible to new connections", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  { level: 3, key: "connection" as const, name: "Connection", desc: "Shared interests and compatibility data", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  { level: 4, key: "trusted" as const, name: "Trusted", desc: "Deep personality insights shared", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  { level: 5, key: "inner_circle" as const, name: "Inner Circle", desc: "Full access — reserved for close connections", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
];

const LEVEL_KEYS = ["public","acquaintance","connection","trusted","inner_circle"] as const;

export default function TrustLadder() {
  const { isAuthenticated } = useAuth();
  const { data: connections, refetch } = trpc.trust.getMyTrustConnections.useQuery(undefined, { enabled: isAuthenticated });
  const updateTrust = trpc.trust.updateTrustLevel.useMutation({
    onSuccess: () => { toast.success("Trust level updated"); refetch(); },
    onError: () => toast.error("Failed to update trust level"),
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Trust</span> Ladder</h1>
          <p className="text-muted-foreground text-sm">Manage trust levels for all your connections</p>
        </div>

        <div className="grid sm:grid-cols-5 gap-3 mb-10">
          {TRUST_LEVELS.map(({ level, name, color, bg, border }) => (
            <div key={level} className={"glass-card p-4 text-center border " + border}>
              <div className={"w-10 h-10 rounded-full " + bg + " flex items-center justify-center mx-auto mb-2 text-lg font-bold " + color}>{level}</div>
              <p className={"text-xs font-semibold " + color}>{name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {(connections || []).filter((c: any) => c.trustLevel === level).length} connections
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {TRUST_LEVELS.map(({ level, key, name, desc, color, bg, border }) => {
            const levelConns = (connections || []).filter((c: any) => c.trustLevel === level);
            return (
              <div key={level} className={"glass-card p-6 border " + border}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={"w-10 h-10 rounded-full " + bg + " flex items-center justify-center font-bold " + color}>{level}</div>
                  <div>
                    <h2 className={"font-display font-semibold " + color}>{name}</h2>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Badge className={"ml-auto text-xs " + bg + " " + color + " border-0"}>{levelConns.length} connections</Badge>
                </div>
                {levelConns.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {levelConns.map((conn: any) => (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {(conn.otherWingman?.wingmanName || "W")[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{conn.otherWingman?.wingmanName}</p>
                          <p className="text-xs text-muted-foreground">{conn.connectionType} • {conn.compatibilityScore}% match</p>
                        </div>
                        <div className="flex gap-1 ml-auto">
                          {level > 1 && (
                            <button onClick={() => updateTrust.mutate({ targetWingmanId: conn.otherWingman?.id, level: LEVEL_KEYS[level - 2] })}
                              className="p-1 rounded hover:bg-muted/20 transition-colors" title="Lower trust">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                          {level < 5 && (
                            <button onClick={() => updateTrust.mutate({ targetWingmanId: conn.otherWingman?.id, level: LEVEL_KEYS[level] })}
                              className="p-1 rounded hover:bg-muted/20 transition-colors" title="Raise trust">
                              <ArrowUp className="w-3 h-3 text-primary" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">No connections at this trust level yet</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── SOCIAL LOUNGE (fixed: discovery.getSpaces, wingman.getConnections) ───
write("SocialLounge.tsx", """
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Globe, Heart } from "lucide-react";
import { toast } from "sonner";

const SOCIAL_MODES = [
  { id: "friendship", label: "Friendship", emoji: "🤝", color: "text-blue-400" },
  { id: "dating", label: "Dating", emoji: "💕", color: "text-rose-400" },
  { id: "business", label: "Business", emoji: "💼", color: "text-amber-400" },
  { id: "family", label: "Family", emoji: "🏡", color: "text-emerald-400" },
];

export default function SocialLounge() {
  const { isAuthenticated } = useAuth();
  const [activeMode, setActiveMode] = useState("friendship");
  const { data: spaces } = trpc.discovery.getSpaces.useQuery({ socialMode: activeMode });
  const { data: connections } = trpc.wingman.getConnections.useQuery(undefined, { enabled: isAuthenticated });
  const joinSpace = trpc.discovery.joinSpace.useMutation({
    onSuccess: () => toast.success("Wingman entered the lounge!"),
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Social</span> Lounge</h1>
          <p className="text-muted-foreground text-sm">Your Wingman social headquarters</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {SOCIAL_MODES.map(({ id, label, emoji, color }) => (
            <button key={id} onClick={() => setActiveMode(id)}
              className={"glass-card p-4 text-center transition-all border-2 " + (activeMode === id ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30")}>
              <div className="text-2xl mb-2">{emoji}</div>
              <p className={"font-semibold text-sm " + (activeMode === id ? color : "text-muted-foreground")}>{label}</p>
            </button>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Active Spaces</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(spaces || []).map((space: any) => (
                <div key={space.id} className="glass-card p-5 border border-transparent hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{space.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{space.activeUsers || 0}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{space.description}</p>
                  <Button size="sm" className="btn-aurora w-full text-xs" onClick={() => joinSpace.mutate({ spaceId: space.id })}>Enter Space</Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Your Connections</h2>
            <div className="space-y-3">
              {(connections || []).filter((c: any) => c.connectionType === activeMode).map((conn: any) => (
                <div key={conn.id} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                      {(conn.otherWingman?.wingmanName || "W")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{conn.otherWingman?.wingmanName}</p>
                      <p className="text-xs text-muted-foreground">{conn.compatibilityScore}% compatible</p>
                    </div>
                    <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">Level {conn.trustLevel}</Badge>
                  </div>
                </div>
              ))}
              {(connections || []).filter((c: any) => c.connectionType === activeMode).length === 0 && (
                <div className="glass-card p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No {activeMode} connections yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── TRAVEL (fixed: travel.recordTravel, travel.getActiveTravel, travel.getFriendsNearby) ───
write("Travel.tsx", """
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Travel() {
  const { isAuthenticated } = useAuth();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const { data: activeTravel } = trpc.travel.getActiveTravel.useQuery(undefined, { enabled: isAuthenticated });
  const { data: nearbyConnections } = trpc.travel.getFriendsNearby.useQuery(
    { city },
    { enabled: isAuthenticated && city.length > 2 }
  );

  const recordTravel = trpc.travel.recordTravel.useMutation({
    onSuccess: () => { toast.success("Travel mode activated! Your Wingman will find connections in " + city); setCity(""); setCountry(""); },
    onError: () => toast.error("Failed to activate travel mode"),
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Travel</span> Intelligence</h1>
          <p className="text-muted-foreground text-sm">Let your Wingman find connections wherever you go</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Plane className="w-4 h-4 text-blue-400" /> Activate Travel Mode</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. New York, Tokyo, London..."
                  className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Country (optional)</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. USA, Japan, UK..."
                  className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <Button className="btn-aurora w-full"
                onClick={() => { if (!city) { toast.error("Enter a city"); return; } recordTravel.mutate({ city, country: country || undefined }); }}>
                <Plane className="w-4 h-4 mr-2" /> Activate Travel Mode
              </Button>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Connections in {city || "Your City"}</h2>
            {city.length > 2 ? (
              <div className="space-y-3">
                {(nearbyConnections || []).map((conn: any, i: number) => (
                  <div key={conn.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                      {(conn.wingmanName || "W")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{conn.wingmanName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {conn.city}</p>
                    </div>
                    <Badge className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Nearby</Badge>
                  </div>
                ))}
                {(!nearbyConnections || nearbyConnections.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No connections found in {city} yet</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8"><MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Enter a city to find nearby connections</p></div>
            )}
          </div>
        </div>
        {activeTravel && (
          <div className="mt-8">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" /> Current Travel</h2>
            <div className="glass-card p-5 flex items-center gap-4">
              <Plane className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="font-semibold">{activeTravel.city}{activeTravel.country ? ", " + activeTravel.country : ""}</h3>
                <p className="text-xs text-muted-foreground">Travel mode active</p>
              </div>
              <Badge className="ml-auto bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
""")

# ─── EVENTS (fixed: events.getConferences, events.registerForConference) ───
write("Events.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Events() {
  const { isAuthenticated } = useAuth();
  const { data: conferences } = trpc.events.getConferences.useQuery();
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });

  const register = trpc.events.registerForConference.useMutation({
    onSuccess: () => toast.success("Registered! Your Wingman will begin matching you with attendees."),
    onError: () => toast.error("Registration failed"),
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Conference</span> Matching</h1>
          <p className="text-muted-foreground text-sm">Your Wingman pre-matches you with attendees before you arrive</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(conferences || []).map((conf: any) => (
            <div key={conf.id} className="glass-card p-6 border border-transparent hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{conf.eventType}</Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="w-3 h-3" />{conf.attendeeCount || 0}</div>
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{conf.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{conf.description}</p>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span>{conf.startDate ? new Date(conf.startDate).toLocaleDateString() : "TBD"}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /><span>{conf.location || "Virtual"}</span></div>
              </div>
              <Button size="sm" className="btn-aurora w-full text-xs"
                onClick={() => { if (!wingman) { toast.error("Activate your Wingman first"); return; } register.mutate({ conferenceId: conf.id, connectionGoals: { networking: true, collaboration: true } }); }}>
                <Zap className="w-3 h-3 mr-1" /> Register with Wingman
              </Button>
            </div>
          ))}
          {(!conferences || conferences.length === 0) && (
            <div className="col-span-3 glass-card p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming conferences. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── PROFILE (fixed: no connections router, use wingman.getConnections, no soulForge.getMyAssessment -> soulForge.getTraits) ───
write("Profile.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: traits } = trpc.soulForge.getTraits.useQuery(undefined, { enabled: isAuthenticated });
  const { data: connections } = trpc.wingman.getConnections.useQuery(undefined, { enabled: isAuthenticated });

  const verificationTiers = [
    { tier: "bronze", label: "Bronze", emoji: "🥉", unlocked: true },
    { tier: "silver", label: "Silver", emoji: "🥈", unlocked: (connections || []).length >= 5 },
    { tier: "gold", label: "Gold", emoji: "🥇", unlocked: (connections || []).length >= 20 },
    { tier: "platinum", label: "Platinum", emoji: "💎", unlocked: (connections || []).length >= 50 },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Profile</span></h1>
          <p className="text-muted-foreground text-sm">Your identity and Wingman configuration</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white animate-pulse-glow">
              {user?.name?.[0]?.toUpperCase() || "W"}
            </div>
            <h2 className="font-display font-bold text-xl mb-1">{user?.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {verificationTiers.filter(t => t.unlocked).map(({ tier, label, emoji }) => (
                <div key={tier} className={"badge-" + tier + " px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"}>
                  <span>{emoji}</span> {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 rounded-xl bg-muted/20"><p className="font-bold text-primary">{(connections || []).length}</p><p className="text-[10px] text-muted-foreground">Connections</p></div>
              <div className="p-2 rounded-xl bg-muted/20"><p className="font-bold text-cyan-400">{wingman?.totalIntroductions || 0}</p><p className="text-[10px] text-muted-foreground">Intros</p></div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> My Wingman</h2>
            {wingman ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-lg font-bold text-white">
                    {wingman.wingmanName?.[0] || "W"}
                  </div>
                  <div>
                    <p className="font-bold">{wingman.wingmanName}</p>
                    <p className="text-xs text-muted-foreground">{wingman.personalityArchetype}</p>
                  </div>
                  <Badge className={"ml-auto text-[10px] " + (wingman.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted/30 text-muted-foreground border-border")}>
                    {wingman.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Avatar Style</span><span>{wingman.avatarStyle}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg Match</span><span className="text-emerald-400">{Math.round(wingman.avgCompatibilityScore || 85)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Social Mode</span><span>{Array.isArray(wingman.socialMode) ? (wingman.socialMode as string[]).join(", ") : wingman.socialMode}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6"><Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No Wingman yet</p></div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Soul Forge</h2>
            {traits ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">Top personality traits</p>
                {Object.entries(traits.traits || {}).slice(0, 8).map(([trait, score]: [string, any]) => (
                  <div key={trait}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground capitalize">{trait}</span>
                      <span className="text-foreground">{score}/10</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: (score * 10) + "%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6"><Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Complete Soul Forge assessment</p></div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── WINGMAN TV (fixed: wingman.getStories no input, wingman.generateStory) ───
write("WingmanTV.tsx", """
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, Play, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function WingmanTV() {
  const { isAuthenticated } = useAuth();
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: stories, refetch } = trpc.wingman.getStories.useQuery(undefined, { enabled: isAuthenticated });
  const generateStory = trpc.wingman.generateStory.useMutation({
    onSuccess: () => { toast.success("New story generated!"); refetch(); },
    onError: () => toast.error("Story generation failed"),
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Wingman</span> TV</h1>
            <p className="text-muted-foreground text-sm">AI-generated stories of your connection adventures</p>
          </div>
          <Button className="btn-aurora" onClick={() => generateStory.mutate()} disabled={generateStory.isPending}>
            {generateStory.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Generate Story
          </Button>
        </div>

        {stories && stories.length > 0 && (
          <div className="glass-card p-8 mb-8 holographic">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">Featured Episode</Badge>
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Tv className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold mb-2">{stories[0].title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{stories[0].summary}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPlayingId(playingId === stories[0].id ? null : stories[0].id)}
                    className="btn-aurora px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <Play className="w-4 h-4" /> {playingId === stories[0].id ? "Playing..." : "Watch Episode"}
                  </button>
                  <span className="text-xs text-muted-foreground">{new Date(stories[0].createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stories || []).slice(1).map((story: any) => (
            <div key={story.id} className="glass-card p-5 hover:border-primary/30 transition-all border border-transparent cursor-pointer"
              onClick={() => setPlayingId(playingId === story.id ? null : story.id)}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 shadow-md">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-semibold mb-2 line-clamp-2">{story.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{story.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{new Date(story.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1 text-amber-400"><Play className="w-3 h-3" /><span className="text-[10px]">Watch</span></div>
              </div>
              {playingId === story.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">{story.summary}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: i * 150 + "ms" }} />)}
                    <span className="text-[10px] text-amber-400 ml-1">Playing...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!stories || stories.length === 0) && (
            <div className="col-span-3 glass-card p-16 text-center">
              <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">No Episodes Yet</h3>
              <p className="text-muted-foreground mb-6">Generate your first Wingman TV episode to see your connection adventures come to life.</p>
              <Button className="btn-aurora" onClick={() => generateStory.mutate()}><Zap className="w-4 h-4 mr-2" /> Generate First Episode</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── DREAM BOARD (fixed: discovery.getDreamBoard no input, discovery.initiateIntro) ───
write("DreamBoard.tsx", """
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Zap } from "lucide-react";
import { toast } from "sonner";

export default function DreamBoard() {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState("all");

  const { data: dreamBoard } = trpc.discovery.getDreamBoard.useQuery(undefined, { enabled: isAuthenticated });
  const initiateIntro = trpc.discovery.initiateIntro.useMutation({
    onSuccess: () => toast.success("Introduction initiated! Your Wingman will handle it."),
    onError: () => toast.error("Failed to initiate introduction"),
  });

  const filtered = (dreamBoard || []).filter((entry: any) =>
    filter === "all" || entry.connectionType === filter
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Dream</span> Board</h1>
            <p className="text-muted-foreground text-sm">Your curated gallery of potential connections</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>{(dreamBoard || []).length} potential connections</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "friendship", "dating", "business", "family"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-4 py-2 rounded-full text-sm font-medium transition-all border " + (filter === f ? "bg-primary text-white border-primary" : "glass border-border text-muted-foreground hover:text-foreground hover:border-primary/40")}>
              {f === "all" ? "All" : f === "friendship" ? "🤝 Friendship" : f === "dating" ? "💕 Dating" : f === "business" ? "💼 Business" : "🏡 Family"}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((entry: any, i: number) => (
            <div key={entry.id || i} className="glass-card p-5 border border-transparent hover:border-primary/30 transition-all group">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto text-2xl font-bold text-white shadow-lg">
                  {(entry.targetWingman?.wingmanName || "W")[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  {entry.compatibilityScore || 85}
                </div>
              </div>
              <div className="text-center mb-3">
                <h3 className="font-display font-semibold">{entry.targetWingman?.wingmanName || "Wingman"}</h3>
                <p className="text-xs text-muted-foreground capitalize">{entry.connectionType}</p>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="text-primary font-bold">{entry.compatibilityScore || 85}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: (entry.compatibilityScore || 85) + "%" }} />
                </div>
              </div>
              {entry.sharedTraits && entry.sharedTraits.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(entry.sharedTraits as string[]).slice(0, 3).map((trait: string) => (
                    <span key={trait} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{trait}</span>
                  ))}
                </div>
              )}
              <Button size="sm" className="w-full text-xs btn-aurora opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => initiateIntro.mutate({ targetWingmanId: entry.targetWingmanId })}>
                <Zap className="w-3 h-3 mr-1" /> Request Intro
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-4 glass-card p-16 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-xl mb-2">Dream Board is Empty</h3>
              <p className="text-muted-foreground mb-6">Your Wingman is searching for compatible connections. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── ADMIN (fixed: admin.getStats, admin.getRecentUsers, admin.getActiveWingmen) ───
write("Admin.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Users, Brain, Activity, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: recentUsers } = trpc.admin.getRecentUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: activeWingmen } = trpc.admin.getActiveWingmen.useQuery({ limit: 10 }, { enabled: isAuthenticated && user?.role === "admin" });

  useEffect(() => { if (isAuthenticated && user?.role !== "admin") navigate("/dashboard"); }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Admin</span> Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform monitoring and management</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
            { label: "Active Wingmen", value: stats?.activeWingmen || 0, icon: Brain, color: "text-cyan-400" },
            { label: "Total Connections", value: stats?.totalConnections || 0, icon: Activity, color: "text-emerald-400" },
            { label: "Stories Generated", value: stats?.storiesGenerated || 0, icon: TrendingUp, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3"><Icon className={"w-5 h-5 " + color} /><Badge className="text-[10px] bg-muted/30 text-muted-foreground border-border">30d</Badge></div>
              <p className={"font-display text-2xl font-bold " + color}>{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Recent Users</h2>
            <div className="space-y-3">
              {(recentUsers || []).map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">{(u.name || "U")[0]}</div>
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{u.name || "Unknown"}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div>
                  <Badge className={"ml-auto text-[10px] " + (u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border")}>{u.role}</Badge>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400" /> Active Wingmen</h2>
            <div className="space-y-3">
              {(activeWingmen || []).map((w: any) => (
                <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/10">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">{(w.wingmanName || "W")[0]}</div>
                  <div className="min-w-0"><p className="text-sm font-medium">{w.wingmanName}</p><p className="text-xs text-muted-foreground">{w.personalityArchetype} • {w.totalConnections} connections</p></div>
                  <div className="flex items-center gap-1 ml-auto"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[10px] text-green-400">Active</span></div>
                </div>
              ))}
              {(!activeWingmen || activeWingmen.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No active Wingmen</p>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

print("\\nAll pages fixed and written!")
