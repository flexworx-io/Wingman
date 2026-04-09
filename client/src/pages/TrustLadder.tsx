import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ArrowUp, Lock, Unlock, Star, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const TRUST_LEVELS = [
  { level: "public", name: "Public", icon: "\u{1F30D}", color: "text-muted-foreground", bg: "bg-muted/20", border: "border-muted/30", description: "Open discovery. Basic profile visible.", num: 1 },
  { level: "acquaintance", name: "Acquaintance", icon: "\u{1F44B}", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", description: "Basic profile info shared. Mutual interests visible.", num: 2 },
  { level: "connection", name: "Connection", icon: "\u{1F91D}", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", description: "Shared interests and values. Location city visible.", num: 3 },
  { level: "trusted", name: "Trusted", icon: "\u{1F48E}", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", description: "Deep personality insights. Contact info shared.", num: 4 },
  { level: "inner_circle", name: "Inner Circle", icon: "\u2B50", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", description: "Full access. Real identity and all details shared.", num: 5 },
];

export default function TrustLadder() {
  const { isAuthenticated } = useAuth();
  const [selectedConn, setSelectedConn] = useState<number | null>(null);

  const { data: connections, refetch } = trpc.trust.getMyTrustConnections.useQuery(undefined, { enabled: isAuthenticated });
  const updateTrust = trpc.trust.updateTrustLevel.useMutation({
    onSuccess: () => { toast.success("Trust level updated!"); refetch(); setSelectedConn(null); },
    onError: () => toast.error("Could not update trust level"),
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Trust Ladder</h1>
              <p className="text-muted-foreground text-sm">Manage trust levels for all your connections</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <h2 className="font-display font-semibold mb-5 text-sm uppercase tracking-wider text-muted-foreground">Trust Levels</h2>
            <div className="space-y-3">
              {TRUST_LEVELS.map(({ level, name, icon, color, bg, border, description, num }) => (
                <div key={level} className={"p-4 rounded-xl border " + bg + " " + border}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={"w-8 h-8 rounded-full " + bg + " flex items-center justify-center text-sm border " + border}>{icon}</div>
                    <div>
                      <p className={"font-semibold text-sm " + color}>{name}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={"w-2 h-1 rounded-full " + (i < num ? "bg-current " + color : "bg-muted/30")} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Your Connections
              </h2>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{connections?.length || 0} connections</Badge>
            </div>
            <div className="space-y-3">
              {(connections || []).map((conn: any, i: number) => {
                const trustInfo = TRUST_LEVELS.find(t => t.level === conn.trustLevel) || TRUST_LEVELS[0];
                const isSelected = selectedConn === conn.id;
                return (
                  <div key={conn.id || i} className={"glass-card p-5 border transition-all " + (isSelected ? "border-primary/40" : "border-transparent hover:border-primary/20")}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0">
                        {(conn.otherWingman?.wingmanName || conn.wingmanName || "W")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{conn.otherWingman?.wingmanName || conn.wingmanName || "Wingman"}</p>
                          <Badge className={"text-[10px] " + trustInfo.bg + " " + trustInfo.color + " border " + trustInfo.border}>{trustInfo.name}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Compatibility: <span className="text-emerald-400 font-bold">{conn.compatibilityScore || 80}%</span></p>
                      </div>
                      <button onClick={() => setSelectedConn(isSelected ? null : conn.id)}
                        className="glass-card p-2 hover:border-primary/30 transition-all border border-transparent">
                        <ChevronRight className={"w-4 h-4 text-muted-foreground transition-transform " + (isSelected ? "rotate-90" : "")} />
                      </button>
                    </div>
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">Update trust level:</p>
                        <div className="grid grid-cols-5 gap-2">
                          {TRUST_LEVELS.map(({ level, name, icon, color, bg, border }) => (
                            <button key={level}
                              onClick={() => updateTrust.mutate({ targetWingmanId: conn.targetWingmanId || conn.id, level: level as any })}
                              className={"p-2 rounded-xl text-center border transition-all " + (conn.trustLevel === level ? bg + " " + border : "bg-muted/10 border-muted/20 hover:border-primary/30")}>
                              <div className="text-lg mb-1">{icon}</div>
                              <p className={"text-[9px] font-medium " + (conn.trustLevel === level ? color : "text-muted-foreground")}>{name}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!connections || connections.length === 0) && (
                <div className="glass-card p-12 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold mb-2">No connections yet</h3>
                  <p className="text-muted-foreground text-sm">Your Wingman will add connections here as it makes introductions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
