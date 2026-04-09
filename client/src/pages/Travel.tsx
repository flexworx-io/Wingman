import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Plane, Users, Zap, Calendar, Navigation } from "lucide-react";
import { toast } from "sonner";

export default function Travel() {
  const { isAuthenticated } = useAuth();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: activeTravel, refetch } = trpc.travel.getActiveTravel.useQuery(undefined, { enabled: isAuthenticated });
  const { data: friendsNearby } = trpc.travel.getFriendsNearby.useQuery(
    { city: "San Francisco" },
    { enabled: isAuthenticated }
  );

  const recordTravel = trpc.travel.recordTravel.useMutation({
    onSuccess: () => { toast.success("Travel registered! Your Wingman will alert nearby connections."); refetch(); },
    onError: () => toast.error("Could not register travel"),
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Travel Intelligence</h1>
              <p className="text-muted-foreground text-sm">Your Wingman detects connections in your travel area</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 holographic">
              <h2 className="font-display font-semibold mb-5 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" /> Register Travel
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Destination City</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full glass border border-border rounded-xl px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Arrival</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full glass border border-border rounded-xl px-3 py-3 text-sm bg-transparent focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Departure</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="w-full glass border border-border rounded-xl px-3 py-3 text-sm bg-transparent focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                </div>
              </div>
              <Button className="btn-aurora w-full" disabled={!destination || !startDate}
                onClick={() => recordTravel.mutate({ city: destination, country: undefined, lat: 37.7749, lng: -122.4194 })}>
                <Navigation className="w-4 h-4 mr-2" /> Register Travel & Alert Wingman
              </Button>
            </div>

            {activeTravel && (
              <div className="glass-card p-6 border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <h3 className="font-display font-semibold text-blue-400">Active Travel</h3>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg">{(activeTravel as any)?.[0]?.travelEvent?.city || destination}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date((activeTravel as any)?.[0]?.travelEvent?.startDate).toLocaleDateString()} — {(activeTravel as any)?.[0]?.travelEvent?.endDate ? new Date((activeTravel as any)?.[0]?.travelEvent?.endDate).toLocaleDateString() : "Open-ended"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" /> Friends Nearby
                </h2>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  {friendsNearby?.length || 0} detected
                </Badge>
              </div>
              <div className="space-y-3">
                {(friendsNearby || []).map((friend: any, i: number) => (
                  <div key={friend.id || i} className="glass-card p-4 border border-transparent hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {(friend.wingmanName || "W")[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{friend.wingmanName || "Wingman"}</p>
                        <p className="text-xs text-muted-foreground">{friend.distanceKm || 0 ? Math.round(friend.distanceKm || 0) + " km away" : "Nearby"}</p>
                      </div>
                      <Button size="sm" className="btn-aurora text-xs">
                        <Zap className="w-3 h-3 mr-1" /> Connect
                      </Button>
                    </div>
                  </div>
                ))}
                {(!friendsNearby || friendsNearby.length === 0) && (
                  <div className="glass-card p-8 text-center">
                    <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No connections detected nearby. Register your travel to alert your network.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> How It Works
              </h3>
              <div className="space-y-4">
                {[
                  { step: "01", title: "Register Travel", desc: "Tell your Wingman where you're going and when." },
                  { step: "02", title: "Wingman Scans", desc: "AI scans your network for connections in that area." },
                  { step: "03", title: "Get Alerts", desc: "Receive notifications about nearby connections." },
                  { step: "04", title: "Arrange Meetups", desc: "Your Wingman coordinates introductions and meetups." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">{step}</div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-display font-semibold mb-4 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" /> Privacy Controls
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Share exact location", enabled: false },
                  { label: "Share city only", enabled: true },
                  { label: "Alert connections", enabled: true },
                  { label: "Allow meetup requests", enabled: true },
                ].map(({ label, enabled }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <div className={"w-9 h-5 rounded-full transition-colors " + (enabled ? "bg-primary" : "bg-muted/30")}>
                      <div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 " + (enabled ? "translate-x-4" : "translate-x-0.5")} />
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
