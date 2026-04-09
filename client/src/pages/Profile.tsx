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
                      <span className="text-foreground">{score as number}/100</span>
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
