#!/usr/bin/env python3
"""Generate all Wingman.vip page files."""
import os

BASE = "/home/ubuntu/wingman-vip/client/src/pages"
os.makedirs(BASE, exist_ok=True)

def write(filename, content):
    path = os.path.join(BASE, filename)
    with open(path, "w") as f:
        f.write(content)
    print(f"Written: {filename}")

# ─── HOME ─────────────────────────────────────────────────────────────────────
write("Home.tsx", open("/home/ubuntu/wingman-vip/client/src/pages/Home.tsx").read() if False else """
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Compass, Tv, ArrowRight, CheckCircle, ChevronDown, Brain, Heart, Globe, Lock, Sparkles } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0; const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); } else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

function TrustBadge({ tier, label }: { tier: "bronze"|"silver"|"gold"|"platinum"; label: string }) {
  const icons: Record<string,string> = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎" };
  return <div className={"badge-" + tier + " px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"}><span>{icons[tier]}</span> {label}</div>;
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const features = [
    { icon: Brain, title: "Soul Forge AI", desc: "Build your AI personality twin with 34 unique traits. Your Wingman learns your social DNA and represents you authentically.", grad: "from-violet-600 to-purple-700", delay: 0 },
    { icon: Compass, title: "Discovery Engine", desc: "AI-to-AI exploration across virtual spaces. Your Wingman discovers compatible souls 24/7 while you live your life.", grad: "from-purple-700 to-cyan-600", delay: 100 },
    { icon: Heart, title: "Dream Board", desc: "A curated gallery of potential connections, scored by compatibility and ranked by shared values.", grad: "from-rose-600 to-violet-600", delay: 200 },
    { icon: Shield, title: "Trust Ladder", desc: "Five levels of trust: Public, Acquaintance, Connection, Trusted, Inner Circle. You control access.", grad: "from-emerald-600 to-cyan-600", delay: 300 },
    { icon: Tv, title: "Wingman TV", desc: "AI-generated story summaries of your connection adventures. Watch your social life unfold cinematically.", grad: "from-amber-500 to-emerald-600", delay: 400 },
    { icon: Globe, title: "Travel Intelligence", desc: "Your Wingman detects when connections are in the same city and orchestrates real-world meetups.", grad: "from-cyan-600 to-emerald-600", delay: 500 },
  ];
  const steps = [
    { num: "01", title: "Forge Your Soul", desc: "Complete the 34-trait Soul Forge assessment. Design your Wingman avatar and give it a name.", icon: Brain },
    { num: "02", title: "Activate Your Agent", desc: "Your Wingman goes live and begins exploring virtual social spaces, discovering compatible connections.", icon: Zap },
    { num: "03", title: "Watch Connections Form", desc: "Your Wingman makes introductions, builds trust, and notifies you when it is time to step in.", icon: Sparkles },
  ];
  const trustLevels = [
    { name: "Public", desc: "Open discovery mode", color: "text-muted-foreground", bg: "bg-muted/20" },
    { name: "Acquaintance", desc: "Basic profile visible", color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Connection", desc: "Shared interests unlocked", color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { name: "Trusted", desc: "Deep compatibility data", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Inner Circle", desc: "Full access granted", color: "text-primary", bg: "bg-primary/10" },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="aurora-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /><div className="aurora-orb aurora-orb-3" /><div className="aurora-orb aurora-orb-4" /></div>
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse-glow"><Zap className="w-4 h-4 text-white" /></div>
              <span className="font-display font-bold text-xl gradient-text">Wingman</span><span className="text-xs text-muted-foreground">.vip</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {["Features","How It Works","Trust System"].map(item => <a key={item} href={"#"+item.toLowerCase().replace(/ /g,"-")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>)}
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard"><Button size="sm" className="btn-aurora rounded-lg px-5">Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              ) : (<>
                <button onClick={() => window.location.href = getLoginUrl()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</button>
                <Button size="sm" className="btn-aurora rounded-lg px-5" onClick={() => window.location.href = getLoginUrl("/onboarding")}>Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
              </>)}
            </div>
          </div>
        </div>
      </nav>
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-muted-foreground">Introducing</span><span className="gradient-text font-semibold">AI-to-AI Social Connections</span><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6 animate-fade-up" style={{ animationDelay: "100ms", opacity: 0 }}>
            <span className="block text-foreground">Your AI</span><span className="block gradient-text text-glow-violet">Wingman</span><span className="block text-foreground">Makes the</span><span className="block gradient-text-gold">Move.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "200ms", opacity: 0 }}>
            Build your AI personality twin. Watch it discover compatible souls, make introductions, and grow your network — while you live your life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up" style={{ animationDelay: "300ms", opacity: 0 }}>
            <button onClick={() => window.location.href = getLoginUrl("/onboarding")} className="btn-aurora px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2 shadow-2xl">
              <Sparkles className="w-4 h-4" /> Forge Your Wingman <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-aurora-outline px-8 py-4 rounded-xl text-base font-semibold flex items-center gap-2">
              Watch Demo <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-primary ml-0.5" /></div>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 animate-fade-up" style={{ animationDelay: "400ms", opacity: 0 }}>
            {[["🤝","Friendship"],["💕","Dating"],["💼","Business"],["🏡","Family"]].map(([emoji,mode]) => (
              <div key={mode} className="px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"><span>{emoji}</span> {mode}</div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "500ms", opacity: 0 }}>
            <TrustBadge tier="bronze" label="Bronze" /><TrustBadge tier="silver" label="Silver" /><TrustBadge tier="gold" label="Gold" /><TrustBadge tier="platinum" label="Platinum" />
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block animate-float">
          <div className="relative w-72 h-72">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/15 to-cyan-500/15 blur-3xl" />
            <div className="absolute inset-4 rounded-full glass border border-primary/20 flex items-center justify-center">
              <div className="text-center z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 mx-auto mb-3 flex items-center justify-center animate-pulse-glow"><Brain className="w-8 h-8 text-white" /></div>
                <p className="text-sm font-semibold gradient-text font-display">ARIA</p>
                <p className="text-xs text-muted-foreground">Your Wingman</p>
                <div className="flex items-center justify-center gap-1 mt-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[10px] text-green-400">Active — 3 intros today</span></div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border border-primary/10 animate-spin-slow" />
            <div className="absolute inset-[-20px] rounded-full border border-cyan-500/8 animate-counter-spin" />
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10">
          <span className="text-xs text-muted-foreground">Explore</span><ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </section>
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{value:50000,suffix:"+",label:"Active Wingmen",color:"text-primary"},{value:2400000,suffix:"+",label:"Connections Made",color:"text-cyan-400"},{value:94,suffix:"%",label:"Match Satisfaction",color:"text-emerald-400"},{value:180,suffix:"+",label:"Countries",color:"text-amber-400"}].map(({value,suffix,label,color}) => (
              <div key={label} className="glass-card p-6 text-center">
                <div className={"font-display text-3xl sm:text-4xl font-bold "+color+" mb-1"}><AnimatedCounter target={value} suffix={suffix} /></div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">How It Works</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Your Wingman Works <span className="gradient-text">24/7</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">While you sleep, work, or travel — your AI agent is out there making meaningful connections.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px bg-gradient-to-r from-primary/30 via-cyan-500/50 to-primary/30" />
            {steps.map(({num,title,desc,icon:Icon},i) => (
              <div key={num} className="glass-card p-8 text-center animate-fade-up" style={{animationDelay:i*150+"ms",opacity:0}}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 relative">
                  <Icon className="w-7 h-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">{num}</span>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">Platform Features</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Everything Your <span className="gradient-text">Social Life</span> Needs</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({icon:Icon,title,desc,grad,delay}) => (
              <div key={title} className="glass-card p-6 holographic animate-fade-up" style={{animationDelay:delay+"ms",opacity:0}}>
                <div className={"w-12 h-12 rounded-xl bg-gradient-to-br "+grad+" flex items-center justify-center mb-4 shadow-lg"}><Icon className="w-6 h-6 text-white" /></div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="trust-system" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">Trust Ladder System</Badge>
              <h2 className="font-display text-4xl font-bold mb-4">You Control <span className="gradient-text">Every Level</span></h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">The Trust Ladder gives you granular control over what your Wingman shares and with whom. Progress through 5 levels as connections deepen.</p>
              <div className="space-y-3">
                {trustLevels.map(({name,desc,color,bg},i) => (
                  <div key={name} className={"flex items-center gap-4 p-4 rounded-xl "+bg+" border border-white/5 animate-slide-right"} style={{animationDelay:i*100+"ms",opacity:0}}>
                    <div className={"w-8 h-8 rounded-full "+bg+" border border-white/10 flex items-center justify-center text-sm font-bold "+color}>{i+1}</div>
                    <div><p className={"font-semibold text-sm "+color}>{name}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <Lock className={"w-4 h-4 ml-auto "+color+" opacity-50"} />
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8 holographic">
              <div className="flex items-center justify-between mb-6">
                <div><p className="text-sm text-muted-foreground">Compatibility Score</p><p className="font-display text-3xl font-bold gradient-text">94%</p></div>
                <div className="w-20 h-20 relative">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset={339.3*0.06} />
                    <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><Heart className="w-6 h-6 text-primary" /></div>
                </div>
              </div>
              <div className="space-y-3">
                {[["Openness",92],["Curiosity",88],["Warmth",96],["Humor",85]].map(([trait,score]) => (
                  <div key={trait}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{trait}</span><span className="text-foreground font-medium">{score}%</span></div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{width:score+"%"}} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"><Brain className="w-4 h-4 text-white" /></div>
                <div><p className="text-xs font-semibold">ARIA matched with NOVA</p><p className="text-[10px] text-muted-foreground">Introduction in progress...</p></div>
                <div className="ml-auto flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{animationDelay:i*150+"ms"}} />)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="gradient-border p-px rounded-3xl">
            <div className="glass rounded-3xl p-12 sm:p-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow"><Zap className="w-8 h-8 text-white" /></div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Ready to Meet Your <span className="gradient-text">Wingman?</span></h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">Join thousands of people who let their AI agent handle the introductions. Your perfect connection is waiting.</p>
              <button onClick={() => window.location.href = getLoginUrl("/onboarding")} className="btn-aurora px-10 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 shadow-2xl mx-auto">
                <Sparkles className="w-5 h-5" /> Start Soul Forge <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                {["Free to start","No credit card","Cancel anytime"].map(item => <div key={item} className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> {item}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-12 border-t border-border relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div><span className="font-display font-bold gradient-text">Wingman.vip</span></div>
            <p className="text-xs text-muted-foreground">© 2026 Wingman.vip — AI Social Intermediary Platform.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {["Privacy","Terms","Contact"].map(item => <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
""")

print("All pages written successfully!")
