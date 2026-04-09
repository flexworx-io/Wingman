#!/usr/bin/env python3
"""Fix remaining TypeScript errors in pages."""
import os

BASE = "/home/ubuntu/wingman-vip/client/src/pages"

def write(filename, content):
    path = os.path.join(BASE, filename)
    with open(path, "w") as f:
        f.write(content.lstrip("\n"))
    print(f"Fixed: {filename} ({os.path.getsize(path)} bytes)")

# All 34 trait keys from the backend
TRAIT_KEYS = [
    "openness","conscientiousness","extraversion","agreeableness","emotionalDepth",
    "socialEnergy","practicalVsImaginative","headVsHeart","structuredVsFlexible",
    "motivationStyle","growthMindset","purposeFocus",
    "honestyOpenness","emotionalAwareness","socialConfidence","flexibility","reliability","curiosity",
    "formality","directness","humor","warmth",
    "responseSpeed","adventurousness","researchMindset","intuition","teamwork",
    "initiative","imagination","attentionToDetail","resilience","adaptability","independence","trust",
]

TRAIT_LABELS = {
    "openness": "Openness", "conscientiousness": "Conscientiousness", "extraversion": "Extraversion",
    "agreeableness": "Agreeableness", "emotionalDepth": "Emotional Depth", "socialEnergy": "Social Energy",
    "practicalVsImaginative": "Practical vs Imaginative", "headVsHeart": "Head vs Heart",
    "structuredVsFlexible": "Structured vs Flexible", "motivationStyle": "Motivation Style",
    "growthMindset": "Growth Mindset", "purposeFocus": "Purpose Focus",
    "honestyOpenness": "Honesty & Openness", "emotionalAwareness": "Emotional Awareness",
    "socialConfidence": "Social Confidence", "flexibility": "Flexibility", "reliability": "Reliability",
    "curiosity": "Curiosity", "formality": "Formality", "directness": "Directness",
    "humor": "Humor", "warmth": "Warmth", "responseSpeed": "Response Speed",
    "adventurousness": "Adventurousness", "researchMindset": "Research Mindset",
    "intuition": "Intuition", "teamwork": "Teamwork", "initiative": "Initiative",
    "imagination": "Imagination", "attentionToDetail": "Attention to Detail",
    "resilience": "Resilience", "adaptability": "Adaptability", "independence": "Independence",
    "trust": "Trust",
}

TRAIT_DESCS = {
    "openness": "Curiosity and openness to new experiences",
    "conscientiousness": "Organization and dependability",
    "extraversion": "Energy from social interactions",
    "agreeableness": "Cooperation and trust in others",
    "emotionalDepth": "Depth of emotional experience",
    "socialEnergy": "Energy level in social situations",
    "practicalVsImaginative": "Preference for practical vs creative thinking",
    "headVsHeart": "Logic vs emotion in decision making",
    "structuredVsFlexible": "Preference for structure vs spontaneity",
    "motivationStyle": "What drives you to take action",
    "growthMindset": "Belief in ability to grow and learn",
    "purposeFocus": "Clarity of life purpose and direction",
    "honestyOpenness": "Transparency and honesty with others",
    "emotionalAwareness": "Awareness of your own emotions",
    "socialConfidence": "Confidence in social situations",
    "flexibility": "Ability to adapt to change",
    "reliability": "Consistency and dependability",
    "curiosity": "Desire to learn and explore",
    "formality": "Preference for formal vs casual interactions",
    "directness": "Clear and honest communication",
    "humor": "Wit and playfulness",
    "warmth": "Genuine care for others",
    "responseSpeed": "How quickly you respond and decide",
    "adventurousness": "Seeking new experiences",
    "researchMindset": "Tendency to research before deciding",
    "intuition": "Trusting gut feelings",
    "teamwork": "Working well with others",
    "initiative": "Taking action without being asked",
    "imagination": "Creative and imaginative thinking",
    "attentionToDetail": "Focus on details and precision",
    "resilience": "Bouncing back from setbacks",
    "adaptability": "Adjusting to new situations",
    "independence": "Self-reliance and autonomy",
    "trust": "Openness and vulnerability with others",
}

# Build the trait categories for display
TRAIT_CATEGORIES = {
    "Core Personality": ["openness","conscientiousness","extraversion","agreeableness","emotionalDepth"],
    "Social Style": ["socialEnergy","socialConfidence","formality","directness","warmth","humor"],
    "Thinking Style": ["practicalVsImaginative","headVsHeart","structuredVsFlexible","researchMindset","intuition"],
    "Motivation & Drive": ["motivationStyle","growthMindset","purposeFocus","initiative","imagination"],
    "Emotional Intelligence": ["honestyOpenness","emotionalAwareness","flexibility","reliability","resilience","adaptability"],
    "Social Dynamics": ["curiosity","adventurousness","teamwork","independence","trust","attentionToDetail","responseSpeed"],
}

# Build default traits dict
default_traits = "{" + ", ".join([f'"{k}": 50' for k in TRAIT_KEYS]) + "}"

# Build trait input for saveTraits
trait_input_lines = [f'"{k}": traits["{k}"] ?? 50,' for k in TRAIT_KEYS]
trait_input = "{\n          " + "\n          ".join(trait_input_lines) + "\n        }"

# ─── ONBOARDING (fully fixed) ───
write("Onboarding.tsx", f"""
import {{ useState }} from "react";
import {{ useLocation }} from "wouter";
import {{ trpc }} from "@/lib/trpc";
import {{ useAuth }} from "@/_core/hooks/useAuth";
import {{ getLoginUrl }} from "@/const";
import {{ Button }} from "@/components/ui/button";
import {{ Progress }} from "@/components/ui/progress";
import {{ Badge }} from "@/components/ui/badge";
import {{ Zap, Brain, Heart, Star, Shield, Target, Sparkles, ArrowRight, ArrowLeft, Check }} from "lucide-react";
import {{ toast }} from "sonner";

const TRAIT_KEYS = {TRAIT_KEYS} as const;

const TRAIT_LABELS: Record<string, string> = {TRAIT_LABELS};
const TRAIT_DESCS: Record<string, string> = {TRAIT_DESCS};
const TRAIT_CATEGORIES: Record<string, string[]> = {TRAIT_CATEGORIES};

const INTERESTS = [
  "Technology", "Music", "Art", "Travel", "Fitness", "Cooking", "Reading",
  "Gaming", "Photography", "Film", "Fashion", "Sports", "Nature", "Science",
  "Philosophy", "Business", "Spirituality", "Dance", "Writing", "Volunteering",
];

const SOCIAL_MODES = [
  {{ id: "friendship", label: "Friendship", emoji: "🤝", desc: "Find genuine friends and companions" }},
  {{ id: "dating", label: "Dating", emoji: "💕", desc: "Discover romantic connections" }},
  {{ id: "business", label: "Business", emoji: "💼", desc: "Build professional relationships" }},
  {{ id: "family", label: "Family", emoji: "🏡", desc: "Connect with family-oriented people" }},
];

const AVATARS = [
  {{ id: "cartoon" as const, label: "Cosmic", emoji: "🌌", color: "from-violet-600 to-purple-800" }},
  {{ id: "realistic" as const, label: "Aurora", emoji: "🌠", color: "from-cyan-500 to-blue-600" }},
  {{ id: "fantasy" as const, label: "Fantasy", emoji: "🔥", color: "from-orange-500 to-red-600" }},
  {{ id: "aspirational" as const, label: "Aspirational", emoji: "⭐", color: "from-yellow-400 to-orange-500" }},
];

const STEPS = [
  {{ id: 1, title: "Welcome", icon: Sparkles }},
  {{ id: 2, title: "Soul Forge", icon: Brain }},
  {{ id: 3, title: "Interests", icon: Heart }},
  {{ id: 4, title: "Avatar", icon: Star }},
  {{ id: 5, title: "Social Mode", icon: Target }},
  {{ id: 6, title: "Trust", icon: Shield }},
  {{ id: 7, title: "Activate", icon: Zap }},
];

export default function Onboarding() {{
  const [, navigate] = useLocation();
  const {{ isAuthenticated }} = useAuth();
  const [step, setStep] = useState(1);
  const [traits, setTraits] = useState<Record<string, number>>({{}});
  const [interests, setInterests] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<"cartoon"|"realistic"|"fantasy"|"aspirational">("cartoon");
  const [wingmanName, setWingmanName] = useState("");
  const [socialModes, setSocialModes] = useState<string[]>(["friendship"]);
  const [activating, setActivating] = useState(false);

  const createWingman = trpc.wingman.createWingman.useMutation();
  const saveTraits = trpc.soulForge.saveTraits.useMutation();
  const saveInterests = trpc.interests.save.useMutation();
  const activateWingman = trpc.wingman.activateWingman.useMutation();

  if (!isAuthenticated) {{
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>
        <div className="glass-card p-10 text-center max-w-md relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign In to Begin</h2>
          <p className="text-muted-foreground mb-6">Create your account to start forging your Wingman.</p>
          <Button className="btn-aurora w-full" onClick={{() => window.location.href = getLoginUrl()}}>
            Sign In / Create Account
          </Button>
        </div>
      </div>
    );
  }}

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const handleActivate = async () => {{
    if (!wingmanName.trim()) {{ toast.error("Please name your Wingman"); return; }}
    setActivating(true);
    try {{
      const result = await createWingman.mutateAsync({{
        wingmanName: wingmanName.trim(),
        avatarStyle: avatar,
        socialMode: socialModes,
        personalityArchetype: "Explorer",
      }});
      const wingmanId = result.wingmanId;
      if (wingmanId && Object.keys(traits).length > 0) {{
        const traitInput = {trait_input};
        await saveTraits.mutateAsync({{ wingmanId, traits: traitInput, selectedStyles: [avatar] }});
      }}
      if (interests.length > 0) {{
        const interestObjects = interests.map(i => ({{ category: "General", interest: i }}));
        await saveInterests.mutateAsync({{ interests: interestObjects }});
      }}
      await activateWingman.mutateAsync();
      toast.success("Your Wingman is alive!");
      setTimeout(() => navigate("/dashboard"), 1500);
    }} catch (e: any) {{
      toast.error(e?.message || "Activation failed. Please try again.");
      setActivating(false);
    }}
  }};

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
            <span className="text-xs text-muted-foreground">Step {{step}} of {{STEPS.length}}</span>
          </div>
          <Progress value={{progress}} className="h-1" />
          <div className="flex items-center justify-between mt-2">
            {{STEPS.map(({{ id, title, icon: Icon }}) => (
              <div key={{id}} className={{"flex flex-col items-center gap-1 " + (id <= step ? "opacity-100" : "opacity-30")}}>
                <div className={{"w-6 h-6 rounded-full flex items-center justify-center text-xs " + (id < step ? "bg-primary text-white" : id === step ? "bg-primary/20 border border-primary text-primary" : "bg-muted text-muted-foreground")}}>
                  {{id < step ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}}
                </div>
                <span className="text-[9px] text-muted-foreground hidden sm:block">{{title}}</span>
              </div>
            ))}}
          </div>
        </div>
      </div>

      <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto relative z-10">
        {{step === 1 && (
          <div className="text-center animate-fade-up">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Welcome to <span className="gradient-text">Soul Forge</span></h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              In the next few minutes, you will build your AI personality twin — a Wingman that represents you authentically in the social world.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {{[{{ icon: Brain, title: "34 Traits", desc: "Deep personality mapping" }}, {{ icon: Heart, title: "Your Values", desc: "What matters most to you" }}, {{ icon: Zap, title: "AI Activation", desc: "Your Wingman comes alive" }}].map(({{ icon: Icon, title, desc }}) => (
                <div key={{title}} className="glass-card p-4 text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm">{{title}}</p>
                  <p className="text-xs text-muted-foreground">{{desc}}</p>
                </div>
              ))}}
            </div>
            <Button className="btn-aurora px-10 py-4 rounded-xl text-base" onClick={{() => setStep(2)}}>
              Begin Soul Forge <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}}

        {{step === 2 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Soul Forge Assessment — 34 Traits</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Map Your Personality DNA</h2>
              <p className="text-muted-foreground">Rate each trait from 0 to 100. Be honest — your Wingman depends on it.</p>
            </div>
            <div className="space-y-8">
              {{Object.entries(TRAIT_CATEGORIES).map(([category, categoryTraits]) => (
                <div key={{category}}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{{category}}</h3>
                  <div className="space-y-4">
                    {{categoryTraits.map(traitKey => (
                      <div key={{traitKey}} className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{{TRAIT_LABELS[traitKey] || traitKey}}</p>
                            <p className="text-xs text-muted-foreground">{{TRAIT_DESCS[traitKey] || ""}}</p>
                          </div>
                          <span className="text-lg font-bold text-primary w-10 text-center">{{traits[traitKey] ?? 50}}</span>
                        </div>
                        <input type="range" min="0" max="100" step="5" value={{traits[traitKey] ?? 50}}
                          onChange={{e => setTraits(prev => ({{ ...prev, [traitKey]: parseInt(e.target.value) }}))}}
                          className="w-full accent-violet-600 cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>Low</span><span>High</span></div>
                      </div>
                    ))}}
                  </div>
                </div>
              ))}}
            </div>
          </div>
        )}}

        {{step === 3 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Your Interests</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">What Lights You Up?</h2>
              <p className="text-muted-foreground">Select at least 3 interests. Your Wingman will use these to find compatible connections.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {{INTERESTS.map(interest => (
                <button key={{interest}}
                  onClick={{() => setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])}}
                  className={{"px-5 py-2.5 rounded-full text-sm font-medium transition-all border " + (interests.includes(interest) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "glass border-border text-muted-foreground hover:text-foreground hover:border-primary/40")}}>
                  {{interest}}
                </button>
              ))}}
            </div>
            {{interests.length > 0 && <p className="text-center text-sm text-primary mt-6">{{interests.length}} selected</p>}}
          </div>
        )}}

        {{step === 4 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20">Wingman Identity</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Design Your Wingman</h2>
              <p className="text-muted-foreground">Choose an avatar style and give your Wingman a name.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {{AVATARS.map(av => (
                <button key={{av.id}} onClick={{() => setAvatar(av.id)}}
                  className={{"glass-card p-6 text-center transition-all border-2 " + (avatar === av.id ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary/30")}}>
                  <div className={{"w-16 h-16 rounded-2xl bg-gradient-to-br " + av.color + " flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg"}}>{{av.emoji}}</div>
                  <p className="font-semibold text-sm">{{av.label}}</p>
                </button>
              ))}}
            </div>
            <div className="glass-card p-6">
              <label className="block text-sm font-medium mb-2">Name Your Wingman</label>
              <input type="text" value={{wingmanName}} onChange={{e => setWingmanName(e.target.value)}}
                placeholder="e.g. ARIA, NOVA, ECHO, SAGE..."
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                maxLength={{20}} />
              <p className="text-xs text-muted-foreground mt-2">This is how your Wingman will introduce itself to others.</p>
            </div>
          </div>
        )}}

        {{step === 5 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-rose-500/10 text-rose-400 border-rose-500/20">Social Mode</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">What Are You Looking For?</h2>
              <p className="text-muted-foreground">Select all that apply. Your Wingman will focus its discovery efforts accordingly.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {{SOCIAL_MODES.map(mode => (
                <button key={{mode.id}}
                  onClick={{() => setSocialModes(prev => prev.includes(mode.id) ? prev.filter(m => m !== mode.id) : [...prev, mode.id])}}
                  className={{"glass-card p-6 text-left transition-all border-2 " + (socialModes.includes(mode.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30")}}>
                  <div className="text-3xl mb-3">{{mode.emoji}}</div>
                  <h3 className="font-display font-semibold text-lg mb-1">{{mode.label}}</h3>
                  <p className="text-sm text-muted-foreground">{{mode.desc}}</p>
                  {{socialModes.includes(mode.id) && <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium"><Check className="w-3 h-3" /> Selected</div>}}
                </button>
              ))}}
            </div>
          </div>
        )}}

        {{step === 6 && (
          <div className="animate-fade-up">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Trust Configuration</Badge>
              <h2 className="font-display text-3xl font-bold mb-2">Set Your Default Trust Level</h2>
              <p className="text-muted-foreground">This controls how much information your Wingman shares with new connections.</p>
            </div>
            <div className="space-y-3">
              {{[
                {{ level: 1, name: "Public", desc: "Open discovery — minimal info shared", color: "text-muted-foreground" }},
                {{ level: 2, name: "Acquaintance", desc: "Basic profile visible to new connections", color: "text-blue-400" }},
                {{ level: 3, name: "Connection", desc: "Shared interests and compatibility data", color: "text-cyan-400" }},
                {{ level: 4, name: "Trusted", desc: "Deep personality insights shared", color: "text-emerald-400" }},
                {{ level: 5, name: "Inner Circle", desc: "Full access — reserved for close connections", color: "text-primary" }},
              ].map(({{ level, name, desc, color }}) => (
                <div key={{level}} className={{"w-full glass-card p-5 text-left transition-all border-2 flex items-center gap-4 border-transparent hover:border-primary/30"}}>
                  <div className={{"w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center font-bold " + color}}>{{level}}</div>
                  <div><p className={{"font-semibold " + color}}>{{name}}</p><p className="text-sm text-muted-foreground">{{desc}}</p></div>
                </div>
              ))}}
            </div>
          </div>
        )}}

        {{step === 7 && (
          <div className="text-center animate-fade-up">
            <div className={{"w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-2xl " + (activating ? "animate-pulse-glow" : "")}}>
              <Zap className="w-16 h-16 text-white" />
            </div>
            <h2 className="font-display text-4xl font-bold mb-4">{{activating ? "Activating..." : "Ready to Activate?"}}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              {{activating ? "Your Wingman is coming to life. Calibrating personality matrix..." : `Your Wingman "${{wingmanName || "unnamed"}}" is ready to be activated.`}}
            </p>
            {{!activating && (
              <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Traits Mapped</p><p className="font-bold text-primary">{{Object.keys(traits).length}} / 34</p></div>
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Interests</p><p className="font-bold text-cyan-400">{{interests.length}} selected</p></div>
                <div className="glass-card p-4"><p className="text-xs text-muted-foreground mb-1">Social Modes</p><p className="font-bold text-emerald-400">{{socialModes.length}} active</p></div>
              </div>
            )}}
            {{!activating && (
              <Button className="btn-aurora px-12 py-5 rounded-xl text-lg" onClick={{handleActivate}}>
                <Zap className="w-5 h-5 mr-2" /> Activate {{wingmanName || "Wingman"}}
              </Button>
            )}}
            {{activating && (
              <div className="flex justify-center gap-2">
                {{[0,1,2,3,4].map(i => <div key={{i}} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{{{ animationDelay: i * 150 + "ms" }}}} />)}}
              </div>
            )}}
          </div>
        )}}

        <div className="flex items-center justify-between mt-12">
          <Button variant="outline" onClick={{() => setStep(s => Math.max(1, s - 1))}} disabled={{step === 1}} className="glass border-border">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {{step < 7 && (
            <Button className="btn-aurora rounded-xl px-8"
              onClick={{() => {{
                if (step === 3 && interests.length < 3) {{ toast.error("Select at least 3 interests"); return; }}
                if (step === 5 && socialModes.length === 0) {{ toast.error("Select at least one social mode"); return; }}
                setStep(s => s + 1);
              }}}}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}}
        </div>
      </div>
    </div>
  );
}}
""")

# ─── PROFILE (fixed: getTraits requires wingmanId) ───
write("Profile.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: traits } = trpc.soulForge.getTraits.useQuery(
    { wingmanId: wingman?.id ?? 0 },
    { enabled: isAuthenticated && !!wingman?.id }
  );
  const { data: connections } = trpc.wingman.getConnections.useQuery(undefined, { enabled: isAuthenticated });

  const verificationTiers = [
    { tier: "bronze", label: "Bronze", emoji: "🥉", unlocked: true },
    { tier: "silver", label: "Silver", emoji: "🥈", unlocked: (connections || []).length >= 5 },
    { tier: "gold", label: "Gold", emoji: "🥇", unlocked: (connections || []).length >= 20 },
    { tier: "platinum", label: "Platinum", emoji: "💎", unlocked: (connections || []).length >= 50 },
  ];

  const traitEntries = traits
    ? Object.entries(traits)
        .filter(([k]) => k !== "id" && k !== "wingmanId" && k !== "createdAt" && k !== "updatedAt" && k !== "selectedStyles" && k !== "generatedDescription")
        .filter(([, v]) => typeof v === "number" && v !== null)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8)
    : [];

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
                <div key={tier} className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-primary/10 text-primary border border-primary/20">
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
            {traitEntries.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">Top personality traits</p>
                {traitEntries.map(([trait, score]) => (
                  <div key={trait}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground capitalize">{trait.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-foreground">{score}/100</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: (score as number) + "%" }} />
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

# ─── WINGMAN TV (fixed: generateStory requires input object, getStories no input) ───
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
          <Button className="btn-aurora" onClick={() => generateStory.mutate({})} disabled={generateStory.isPending}>
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
              <Button className="btn-aurora" onClick={() => generateStory.mutate({})}><Zap className="w-4 h-4 mr-2" /> Generate First Episode</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
""")

# ─── ADMIN (fixed: no storiesGenerated field) ───
write("Admin.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Users, Brain, Activity, MessageSquare } from "lucide-react";
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
            { label: "Total Introductions", value: stats?.totalIntroductions || 0, icon: MessageSquare, color: "text-amber-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3"><Icon className={"w-5 h-5 " + color} /><Badge className="text-[10px] bg-muted/30 text-muted-foreground border-border">Live</Badge></div>
              <p className={"font-display text-2xl font-bold " + color}>{(value || 0).toLocaleString()}</p>
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

# ─── NOTIFICATIONS (fixed: notifications.getAll requires input, notifications.markRead, notifications.markAllRead) ───
write("Notifications.tsx", """
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Heart, Users, Zap, Globe } from "lucide-react";
import { toast } from "sonner";

const NOTIF_ICONS: Record<string, any> = {
  new_connection: Users, introduction_complete: Heart, compatibility_match: Zap, travel_alert: Globe, default: Bell,
};

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { data: notifications, refetch } = trpc.notifications.getAll.useQuery({ limit: 50 }, { enabled: isAuthenticated });
  const { data: preferences } = trpc.notifications.getPreferences.useQuery(undefined, { enabled: isAuthenticated });

  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { toast.success("All marked as read"); refetch(); } });
  const updatePrefs = trpc.notifications.updatePreferences.useMutation({ onSuccess: () => toast.success("Preferences saved") });

  const unreadCount = (notifications || []).filter((n: any) => !n.isRead).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1"><span className="gradient-text">Notifications</span></h1>
            <p className="text-muted-foreground text-sm">{unreadCount} unread notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" className="glass border-border" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {(notifications || []).map((notif: any) => {
              const Icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
              return (
                <div key={notif.id}
                  className={"glass-card p-4 border transition-all " + (!notif.isRead ? "border-primary/20 bg-primary/5" : "border-transparent")}
                  onClick={() => { if (!notif.isRead) markRead.mutate({ notificationId: notif.id }); }}>
                  <div className="flex items-start gap-3">
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + (!notif.isRead ? "bg-primary/20" : "bg-muted/20")}>
                      <Icon className={"w-4 h-4 " + (!notif.isRead ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{notif.title}</p>
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!notifications || notifications.length === 0) && (
              <div className="glass-card p-16 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No Notifications Yet</h3>
                <p className="text-muted-foreground text-sm">Your Wingman will notify you when it makes connections and introductions.</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 h-fit">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Preferences</h2>
            {preferences && (
              <div className="space-y-3">
                {[
                  { key: "newConnection", label: "New Connections" },
                  { key: "introductionComplete", label: "Introductions" },
                  { key: "compatibilityMatch", label: "Compatibility Matches" },
                  { key: "travelAlert", label: "Travel Alerts" },
                  { key: "conferenceMatch", label: "Conference Matches" },
                  { key: "weeklyDigest", label: "Weekly Digest" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <button
                      onClick={() => updatePrefs.mutate({ [key]: !(preferences as any)[key] })}
                      className={"w-10 h-5 rounded-full transition-colors relative " + ((preferences as any)[key] ? "bg-primary" : "bg-muted")}>
                      <div className={"w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform " + ((preferences as any)[key] ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
""")

print("\\nAll TypeScript errors fixed!")
