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

const TRAIT_KEYS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalDepth', 'socialEnergy', 'practicalVsImaginative', 'headVsHeart', 'structuredVsFlexible', 'motivationStyle', 'growthMindset', 'purposeFocus', 'honestyOpenness', 'emotionalAwareness', 'socialConfidence', 'flexibility', 'reliability', 'curiosity', 'formality', 'directness', 'humor', 'warmth', 'responseSpeed', 'adventurousness', 'researchMindset', 'intuition', 'teamwork', 'initiative', 'imagination', 'attentionToDetail', 'resilience', 'adaptability', 'independence', 'trust'] as const;

const TRAIT_LABELS: Record<string, string> = {'openness': 'Openness', 'conscientiousness': 'Conscientiousness', 'extraversion': 'Extraversion', 'agreeableness': 'Agreeableness', 'emotionalDepth': 'Emotional Depth', 'socialEnergy': 'Social Energy', 'practicalVsImaginative': 'Practical vs Imaginative', 'headVsHeart': 'Head vs Heart', 'structuredVsFlexible': 'Structured vs Flexible', 'motivationStyle': 'Motivation Style', 'growthMindset': 'Growth Mindset', 'purposeFocus': 'Purpose Focus', 'honestyOpenness': 'Honesty & Openness', 'emotionalAwareness': 'Emotional Awareness', 'socialConfidence': 'Social Confidence', 'flexibility': 'Flexibility', 'reliability': 'Reliability', 'curiosity': 'Curiosity', 'formality': 'Formality', 'directness': 'Directness', 'humor': 'Humor', 'warmth': 'Warmth', 'responseSpeed': 'Response Speed', 'adventurousness': 'Adventurousness', 'researchMindset': 'Research Mindset', 'intuition': 'Intuition', 'teamwork': 'Teamwork', 'initiative': 'Initiative', 'imagination': 'Imagination', 'attentionToDetail': 'Attention to Detail', 'resilience': 'Resilience', 'adaptability': 'Adaptability', 'independence': 'Independence', 'trust': 'Trust'};
const TRAIT_DESCS: Record<string, string> = {'openness': 'Curiosity and openness to new experiences', 'conscientiousness': 'Organization and dependability', 'extraversion': 'Energy from social interactions', 'agreeableness': 'Cooperation and trust in others', 'emotionalDepth': 'Depth of emotional experience', 'socialEnergy': 'Energy level in social situations', 'practicalVsImaginative': 'Preference for practical vs creative thinking', 'headVsHeart': 'Logic vs emotion in decision making', 'structuredVsFlexible': 'Preference for structure vs spontaneity', 'motivationStyle': 'What drives you to take action', 'growthMindset': 'Belief in ability to grow and learn', 'purposeFocus': 'Clarity of life purpose and direction', 'honestyOpenness': 'Transparency and honesty with others', 'emotionalAwareness': 'Awareness of your own emotions', 'socialConfidence': 'Confidence in social situations', 'flexibility': 'Ability to adapt to change', 'reliability': 'Consistency and dependability', 'curiosity': 'Desire to learn and explore', 'formality': 'Preference for formal vs casual interactions', 'directness': 'Clear and honest communication', 'humor': 'Wit and playfulness', 'warmth': 'Genuine care for others', 'responseSpeed': 'How quickly you respond and decide', 'adventurousness': 'Seeking new experiences', 'researchMindset': 'Tendency to research before deciding', 'intuition': 'Trusting gut feelings', 'teamwork': 'Working well with others', 'initiative': 'Taking action without being asked', 'imagination': 'Creative and imaginative thinking', 'attentionToDetail': 'Focus on details and precision', 'resilience': 'Bouncing back from setbacks', 'adaptability': 'Adjusting to new situations', 'independence': 'Self-reliance and autonomy', 'trust': 'Openness and vulnerability with others'};
const TRAIT_CATEGORIES: Record<string, string[]> = {'Core Personality': ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalDepth'], 'Social Style': ['socialEnergy', 'socialConfidence', 'formality', 'directness', 'warmth', 'humor'], 'Thinking Style': ['practicalVsImaginative', 'headVsHeart', 'structuredVsFlexible', 'researchMindset', 'intuition'], 'Motivation & Drive': ['motivationStyle', 'growthMindset', 'purposeFocus', 'initiative', 'imagination'], 'Emotional Intelligence': ['honestyOpenness', 'emotionalAwareness', 'flexibility', 'reliability', 'resilience', 'adaptability'], 'Social Dynamics': ['curiosity', 'adventurousness', 'teamwork', 'independence', 'trust', 'attentionToDetail', 'responseSpeed']};

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
  { id: "cartoon" as const, label: "Cosmic", emoji: "🌌", color: "from-violet-600 to-purple-800" },
  { id: "realistic" as const, label: "Aurora", emoji: "🌠", color: "from-cyan-500 to-blue-600" },
  { id: "fantasy" as const, label: "Fantasy", emoji: "🔥", color: "from-orange-500 to-red-600" },
  { id: "aspirational" as const, label: "Aspirational", emoji: "⭐", color: "from-yellow-400 to-orange-500" },
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
  const [avatar, setAvatar] = useState<"cartoon"|"realistic"|"fantasy"|"aspirational">("cartoon");
  const [wingmanName, setWingmanName] = useState("");
  const [socialModes, setSocialModes] = useState<string[]>(["friendship"]);
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
      const result = await createWingman.mutateAsync({
        wingmanName: wingmanName.trim(),
        avatarStyle: avatar,
        socialMode: socialModes,
        personalityArchetype: "Explorer",
      });
      const wingmanId = result.wingmanId;
      if (wingmanId && Object.keys(traits).length > 0) {
        const traitInput = {
          "openness": traits["openness"] ?? 50,
          "conscientiousness": traits["conscientiousness"] ?? 50,
          "extraversion": traits["extraversion"] ?? 50,
          "agreeableness": traits["agreeableness"] ?? 50,
          "emotionalDepth": traits["emotionalDepth"] ?? 50,
          "socialEnergy": traits["socialEnergy"] ?? 50,
          "practicalVsImaginative": traits["practicalVsImaginative"] ?? 50,
          "headVsHeart": traits["headVsHeart"] ?? 50,
          "structuredVsFlexible": traits["structuredVsFlexible"] ?? 50,
          "motivationStyle": traits["motivationStyle"] ?? 50,
          "growthMindset": traits["growthMindset"] ?? 50,
          "purposeFocus": traits["purposeFocus"] ?? 50,
          "honestyOpenness": traits["honestyOpenness"] ?? 50,
          "emotionalAwareness": traits["emotionalAwareness"] ?? 50,
          "socialConfidence": traits["socialConfidence"] ?? 50,
          "flexibility": traits["flexibility"] ?? 50,
          "reliability": traits["reliability"] ?? 50,
          "curiosity": traits["curiosity"] ?? 50,
          "formality": traits["formality"] ?? 50,
          "directness": traits["directness"] ?? 50,
          "humor": traits["humor"] ?? 50,
          "warmth": traits["warmth"] ?? 50,
          "responseSpeed": traits["responseSpeed"] ?? 50,
          "adventurousness": traits["adventurousness"] ?? 50,
          "researchMindset": traits["researchMindset"] ?? 50,
          "intuition": traits["intuition"] ?? 50,
          "teamwork": traits["teamwork"] ?? 50,
          "initiative": traits["initiative"] ?? 50,
          "imagination": traits["imagination"] ?? 50,
          "attentionToDetail": traits["attentionToDetail"] ?? 50,
          "resilience": traits["resilience"] ?? 50,
          "adaptability": traits["adaptability"] ?? 50,
          "independence": traits["independence"] ?? 50,
          "trust": traits["trust"] ?? 50,
        };
        await saveTraits.mutateAsync({ wingmanId, traits: traitInput, selectedStyles: [avatar] });
      }
      if (interests.length > 0) {
        const interestObjects = interests.map(i => ({ category: "General", interest: i }));
        await saveInterests.mutateAsync({ interests: interestObjects });
      }
      await activateWingman.mutateAsync({ wingmanId });
      toast.success("Your Wingman is alive!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e: any) {
      toast.error(e?.message || "Activation failed. Please try again.");
      setActivating(false);
    }
  };

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
              <p className="text-muted-foreground">Rate each trait from 0 to 100. Be honest — your Wingman depends on it.</p>
            </div>
            <div className="space-y-8">
              {Object.entries(TRAIT_CATEGORIES).map(([category, categoryTraits]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{category}</h3>
                  <div className="space-y-4">
                    {categoryTraits.map(traitKey => (
                      <div key={traitKey} className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{TRAIT_LABELS[traitKey] || traitKey}</p>
                            <p className="text-xs text-muted-foreground">{TRAIT_DESCS[traitKey] || ""}</p>
                          </div>
                          <span className="text-lg font-bold text-primary w-10 text-center">{traits[traitKey] ?? 50}</span>
                        </div>
                        <input type="range" min="0" max="100" step="5" value={traits[traitKey] ?? 50}
                          onChange={e => setTraits(prev => ({ ...prev, [traitKey]: parseInt(e.target.value) }))}
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
                <button key={av.id} onClick={() => setAvatar(av.id)}
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
              <p className="text-muted-foreground">This controls how much information your Wingman shares with new connections.</p>
            </div>
            <div className="space-y-3">
              {[
                { level: 1, name: "Public", desc: "Open discovery — minimal info shared", color: "text-muted-foreground" },
                { level: 2, name: "Acquaintance", desc: "Basic profile visible to new connections", color: "text-blue-400" },
                { level: 3, name: "Connection", desc: "Shared interests and compatibility data", color: "text-cyan-400" },
                { level: 4, name: "Trusted", desc: "Deep personality insights shared", color: "text-emerald-400" },
                { level: 5, name: "Inner Circle", desc: "Full access — reserved for close connections", color: "text-primary" },
              ].map(({ level, name, desc, color }) => (
                <div key={level} className={"w-full glass-card p-5 text-left transition-all border-2 flex items-center gap-4 border-transparent hover:border-primary/30"}>
                  <div className={"w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center font-bold " + color}>{level}</div>
                  <div><p className={"font-semibold " + color}>{name}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
                </div>
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
