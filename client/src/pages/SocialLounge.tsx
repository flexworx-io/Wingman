import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, Zap, Globe, Coffee, Briefcase, Home } from "lucide-react";
import { toast } from "sonner";

const MODE_CONFIG = {
  friendship: { icon: "\u{1F91D}", label: "Friendship", color: "from-cyan-500 to-blue-600", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  dating: { icon: "\u{1F495}", label: "Dating", color: "from-pink-500 to-rose-600", badge: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  business: { icon: "\u{1F4BC}", label: "Business", color: "from-amber-500 to-orange-600", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  family: { icon: "\u{1F3E1}", label: "Family", color: "from-emerald-500 to-teal-600", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export default function SocialLounge() {
  const { isAuthenticated } = useAuth();
  const [activeMode, setActiveMode] = useState<string>("friendship");

  const { data: connections } = trpc.wingman.getConnections.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Social Lounge</h1>
              <p className="text-muted-foreground text-sm">Your connections across all social modes</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          {Object.entries(MODE_CONFIG).map(([mode, cfg]) => (
            <button key={mode} onClick={() => setActiveMode(mode)}
              className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all " +
                (activeMode === mode ? "bg-gradient-to-r " + cfg.color + " text-white shadow-lg" : "glass border border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
              <span>{cfg.icon}</span> {cfg.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> {MODE_CONFIG[activeMode as keyof typeof MODE_CONFIG]?.label} Connections
              </h2>
              <Badge className={"text-xs " + MODE_CONFIG[activeMode as keyof typeof MODE_CONFIG]?.badge}>
                {(connections || []).length} total
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {(connections || []).map((conn: any, i: number) => (
                <div key={conn.id || i} className="glass-card p-5 border border-transparent hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:scale-110 transition-transform">
                      {(conn.otherWingman?.wingmanName || conn.wingmanName || "W")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{conn.otherWingman?.wingmanName || conn.wingmanName || "Wingman"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{conn.connectionType || activeMode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400 text-sm">{conn.compatibilityScore || 80}%</p>
                      <p className="text-[10px] text-muted-foreground">match</p>
                    </div>
                  </div>
                  <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-1000" style={{ width: (conn.compatibilityScore || 80) + "%" }} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="glass border-border text-xs flex-1" onClick={() => toast.info("Message feature coming soon")}>
                      <MessageCircle className="w-3 h-3 mr-1" /> Message
                    </Button>
                    <Button size="sm" className="btn-aurora text-xs flex-1" onClick={() => toast.success("Wingman will arrange a meetup!")}>
                      <Zap className="w-3 h-3 mr-1" /> Meetup
                    </Button>
                  </div>
                </div>
              ))}
              {(!connections || connections.length === 0) && (
                <div className="col-span-2 glass-card p-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Your Wingman is actively searching for compatible connections.</p>
                  <Button className="btn-aurora" onClick={() => window.location.href = "/discovery"}>
                    <Globe className="w-4 h-4 mr-2" /> Explore Spaces
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 holographic">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Wingman Status
              </h3>
              {wingman ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md">
                      {wingman.wingmanName?.[0] || "W"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{wingman.wingmanName}</p>
                      <div className="flex items-center gap-1.5">
                        <div className={"w-1.5 h-1.5 rounded-full " + (wingman.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                        <span className={"text-xs font-medium " + (wingman.status === "active" ? "text-emerald-400" : "text-amber-400")}>
                          {wingman.status === "active" ? "Active" : "Standby"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Total Connections", value: wingman.totalConnections || 0 },
                      { label: "Introductions Made", value: wingman.totalIntroductions || 0 },
                      { label: "Avg Compatibility", value: Math.round(wingman.avgCompatibilityScore || 85) + "%" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-bold text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Activate your Wingman to see stats.</p>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display font-semibold mb-4 text-sm">Social Mode Guide</h3>
              <div className="space-y-3">
                {[
                  { icon: "\u{1F91D}", mode: "Friendship", desc: "Discover like-minded people for genuine friendships" },
                  { icon: "\u{1F495}", mode: "Dating", desc: "Find romantic connections with compatible partners" },
                  { icon: "\u{1F4BC}", mode: "Business", desc: "Network with professionals and potential collaborators" },
                  { icon: "\u{1F3E1}", mode: "Family", desc: "Connect families and build community bonds" },
                ].map(({ icon, mode, desc }) => (
                  <div key={mode} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{mode}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
