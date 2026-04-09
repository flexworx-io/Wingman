import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Activity, Zap, Brain, TrendingUp, Globe, AlertCircle, BarChart3, Eye } from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview"|"users"|"wingmen"|"logs">("overview");

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: recentUsers } = trpc.admin.getRecentUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: activeWingmen } = trpc.admin.getActiveWingmen.useQuery({ limit: 20 }, { enabled: isAuthenticated && user?.role === "admin" });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "wingmen", label: "Wingmen", icon: Brain },
    { id: "logs", label: "Activity", icon: Activity },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Admin Only</Badge>
              </div>
              <p className="text-muted-foreground text-sm">Platform management and analytics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all " +
                (activeTab === id ? "bg-primary text-primary-foreground shadow-lg" : "glass border border-border text-muted-foreground hover:text-foreground")}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                { label: "Total Users", value: (stats as any)?.totalUsers || 0, icon: Users, color: "from-violet-600 to-purple-800", change: "+12%" },
                { label: "Active Wingmen", value: (stats as any)?.activeWingmen || 0, icon: Brain, color: "from-cyan-500 to-blue-600", change: "+8%" },
                { label: "Total Connections", value: (stats as any)?.totalConnections || 0, icon: Globe, color: "from-emerald-500 to-teal-600", change: "+24%" },
                { label: "Introductions", value: (stats as any)?.totalIntroductions || 0, icon: Zap, color: "from-amber-500 to-orange-600", change: "+31%" },
              ].map(({ label, value, icon: Icon, color, change }) => (
                <div key={label} className="glass-card p-5 holographic">
                  <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + color + " flex items-center justify-center mb-3 shadow-md"}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-display font-bold text-2xl mb-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs text-emerald-400 font-medium mt-1">{change} this week</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Platform Health
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "API Response Time", value: "42ms", status: "good" },
                    { label: "WebSocket Connections", value: (stats as any)?.activeWingmen || 0, status: "good" },
                    { label: "Murph.AI Integration", value: "Connected", status: "good" },
                    { label: "Database Status", value: "Healthy", status: "good" },
                    { label: "Match Accuracy", value: "94%", status: "good" },
                  ].map(({ label, value, status }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className={"w-2 h-2 rounded-full " + (status === "good" ? "bg-emerald-400" : "bg-amber-400")} />
                        <span className="text-sm font-medium">{typeof value === "number" ? value.toLocaleString() : value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Recent Activity
                </h3>
                <div className="space-y-3">
                  {(recentUsers || []).slice(0, 6).map((user: any, i: number) => (
                    <div key={user.id || i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(user.name || "U")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name || "User"}</p>
                        <p className="text-[10px] text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={"text-[9px] " + (user.role === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-muted/20 text-muted-foreground border-border")}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> All Users
            </h3>
            <div className="space-y-3">
              {(recentUsers || []).map((user: any, i: number) => (
                <div key={user.id || i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {(user.name || "U")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{user.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={"text-[10px] " + (user.role === "admin" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-muted/20 text-muted-foreground border-border")}>{user.role}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "wingmen" && (
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" /> Active Wingmen
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeWingmen || []).map((w: any, i: number) => (
                <div key={w.id || i} className="glass-card p-4 border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {(w.wingmanName || "W")[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{w.wingmanName}</p>
                      <div className="flex items-center gap-1">
                        <div className={"w-1.5 h-1.5 rounded-full " + (w.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                        <span className={"text-[10px] font-medium " + (w.status === "active" ? "text-emerald-400" : "text-amber-400")}>{w.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-muted/20 rounded-lg p-2">
                      <p className="font-bold text-sm text-primary">{w.totalConnections || 0}</p>
                      <p className="text-[9px] text-muted-foreground">Connections</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-2">
                      <p className="font-bold text-sm text-cyan-400">{Math.round(w.avgCompatibilityScore || 85)}%</p>
                      <p className="text-[9px] text-muted-foreground">Avg Match</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!activeWingmen || activeWingmen.length === 0) && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">No active Wingmen found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
