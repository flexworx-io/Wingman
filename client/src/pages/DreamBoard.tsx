import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Sparkles, Brain, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const COLORS = [
  "from-violet-600 to-purple-800", "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600", "from-indigo-500 to-violet-600",
];

export default function DreamBoard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: dreamBoard } = trpc.discovery.getDreamBoard.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });

  const initiateIntro = trpc.discovery.initiateIntro.useMutation({
    onSuccess: () => toast.success("Introduction initiated! Your Wingman will handle it."),
    onError: () => toast.error("Could not initiate introduction"),
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">Dream Board</h1>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">AI Curated</Badge>
                </div>
                <p className="text-muted-foreground text-sm">Your Wingman's gallery of potential connections</p>
              </div>
            </div>
            <Button className="btn-aurora" onClick={() => navigate("/discovery")}>
              <Sparkles className="w-4 h-4 mr-2" /> Find More
            </Button>
          </div>
        </div>

        {(!dreamBoard || (dreamBoard as any[]).length === 0) ? (
          <div className="glass-card p-20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse-glow">
              <Star className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Your Dream Board Awaits</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">Your Wingman is scanning thousands of profiles to curate your perfect Dream Board.</p>
            <Button className="btn-aurora px-8 py-4 rounded-xl" onClick={() => navigate("/discovery")}>
              <Brain className="w-4 h-4 mr-2" /> Explore Spaces
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(dreamBoard as any[]).map((entry: any, i: number) => (
              <div key={entry.id || i} className="glass-card p-5 border border-transparent hover:border-primary/20 transition-all group cursor-pointer">
                <div className="relative mb-4">
                  <div className={"w-full h-32 rounded-xl bg-gradient-to-br " + COLORS[i % COLORS.length] + " flex items-center justify-center shadow-lg group-hover:scale-[1.02] transition-transform"}>
                    <span className="text-4xl font-bold text-white/80">{(entry.wingmanName || "W")[0]}</span>
                  </div>
                  <div className="absolute -bottom-3 -right-3 glass-card px-2 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                    <span className="text-xs font-bold text-emerald-400">{entry.compatibilityScore || 80}%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-display font-bold text-lg mb-0.5">{entry.wingmanName || "Wingman"}</h3>
                  <p className="text-xs text-muted-foreground capitalize mb-3">{entry.socialMode || "friendship"} mode</p>
                  {entry.sharedInterests && entry.sharedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.sharedInterests.slice(0, 3).map((interest: string) => (
                        <Badge key={interest} className="text-[9px] bg-muted/20 text-muted-foreground border-border">{interest}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full" style={{ width: (entry.compatibilityScore || 80) + "%" }} />
                  </div>
                  <Button size="sm" className="btn-aurora w-full text-xs"
                    onClick={() => wingman && initiateIntro.mutate({ targetWingmanId: entry.targetWingmanId || entry.id })}>
                    <Zap className="w-3 h-3 mr-1" /> Introduce Wingmen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
