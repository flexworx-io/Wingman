#!/usr/bin/env python3
"""Generate all Wingman.vip page files."""
import os

BASE = "/home/ubuntu/wingman-vip/client/src/pages"
os.makedirs(BASE, exist_ok=True)

pages = {}

# ─── HOME PAGE ────────────────────────────────────────────────────────────────
pages["Home.tsx"] = """\
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Shield, Compass, Tv, ArrowRight, CheckCircle,
  ChevronDown, Brain, Heart, Globe, Lock, Sparkles
} from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

function TrustBadge({ tier, label }: { tier: "bronze"|"silver"|"gold"|"platinum"; label: string }) {
  const icons = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎" };
  return (
    <div className={"badge-" + tier + " px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"}>
      <span>{icons[tier]}</span> {label}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: Brain, title: "Soul Forge AI", desc: "Build your AI personality twin with 34 unique traits. Your Wingman learns your social DNA and represents you authentically.", grad: "from-[oklch(0.58_0.28_290)] to-[oklch(0.52_0.26_265)]", delay: 0 },
    { icon: Compass, title: "Discovery Engine", desc: "AI-to-AI exploration across virtual spaces. Your Wingman discovers compatible souls 24/7 while you live your life.", grad: "from-[oklch(0.52_0.26_265)] to-[oklch(0.72_0.18_200)]", delay: 100 },
    { icon: Heart, title: "Dream Board", desc: "A curated gallery of potential connections, scored by compatibility and ranked by shared values.", grad: "from-[oklch(0.62_0.26_10)] to-[oklch(0.58_0.28_290)]", delay: 200 },
    { icon: Shield, title: "Trust Ladder", desc: "Five levels of trust: Public, Acquaintance, Connection, Trusted, Inner Circle. You control access.", grad: "from-[oklch(0.70_0.20_160)] to-[oklch(0.72_0.18_200)]", delay: 300 },
    { icon: Tv, title: "Wingman TV", desc: "AI-generated story summaries of your connection adventures. Watch your social life unfold cinematically.", grad: "from-[oklch(0.78_0.18_75)] to-[oklch(0.70_0.20_160)]", delay: 400 },
    { icon: Globe, title: "Travel Intelligence", desc: "Your Wingman detects when connections are in the same city and orchestrates real-world meetups.", grad: "from-[oklch(0.72_0.18_200)] to-[oklch(0.70_0.20_160)]", delay: 500 },
  ];

  const steps = [
    { num: "01", title: "Forge Your Soul", desc: "Complete the 34-trait Soul Forge assessment. Design your Wingman avatar and give it a name.", icon: Brain },
    { num: "02", title: "Activate Your Agent", desc: "Your Wingman goes live and begins exploring virtual social spaces, discovering compatible connections.", icon: Zap },
    { num: "03", title: "Watch Connections Form", desc: "Your Wingman makes introductions, builds trust, and notifies you when it is time to step in.", icon: Sparkles },
  ];

  const trustLevels = [
    { name: "Public", desc: "Open discovery mode", color: "text-muted-foreground", bg: "bg-muted/20" },
    { name: "Acquaintance", desc: "Basic profile visible", color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Connection", desc: "Shared interests unlocked", color: "text-[oklch(0.72_0.18_200)]", bg: "bg-[oklch(0.72_0.18_200)]/10" },
    { name: "Trusted", desc: "Deep compatibility data", color: "text-[oklch(0.70_0.20_160)]", bg: "bg-[oklch(0.70_0.20_160)]/10" },
    { name: "Inner Circle", desc: "Full access granted", color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.58_0.28_290)] to-[oklch(0.72_0.18_200)] flex items-center justify-center animate-pulse-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">Wingman</span>
              <span className="text-xs text-muted-foreground">.vip</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {["Features", "How It Works", "Trust System"].map(item => (
                <a key={item} href={"#" + item.toLowerCase().replace(/ /g, "-")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="btn-aurora rounded-lg px-5">
                    Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <button onClick={() => window.location.href = getLoginUrl()}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</button>
                  <Button size="sm" className="btn-aurora rounded-lg px-5"
                    onClick={() => window.location.href = getLoginUrl("/onboarding")}>
                    Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
