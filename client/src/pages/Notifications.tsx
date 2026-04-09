import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Zap, Heart, Shield, Globe, Star, Tv } from "lucide-react";
import { toast } from "sonner";

const NOTIF_ICONS: Record<string, any> = {
  connection: Heart, introduction: Zap, trust: Shield, travel: Globe, match: Star, story: Tv,
};

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { data: notifications, refetch } = trpc.notifications.getAll.useQuery({ limit: 50 }, { enabled: isAuthenticated });
  const { data: prefs } = trpc.notifications.getPreferences.useQuery(undefined, { enabled: isAuthenticated });

  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { toast.success("All marked as read"); refetch(); } });
  const updatePrefs = trpc.notifications.updatePreferences.useMutation({ onSuccess: () => toast.success("Preferences saved") });

  const unread = (notifications || []).filter((n: any) => !n.isRead).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">Notifications</h1>
                  {unread > 0 && <Badge className="bg-primary text-primary-foreground text-xs">{unread} new</Badge>}
                </div>
                <p className="text-muted-foreground text-sm">Stay updated on your Wingman's activity</p>
              </div>
            </div>
            {unread > 0 && (
              <Button variant="outline" className="glass border-border text-sm" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {(notifications || []).map((notif: any, i: number) => {
              const Icon = NOTIF_ICONS[notif.type] || Bell;
              return (
                <div key={notif.id || i}
                  className={"glass-card p-4 border transition-all " + (!notif.isRead ? "border-primary/20 bg-primary/5" : "border-transparent hover:border-primary/10")}
                  onClick={() => !notif.isRead && markRead.mutate({ notificationId: notif.id })}>
                  <div className="flex items-start gap-4">
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md " + (!notif.isRead ? "bg-primary/20" : "bg-muted/20")}>
                      <Icon className={"w-5 h-5 " + (!notif.isRead ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={"font-semibold text-sm " + (!notif.isRead ? "text-foreground" : "text-muted-foreground")}>{notif.title}</p>
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!notifications || notifications.length === 0) && (
              <div className="glass-card p-16 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground text-sm">Your Wingman will notify you when something important happens.</p>
              </div>
            )}
          </div>

          <div className="glass-card p-6 h-fit">
            <h3 className="font-display font-semibold mb-5 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Preferences
            </h3>
            <div className="space-y-4">
              {[
                { key: "compatibilityMatch", label: "Compatibility Matches", desc: "New high-score matches" },
                { key: "travelAlert", label: "Travel Alerts", desc: "Friends in your area" },
                { key: "conferenceMatch", label: "Conference Matches", desc: "Event attendee matches" },
                { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of Wingman activity" },
                { key: "pushEnabled", label: "Push Notifications", desc: "Browser push alerts" },
                { key: "emailEnabled", label: "Email Notifications", desc: "Email summaries" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <button
                    onClick={() => updatePrefs.mutate({ [key]: !(prefs as any)?.[key] })}
                    className={"w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 " + ((prefs as any)?.[key] ? "bg-primary" : "bg-muted/30")}>
                    <div className={"w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 " + ((prefs as any)?.[key] ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
