import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Heart, Shield, Star, Users, Globe, ArrowRight, Play, Check, Sparkles, Target, Activity, Lock, Cpu, Wifi } from "lucide-react";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const colors = ["#7c3aed","#06b6d4","#8b5cf6","#22d3ee","#a78bfa"];
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 2 + 0.5, alpha: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let id: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill();
      });
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      id = requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

function WingmanDemoCard() {
  const [tick, setTick] = useState(0);
  const activities = [
    { icon: "🔍", text: "Scanning 2,847 profiles for compatibility...", color: "text-cyan-400" },
    { icon: "⚡", text: "Found 94% match — initiating introduction...", color: "text-violet-400" },
    { icon: "🤝", text: "ARIA ↔ NOVA: Introduction complete!", color: "text-emerald-400" },
    { icon: "🌍", text: "Detected Sarah in NYC — alerting travel mode...", color: "text-amber-400" },
    { icon: "🧠", text: "Calibrating Soul Forge personality matrix...", color: "text-pink-400" },
    { icon: "💫", text: "Trust level upgraded: Connection → Trusted", color: "text-blue-400" },
  ];
  useEffect(() => {
    const t = setInterval(() => setTick(p => (p + 1) % activities.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="glass-card p-6 max-w-sm w-full mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-500/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">ARIA</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">ACTIVE</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-muted-foreground">Compatibility</p>
            <p className="font-bold text-emerald-400 text-sm">94%</p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {activities.map((a, i) => (
            <div key={i} className={"flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-500 " + (i === tick ? "bg-primary/10 border border-primary/20" : "opacity-30")}>
              <span className="text-base">{a.icon}</span>
              <span className={"text-xs font-medium " + (i === tick ? a.color : "text-muted-foreground")}>{a.text}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[{ v: "2.8K", l: "Scanned" }, { v: "47", l: "Matches" }, { v: "12", l: "Intros" }].map(({ v, l }) => (
            <div key={l} className="p-2 rounded-lg bg-muted/20">
              <p className="font-bold text-primary text-sm">{v}</p>
              <p className="text-[9px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Brain, title: "Soul Forge", desc: "34-trait personality DNA mapping creates your authentic AI twin", color: "from-violet-600 to-purple-800", badge: "AI-Powered" },
  { icon: Target, title: "Discovery Engine", desc: "Wingman-to-Wingman introductions across virtual social spaces", color: "from-cyan-500 to-blue-600", badge: "Real-Time" },
  { icon: Shield, title: "Trust Ladder", desc: "5-tier trust progression from Public to Inner Circle", color: "from-emerald-500 to-teal-600", badge: "Secure" },
  { icon: Globe, title: "Travel Intelligence", desc: "Detect friends in your travel area and coordinate meetups", color: "from-amber-500 to-orange-600", badge: "Location-Aware" },
  { icon: Activity, title: "Wingman TV", desc: "AI-generated story summaries of your connection adventures", color: "from-pink-500 to-rose-600", badge: "Generative AI" },
  { icon: Users, title: "Dream Board", desc: "Gallery of potential connections curated by your Wingman", color: "from-indigo-500 to-violet-600", badge: "Personalized" },
];

const TRUST_LEVELS = [
  { level: 1, name: "Public", color: "text-muted-foreground", bg: "bg-muted/20", desc: "Open discovery" },
  { level: 2, name: "Acquaintance", color: "text-blue-400", bg: "bg-blue-500/10", desc: "Basic profile" },
  { level: 3, name: "Connection", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: "Shared interests" },
  { level: 4, name: "Trusted", color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "Deep insights" },
  { level: 5, name: "Inner Circle", color: "text-primary", bg: "bg-primary/10", desc: "Full access" },
];

const BADGES = [
  { tier: "Bronze", emoji: "🥉", color: "from-amber-700 to-amber-600", req: "First connection" },
  { tier: "Silver", emoji: "🥈", color: "from-slate-400 to-slate-300", req: "5 connections" },
  { tier: "Gold", emoji: "🥇", color: "from-yellow-500 to-amber-400", req: "20 connections" },
  { tier: "Platinum", emoji: "💎", color: "from-cyan-400 to-blue-400", req: "50 connections" },
];

const SOCIAL_MODES = [
  { id: "friendship", emoji: "🤝", label: "Friendship" },
  { id: "dating", emoji: "💕", label: "Dating" },
  { id: "business", emoji: "💼", label: "Business" },
  { id: "family", emoji: "🏡", label: "Family" },
];

const TESTIMONIALS = [
  { name: "Alex M.", role: "Entrepreneur", avatar: "A", text: "My Wingman found my co-founder before I even knew I was looking. The compatibility score was 96% — and it was right.", rating: 5 },
  { name: "Jordan K.", role: "Creative Director", avatar: "J", text: "ARIA introduced me to 3 incredible people at a conference I almost skipped. This platform is genuinely magical.", rating: 5 },
  { name: "Sam R.", role: "Software Engineer", avatar: "S", text: "The Soul Forge assessment is the most accurate personality tool I've ever used. My Wingman just gets me.", rating: 5 },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [showCookie, setShowCookie] = useState(true);

  const handleStart = () => {
    if (isAuthenticated) navigate("/dashboard");
    else window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleCanvas />
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      {/* ─── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse-glow shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">Wingman</span>
            <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 hidden sm:flex">VIP</Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {["Features","Trust","Badges","Stories"].map(item => (
              <a key={item} href={"#" + item.toLowerCase()} className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button className="btn-aurora rounded-xl px-5" onClick={() => navigate("/dashboard")}>
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm hidden sm:flex" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
                <Button className="btn-aurora rounded-xl px-5 text-sm" onClick={handleStart}>Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">World's First AI Social Intermediary</span>
                </div>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
                Your AI<br />
                <span className="gradient-text">Wingman</span><br />
                Never Sleeps
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                Meet your personal AI agent that discovers compatible people, makes introductions, and manages your social world — while you live your life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button className="btn-aurora px-8 py-4 rounded-xl text-base font-semibold" onClick={handleStart}>
                  <Sparkles className="w-4 h-4 mr-2" /> Forge Your Wingman
                </Button>
                <Button variant="outline" className="glass border-border px-8 py-4 rounded-xl text-base" onClick={() => navigate("/onboarding")}>
                  <Play className="w-4 h-4 mr-2" /> See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {[{ v: "50K+", l: "Active Wingmen" }, { v: "2.1M", l: "Introductions Made" }, { v: "94%", l: "Match Accuracy" }].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <p className="font-display font-bold text-foreground text-lg">{v}</p>
                    <p className="text-[11px]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: "200ms" }}>
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-violet-600/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <WingmanDemoCard />
                {/* Floating badges */}
                <div className="absolute -top-4 -left-4 glass-card px-3 py-2 flex items-center gap-2 animate-float">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs">💎</div>
                  <span className="text-xs font-semibold">Platinum Verified</span>
                </div>
                <div className="absolute -bottom-4 -right-4 glass-card px-3 py-2 flex items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-semibold">Live Match Found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL MODES ────────────────────────────────────────────────── */}
      <section className="py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Four Social Modes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SOCIAL_MODES.map(({ id, emoji, label }) => (
              <div key={id} className="glass-card p-5 text-center hover:border-primary/30 transition-all border border-transparent cursor-pointer group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{emoji}</div>
                <p className="font-display font-semibold text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Platform Features</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Everything Your <span className="gradient-text">Wingman</span> Does</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Six powerful modules working together to build your social world autonomously.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, badge }) => (
              <div key={title} className="glass-card p-6 hover:border-primary/20 transition-all border border-transparent group cursor-pointer">
                <div className={"w-12 h-12 rounded-2xl bg-gradient-to-br " + color + " flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform"}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display font-semibold text-lg">{title}</h3>
                  <Badge className="text-[9px] bg-muted/30 text-muted-foreground border-border">{badge}</Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">How It Works</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">Three Steps to <span className="gradient-text">Social Freedom</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Brain, title: "Forge Your Soul", desc: "Complete the 34-trait Soul Forge assessment. Your Wingman learns your authentic personality DNA.", color: "from-violet-600 to-purple-800" },
              { step: "02", icon: Zap, title: "Activate Wingman", desc: "Name and configure your AI agent. Set your social modes, trust levels, and discovery preferences.", color: "from-cyan-500 to-blue-600" },
              { step: "03", icon: Heart, title: "Watch It Work", desc: "Your Wingman discovers, introduces, and builds your network — in real time, 24/7.", color: "from-emerald-500 to-teal-600" },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className={"w-16 h-16 rounded-2xl bg-gradient-to-br " + color + " flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform"}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">{step}</div>
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST LADDER ────────────────────────────────────────────────── */}
      <section id="trust" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Trust Ladder</Badge>
              <h2 className="font-display text-4xl font-bold mb-4">Five Levels of <span className="gradient-text">Trust</span></h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">Your Wingman manages trust progression automatically. As connections deepen, more information is shared — always on your terms.</p>
              <div className="space-y-3">
                {TRUST_LEVELS.map(({ level, name, color, bg, desc }) => (
                  <div key={level} className={"flex items-center gap-4 p-4 rounded-xl " + bg}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm " + bg + " " + color + " border border-current/20"}>{level}</div>
                    <div>
                      <p className={"font-semibold text-sm " + color}>{name}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className={"ml-auto w-24 h-1.5 rounded-full bg-muted/30 overflow-hidden"}>
                      <div className={"h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"} style={{ width: (level / 5 * 100) + "%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8 holographic">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-1">Trust Engine</h3>
                <p className="text-sm text-muted-foreground">AI-managed trust progression</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Privacy Protection", value: 100 },
                  { label: "Trust Accuracy", value: 97 },
                  { label: "User Control", value: 100 },
                  { label: "Progression Speed", value: 85 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="text-emerald-400 font-semibold">{value}%</span></div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: value + "%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VERIFICATION BADGES ─────────────────────────────────────────── */}
      <section id="badges" className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">Verification System</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">Earn Your <span className="gradient-text">Badge</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Four verification tiers that signal your social credibility and unlock platform privileges.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {BADGES.map(({ tier, emoji, color, req }) => (
              <div key={tier} className="glass-card p-6 text-center hover:border-primary/20 transition-all border border-transparent group">
                <div className={"w-16 h-16 rounded-2xl bg-gradient-to-br " + color + " flex items-center justify-center mx-auto mb-4 text-2xl shadow-xl group-hover:scale-110 transition-transform"}>{emoji}</div>
                <h3 className="font-display font-bold mb-1">{tier}</h3>
                <p className="text-xs text-muted-foreground">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="stories" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-pink-500/10 text-pink-400 border-pink-500/20">Member Stories</Badge>
            <h2 className="font-display text-4xl font-bold mb-4">Real <span className="gradient-text">Connections</span>, Real Stories</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, text, rating }) => (
              <div key={name} className="glass-card p-6 hover:border-primary/20 transition-all border border-transparent">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">{avatar}</div>
                  <div><p className="font-semibold text-sm">{name}</p><p className="text-xs text-muted-foreground">{role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECH SPECS ──────────────────────────────────────────────────── */}
      <section className="py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-card p-8 holographic">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Enterprise-Grade Infrastructure</Badge>
              <h2 className="font-display text-2xl font-bold">Built on AWS. Powered by AI.</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: Cpu, label: "AWS AgentCore", desc: "AI orchestration" },
                { icon: Lock, label: "AWS Cognito", desc: "Authentication" },
                { icon: Wifi, label: "Murph.AI HSE", desc: "Agent intelligence" },
                { icon: Globe, label: "Aurora MySQL", desc: "Data persistence" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-32 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-cyan-500/10" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow shadow-2xl shadow-violet-500/30">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Ready to Meet Your <span className="gradient-text">Wingman?</span></h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">Join 50,000+ members who've discovered the future of social connection. Your Wingman is waiting.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button className="btn-aurora px-10 py-4 rounded-xl text-base font-semibold" onClick={handleStart}>
                  <Sparkles className="w-4 h-4 mr-2" /> Start Soul Forge — Free
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                {["No credit card required", "Cancel anytime", "Privacy-first by design"].map(item => (
                  <div key={item} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" />{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-border text-xs text-muted-foreground mb-4">
              <Zap className="w-3 h-3 text-primary" />
              Simple Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-gradient">Invest in Your</span>
              <br />
              <span className="text-foreground">Social Intelligence</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Your Wingman works 24/7 to build the connections that matter most. Choose the plan that matches your ambition.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Explorer", price: "Free", period: "", badge: "Bronze", badgeColor: "text-amber-600", features: ["1 Wingman Agent", "10 introductions/month", "Basic Soul Forge (10 traits)", "Public + Acquaintance trust", "Standard discovery"], cta: "Start Free", highlight: false },
              { name: "Connector", price: "$29", period: "/month", badge: "Gold", badgeColor: "text-yellow-400", features: ["1 Wingman Agent", "Unlimited introductions", "Full 34-trait Soul Forge", "All 5 trust levels", "Travel Intelligence", "Wingman TV stories", "Conference matching", "Priority discovery"], cta: "Get Started", highlight: true },
              { name: "Inner Circle", price: "$79", period: "/month", badge: "Platinum", badgeColor: "text-cyan-400", features: ["3 Wingman Agents", "Everything in Connector", "Dream Board AI curation", "Advanced HSE orchestration", "Custom avatar generation", "API access", "Dedicated support", "Early feature access"], cta: "Go Platinum", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`relative glass-card p-8 rounded-2xl border ${plan.highlight ? "border-primary shadow-[0_0_40px_rgba(139,92,246,0.3)]" : "border-border"} flex flex-col`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-semibold">Most Popular</div>
                )}
                <div className="mb-6">
                  <div className={`text-xs font-semibold ${plan.badgeColor} mb-2 uppercase tracking-wider`}>{plan.badge}</div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={plan.highlight ? "btn-aurora w-full" : "w-full glass border border-border hover:border-primary/50 transition-colors"}
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                <span className="font-display font-bold gradient-text">Wingman</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">The world's first AI-to-AI social intermediary platform.</p>
            </div>
            {[
              { title: "Platform", links: ["Soul Forge", "Discovery Engine", "Trust Ladder", "Wingman TV", "Dream Board"] },
              { title: "Social Modes", links: ["Friendship", "Dating", "Business", "Family"] },
              { title: "Company", links: ["About", "Privacy", "Terms", "Contact"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-sm mb-3">{title}</h4>
                <div className="space-y-2">
                  {links.map(link => <p key={link} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{link}</p>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Wingman.vip. All rights reserved. Built on AWS.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Powered by Murph.AI</span>
              <span>•</span>
              <span>AWS AgentCore</span>
              <span>•</span>
              <span>Aurora MySQL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── COOKIE BANNER ───────────────────────────────────────────────── */}
      {showCookie && !cookieAccepted && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 glass-card p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            We use cookies and pixel tracking to personalize your experience and improve our platform. By continuing, you consent to our <span className="text-primary cursor-pointer underline">Cookie Policy</span>.
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="btn-aurora flex-1 text-xs" onClick={() => { setCookieAccepted(true); setShowCookie(false); }}>Accept All</Button>
            <Button size="sm" variant="outline" className="glass border-border text-xs" onClick={() => setShowCookie(false)}>Decline</Button>
          </div>
        </div>
      )}
    </div>
  );
}
