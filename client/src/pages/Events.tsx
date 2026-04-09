import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Zap, MapPin, Brain, Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Events() {
  const { isAuthenticated } = useAuth();
  const [selectedConf, setSelectedConf] = useState<number | null>(null);

  const { data: conferences } = trpc.events.getConferences.useQuery();
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(undefined, { enabled: isAuthenticated });
  const { data: briefing } = trpc.events.getConferenceBriefing.useQuery(
    { conferenceId: selectedConf! },
    { enabled: !!selectedConf && isAuthenticated }
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Conference Matching</h1>
              <p className="text-muted-foreground text-sm">Your Wingman finds the right people at every event</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" /> Upcoming Conferences
              </h2>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">{conferences?.length || 0} events</Badge>
            </div>
            <div className="space-y-4">
              {(conferences || []).map((conf: any, i: number) => {
                const isSelected = selectedConf === conf.id;
                return (
                  <div key={conf.id || i} className={"glass-card p-5 border transition-all cursor-pointer " + (isSelected ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-primary/20")}
                    onClick={() => setSelectedConf(isSelected ? null : conf.id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-display font-semibold">{conf.name}</h3>
                          <Badge className="text-[10px] bg-muted/20 text-muted-foreground border-border flex-shrink-0">{conf.industry}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{conf.location}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{conf.startDate ? new Date(conf.startDate).toLocaleDateString() : "TBD"}</div>
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" />{conf.attendeeCount || 0} attendees</div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{conf.description}</p>
                      </div>
                    </div>
                    {isSelected && briefing && (
                      <div className="mt-5 pt-5 border-t border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-sm">Wingman Briefing</h4>
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">AI Generated</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{(briefing as any).briefing}</p>
                        {(briefing as any).topMatches && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Top Matches at This Event:</p>
                            <div className="flex flex-wrap gap-2">
                              {((briefing as any).topMatches || []).map((match: any, j: number) => (
                                <Badge key={j} className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {match.wingmanName} — {match.score}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button className="btn-aurora mt-4 w-full" onClick={e => { e.stopPropagation(); toast.success("Registered! Your Wingman will find matches at this event."); }}>
                          <Zap className="w-4 h-4 mr-2" /> Register & Activate Wingman
                        </Button>
                      </div>
                    )}
                    {isSelected && !briefing && (
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Generating Wingman briefing...</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!conferences || conferences.length === 0) && (
                <div className="glass-card p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming conferences found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 holographic">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Conference Mode
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                When you attend a conference, your Wingman activates Conference Mode — scanning all registered attendees for compatibility matches and preparing personalized briefings.
              </p>
              <div className="space-y-2">
                {["Pre-event match scanning", "Real-time attendee alerts", "AI conversation starters", "Post-event follow-up"].map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{feature}</span>
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
