import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Users, Heart, Brain, Zap, ArrowRight, Globe, Target, Sparkles, Star, Filter } from "lucide-react";
import { toast } from "sonner";

const SPACE_ICONS: Record<string, string> = {
  "Tech Hub": "\u{1F4BB}", "Creative Studio": "\u{1F3A8}", "Wellness Garden": "\u{1F33F}",
  "Business Lounge": "\u{1F4BC}", "Adventure Base": "\u{1F3D4}", "Music Hall": "\u{1F3B5}",
  "Philosophy Circle": "\u{1F914}", "Fitness Arena": "\u{1F4AA}", "Startup Garage": "\u{1F680}",
};

const SPACE_COLORS = [
  "from-violet-600 to-purple-800", "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600", "from-indigo-500 to-violet-600",
];

const SOCIAL_MODES = [
  { id: "all", label: "All Modes", emoji: "\u2728" },
  { id: "friendship", label: "Friendship", emoji: "\u{1F91D}" },
  { id: "dating", label: "Dating", emoji: "\u{1F495}" },
  { id: "business", label: "Business", emoji: "\u{1F4BC}" },
  { id: "family", label: "Family", emoji: "\u{1F3E1}" },
];

export default function Discovery() {
  const { isAuthenticated } = useAuth();
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const { data: spaces, refetch: refetchSpaces } = trpc.discovery.getSpaces.useQuery(
    { socialMode: selectedMode === "all" ? undefined : selectedMode }
  );
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: dreamBoard } = trpc.discovery.getDreamBoard.useQuery(undefined, { enabled: isAuthenticated });
  const { data: matches } = trpc.discovery.getMatches.useQuery(
    { limit: 12, socialMode: selectedMode === "all" ? undefined : selectedMode },
    { enabled: isAuthenticated }
  );

  const joinSpace = trpc.discovery.joinSpace.useMutation({
    onSuccess: () => { toast.success("Your Wingman entered the space!"); refetchSpaces(); },
    onError: () => toast.error("Could not enter space"),
  });
  const leaveSpace = trpc.discovery.leaveSpace.useMutation({
    onSuccess: () => { toast.success("Left the space"); refetchSpaces(); },
  });
  const initiateIntro = trpc.discovery.initiateIntro.useMutation({
    onSuccess: () => toast.success("Introduction initiated! Your Wingman will handle it."),
    onError: () => toast.error("Could not initiate introduction"),
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Discovery Engine</h1>
              <p className="text-muted-foreground text-sm">Your Wingman explores virtual spaces to find compatible connections</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {SOCIAL_MODES.map(({ id, label, emoji }) => (
            <button key={id} onClick={() => setSelectedMode(id)}
              className={"flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap " +
                (selectedMode === id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "glass border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground")}>
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" /> Virtual Spaces
                </h2>
                <Badge className="bg-muted/30 text-muted-foreground border-border text-xs">{spaces?.length || 0} spaces</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {(spaces || []).map((space: any, i: number) => {
                  const colorClass = SPACE_COLORS[i % SPACE_COLORS.length];
                  const icon = SPACE_ICONS[space.name] || "\u{1F310}";
                  return (
                    <div key={space.id} className="glass-card p-5 border border-transparent hover:border-primary/20 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + colorClass + " flex items-center justify-center text-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1">{space.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{space.description}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users className="w-3 h-3" /><span>{space.activeUsers || 0} active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button size="sm" className="btn-aurora text-xs w-full"
                          onClick={() => wingman && joinSpace.mutate({ spaceId: space.id })}>
                          <Zap className="w-3 h-3 mr-1" /> Enter Space
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {(!spaces || spaces.length === 0) && (
                  <div className="col-span-2 glass-card p-12 text-center">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading virtual spaces...</p>
                  </div>
                )}
              </div>
            </div>

            {isAuthenticated && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Compatibility Matches
                  </h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{matches?.length || 0} found</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(matches || []).map((match: any, i: number) => (
                    <div key={match.id || i} className="glass-card p-4 border border-transparent hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + SPACE_COLORS[i % SPACE_COLORS.length] + " flex items-center justify-center text-sm font-bold text-white shadow-md"}>
                          {(match.wingmanName || "W")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{match.wingmanName || "Wingman"}</p>
                          <p className="text-xs font-bold text-emerald-400">{match.compatibilityScore || 80}% match</p>
                        </div>
                      </div>
                      <Button size="sm" className="btn-aurora w-full text-xs"
                        onClick={() => wingman && initiateIntro.mutate({ targetWingmanId: match.id })}>
                        <Sparkles className="w-3 h-3 mr-1" /> Introduce Wingmen
                      </Button>
                    </div>
                  ))}
                  {(!matches || matches.length === 0) && (
                    <div className="col-span-2 glass-card p-8 text-center">
                      <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Your Wingman is scanning for matches...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 sticky top-24 h-fit">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Dream Board
              </h2>
              <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Top Picks</Badge>
            </div>
            <div className="space-y-3">
              {(dreamBoard || []).slice(0, 8).map((entry: any, i: number) => (
                <div key={entry.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className={"w-9 h-9 rounded-xl bg-gradient-to-br " + SPACE_COLORS[i % SPACE_COLORS.length] + " flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0 group-hover:scale-110 transition-transform"}>
                    {(entry.wingmanName || "W")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.wingmanName || "Wingman"}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{entry.socialMode || "friendship"}</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">{entry.compatibilityScore || 80}%</p>
                </div>
              ))}
              {(!dreamBoard || dreamBoard.length === 0) && (
                <div className="text-center py-6">
                  <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Your Wingman is curating your Dream Board...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
