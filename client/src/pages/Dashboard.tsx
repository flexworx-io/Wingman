import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Heart, Activity, Users, Shield, Tv, ArrowRight, Bell, Compass, Globe } from "lucide-react";
import { toast } from "sonner";

function CompatibilityMeter({ score, label, color }: { score: number; label: string; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let current = 0;
      const step = setInterval(() => {
        current += 2;
        if (current >= score) { setDisplayed(score); clearInterval(step); }
        else setDisplayed(current);
      }, 20);
      return () => clearInterval(step);
    }, 400);
    return () => clearTimeout(t);
  }, [score]);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (displayed / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
          <circle cx="32" cy="32" r="28" fill="none" strokeWidth="5"
            stroke="url(#cgrad)" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }} />
          <defs>
            <linearGradient id="cgrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={"font-display font-bold text-sm " + color}>{displayed}%</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">{label}</p>
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

        <div className="glass-card p-4 mb-6 border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live Activity</span>
            <div className="ml-auto flex items-center gap-1"><Activity className="w-3 h-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Real-time stream</span></div>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto scrollbar-hide">
            {tickerItems.length > 0 ? tickerItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-up">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            )) : [
              "🔍 Scanning 2,847 profiles for compatibility...",
              "⚡ Calibrating Soul Forge personality matrix...",
              "🌍 Travel intelligence active — monitoring your area",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
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
                  <Button size="sm" className="btn-aurora" onClick={() => wingman?.id && activateWingman.mutate({ wingmanId: wingman.id })}>
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
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Compatibility Meters</h3>
                <div className="grid grid-cols-4 gap-2">
                  <CompatibilityMeter score={Math.round(wingman.avgCompatibilityScore || 85)} label="Overall" color="text-primary" />
                  <CompatibilityMeter score={87} label="Values" color="text-cyan-400" />
                  <CompatibilityMeter score={91} label="Interests" color="text-emerald-400" />
                  <CompatibilityMeter score={78} label="Style" color="text-amber-400" />
                </div>
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
