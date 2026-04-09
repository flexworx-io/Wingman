import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, Play, Sparkles, Clock, Eye, Brain, Zap } from "lucide-react";
import { toast } from "sonner";

export default function WingmanTV() {
  const { isAuthenticated } = useAuth();
  const [playing, setPlaying] = useState<number | null>(null);

  const { data: stories, refetch } = trpc.wingman.getStories.useQuery(undefined, { enabled: isAuthenticated });
  const generateStory = trpc.wingman.generateStory.useMutation({
    onSuccess: () => { toast.success("New episode generated!"); refetch(); },
    onError: () => toast.error("Could not generate story"),
  });
  const markWatched = trpc.wingman.markStoryWatched.useMutation();

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">Wingman TV</h1>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">AI Stories</Badge>
                </div>
                <p className="text-muted-foreground text-sm">AI-generated story summaries of your connection adventures</p>
              </div>
            </div>
            <Button className="btn-aurora" onClick={() => generateStory.mutate({})} disabled={generateStory.isPending}>
              {generateStory.isPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Episode</>
              )}
            </Button>
          </div>
        </div>

        {playing !== null && stories && (
          <div className="glass-card p-6 mb-8 border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-display font-bold text-xl">{(stories as any[])[playing]?.title}</h2>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-medium">NOW PLAYING</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{(stories as any[])[playing]?.content || (stories as any[])[playing]?.summary}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date((stories as any[])[playing]?.createdAt).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><Eye className="w-3 h-3" />{(stories as any[])[playing]?.viewCount || 0} views</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setPlaying(null)}>Close</Button>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(stories as any[] || []).map((story: any, i: number) => (
            <div key={story.id || i}
              className={"glass-card p-5 border transition-all cursor-pointer group " + (playing === i ? "border-amber-500/40 bg-amber-500/5" : "border-transparent hover:border-amber-500/20")}
              onClick={() => { setPlaying(i); markWatched.mutate({ storyId: story.id }); }}>
              <div className="flex items-start gap-3 mb-4">
                <div className={"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-110 " + (playing === i ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-muted/30")}>
                  {playing === i ? <Play className="w-5 h-5 text-white" /> : <Tv className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{story.title}</h3>
                  <div className="flex items-center gap-2">
                    {story.isWatched && <Badge className="text-[9px] bg-muted/20 text-muted-foreground border-border">Watched</Badge>}
                    <span className="text-[10px] text-muted-foreground">{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{story.summary}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Eye className="w-3 h-3" />{story.viewCount || 0} views
                </div>
                <Button size="sm" className={"text-xs " + (playing === i ? "btn-aurora" : "glass border border-border hover:border-amber-500/30")}>
                  {playing === i ? "Playing" : "Watch"}
                </Button>
              </div>
            </div>
          ))}
          {(!stories || (stories as any[]).length === 0) && (
            <div className="col-span-3 glass-card p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Tv className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">No Episodes Yet</h3>
              <p className="text-muted-foreground mb-6">Generate your first Wingman TV episode to see AI-powered story summaries of your connection adventures.</p>
              <Button className="btn-aurora px-8" onClick={() => generateStory.mutate({})}>
                <Sparkles className="w-4 h-4 mr-2" /> Generate First Episode
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
