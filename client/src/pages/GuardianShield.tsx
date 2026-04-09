/**
 * Guardian Shield™ — Safety & Trust Hub
 * Covers: Guardian Pulse, Trust Contacts, Safe Meet™, Panic Mode™,
 *         Verified Adult, Incident Reporting, Content Safety
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Phone, UserCheck, MapPin, AlertTriangle, Heart, Users, Eye, FileText, Activity } from "lucide-react";

// ─── GUARDIAN PULSE PANEL ─────────────────────────────────────────────────────
function GuardianPulsePanel() {
  const { data: summary, isLoading } = trpc.guardian.pulse.getSummary.useQuery();

  if (isLoading) return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  if (!summary) return null;

  const statusColors: Record<string, string> = {
    safe: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    moderate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    elevated: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    critical: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  const statusLabel: Record<string, string> = {
    safe: "All Clear",
    moderate: "Moderate",
    elevated: "Elevated",
    critical: "Critical",
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5 text-cyan-400" />
          Guardian Pulse™
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-xl border p-4 text-center ${statusColors[summary.overallSafetyStatus]}`}>
            <div className="text-2xl font-bold">{statusLabel[summary.overallSafetyStatus]}</div>
            <div className="text-xs mt-1 opacity-70">Safety Status</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-white">{summary.openRiskCount}</div>
            <div className="text-xs mt-1 text-slate-400">Open Risks</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-white">{summary.activePanicCount}</div>
            <div className="text-xs mt-1 text-slate-400">Active Panics</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-white">{summary.trustContactCount}</div>
            <div className="text-xs mt-1 text-slate-400">Trust Contacts</div>
          </div>
        </div>

        {summary.recentRisks.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-400 mb-2">Recent Risk Events</div>
            <div className="space-y-2">
              {summary.recentRisks.slice(0, 3).map((risk) => (
                <div key={risk.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-white capitalize">{risk.riskType.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className={
                    risk.severityBand === "critical" ? "border-red-500 text-red-400" :
                    risk.severityBand === "high" ? "border-orange-500 text-orange-400" :
                    "border-yellow-500 text-yellow-400"
                  }>
                    {risk.severityBand}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TRUST CONTACTS PANEL ─────────────────────────────────────────────────────
function TrustContactsPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", phone: "", email: "" });
  const utils = trpc.useUtils();

  const { data: contacts = [], isLoading } = trpc.guardian.trustContacts.list.useQuery();

  const addMutation = trpc.guardian.trustContacts.add.useMutation({
    onSuccess: () => {
      utils.guardian.trustContacts.list.invalidate();
      setOpen(false);
      setForm({ name: "", relationship: "", phone: "", email: "" });
      toast.success("Trust contact added");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.guardian.trustContacts.remove.useMutation({
    onSuccess: () => {
      utils.guardian.trustContacts.list.invalidate();
      toast.success("Contact removed");
    },
  });

  return (
    <Card className="border-0 bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <Users className="w-4 h-4 text-cyan-400" />
          Trust Contacts
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">Add Contact</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Trust Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300">Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-slate-300">Relationship</Label>
                <Input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Mom, Best Friend" />
              </div>
              <div>
                <Label className="text-slate-300">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="+1 555 000 0000" />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="email@example.com" type="email" />
              </div>
              <Button
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => addMutation.mutate({ name: form.name, relationship: form.relationship, phone: form.phone || undefined, email: form.email || undefined })}
                disabled={!form.name || !form.relationship || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-slate-800 rounded-lg" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No trust contacts yet. Add people who should be notified in an emergency.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-white">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.relationship} {c.phone ? `· ${c.phone}` : ""}</div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => removeMutation.mutate({ id: c.id })}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SAFE MEET™ PANEL ─────────────────────────────────────────────────────────
function SafeMeetPanel() {
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("60");
  const [activeMeetup, setActiveMeetup] = useState<{
    meetupId: number;
    riskScore: number;
    severityBand: string;
    checkinSchedule: Array<{ label: string; offsetMinutes: number; completed: boolean }>;
    safetyTips: string[];
  } | null>(null);
  const utils = trpc.useUtils();

  const startMutation = trpc.guardian.safeMeet.startMeetup.useMutation({
    onSuccess: (data) => {
      setActiveMeetup(data);
      setOpen(false);
      toast.success("Safe Meet™ session started. Check in at each milestone.");
    },
    onError: (e) => toast.error(e.message),
  });

  const checkinMutation = trpc.guardian.safeMeet.checkin.useMutation({
    onSuccess: (data) => {
      if (data.allCheckinsComplete) {
        setActiveMeetup(null);
        toast.success("All check-ins complete. Stay safe!");
      } else {
        toast.success("Check-in recorded");
        if (activeMeetup) {
          setActiveMeetup(prev => prev ? {
            ...prev,
            checkinSchedule: prev.checkinSchedule.map(item =>
              item.completed ? item : { ...item }
            )
          } : null);
        }
      }
      utils.guardian.safeMeet.getMySessions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="border-0 bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <MapPin className="w-4 h-4 text-emerald-400" />
          Safe Meet™
        </CardTitle>
        {!activeMeetup && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Start Session</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Start Safe Meet™ Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300">Meeting With (User ID)</Label>
                  <Input value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="User ID" type="number" />
                </div>
                <div>
                  <Label className="text-slate-300">Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white" placeholder="Coffee shop, park, etc." />
                </div>
                <div>
                  <Label className="text-slate-300">Duration (minutes)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {[30, 60, 90, 120, 180].map(d => (
                        <SelectItem key={d} value={String(d)} className="text-white">{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => startMutation.mutate({
                    targetUserId: parseInt(targetUserId),
                    plannedLocation: location || undefined,
                    durationEstimateMinutes: parseInt(duration),
                    trustContactVisibility: true,
                  })}
                  disabled={!targetUserId || startMutation.isPending}
                >
                  {startMutation.isPending ? "Starting..." : "Start Safe Meet™"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {activeMeetup ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3">
              <span className="text-emerald-400 font-medium text-sm">Session Active</span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                Risk: {(activeMeetup.riskScore * 100).toFixed(0)}% {activeMeetup.severityBand}
              </Badge>
            </div>
            <div className="space-y-2">
              {activeMeetup.checkinSchedule.map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.completed ? "bg-emerald-400" : "bg-slate-600"}`} />
                    <span className={`text-sm ${item.completed ? "text-slate-400 line-through" : "text-white"}`}>
                      {item.label}
                    </span>
                  </div>
                  {!item.completed && (
                    <Button size="sm" variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => checkinMutation.mutate({ meetupId: activeMeetup.meetupId, checkinLabel: item.label, status: "safe" })}>
                      Check In
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-slate-800/30 rounded-xl p-3">
              <div className="text-xs font-medium text-slate-400 mb-2">Safety Tips</div>
              {activeMeetup.safetyTips.slice(0, 3).map((tip, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-1 mb-1">
                  <span className="text-emerald-400 mt-0.5">•</span> {tip}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Start a Safe Meet™ session before meeting someone in person. We'll schedule check-ins and alert your trust contacts if needed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PANIC MODE™ BUTTON ───────────────────────────────────────────────────────
function PanicModePanel() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: activePanic } = trpc.guardian.panic.getActive.useQuery();

  const activateMutation = trpc.guardian.panic.activate.useMutation({
    onSuccess: (data) => {
      utils.guardian.panic.getActive.invalidate();
      utils.guardian.pulse.getSummary.invalidate();
      setConfirmOpen(false);
      toast.error(`🚨 PANIC MODE ACTIVATED — ${data.contactsNotified.length} contacts notified`, { duration: 10000 });
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveMutation = trpc.guardian.panic.resolve.useMutation({
    onSuccess: () => {
      utils.guardian.panic.getActive.invalidate();
      utils.guardian.pulse.getSummary.invalidate();
      toast.success("Panic resolved. Stay safe.");
    },
  });

  const isActive = activePanic && activePanic.length > 0;

  return (
    <Card className={`border-0 ${isActive ? "bg-red-950/50 border border-red-500/50" : "bg-slate-900"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <AlertTriangle className={`w-4 h-4 ${isActive ? "text-red-400 animate-pulse" : "text-red-400"}`} />
          Panic Mode™
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <div className="space-y-4">
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2 animate-pulse" />
              <div className="text-red-400 font-bold text-lg">PANIC MODE ACTIVE</div>
              <div className="text-red-300/70 text-sm mt-1">Your trust contacts have been notified</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-slate-700 hover:bg-slate-600 text-white"
                onClick={() => resolveMutation.mutate({ panicId: activePanic[0].id, resolution: "false_alarm" })}
                disabled={resolveMutation.isPending}
              >
                False Alarm
              </Button>
              <Button
                className="bg-emerald-700 hover:bg-emerald-600 text-white"
                onClick={() => resolveMutation.mutate({ panicId: activePanic[0].id, resolution: "resolved" })}
                disabled={resolveMutation.isPending}
              >
                I'm Safe
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Press and hold the Panic button to immediately alert your trust contacts with your location.
            </p>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg rounded-xl">
                  🚨 ACTIVATE PANIC MODE
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-red-500/50">
                <DialogHeader>
                  <DialogTitle className="text-red-400 text-xl">Activate Panic Mode?</DialogTitle>
                </DialogHeader>
                <p className="text-slate-300 text-sm">
                  This will immediately notify all your trust contacts that you need help. Only use this in a real emergency.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    onClick={() => activateMutation.mutate({ triggerType: "manual" })}
                    disabled={activateMutation.isPending}
                  >
                    {activateMutation.isPending ? "Activating..." : "Yes, Alert Contacts"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── INCIDENT REPORTING PANEL ─────────────────────────────────────────────────
function IncidentReportPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subjectUserId: "", incidentType: "", severity: "medium", description: "" });
  const utils = trpc.useUtils();

  const reportMutation = trpc.guardian.incidents.report.useMutation({
    onSuccess: () => {
      utils.guardian.incidents.myReports.invalidate();
      setOpen(false);
      setForm({ subjectUserId: "", incidentType: "", severity: "medium", description: "" });
      toast.success("Incident reported. Our Trust & Safety team will review it.");
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: reports = [] } = trpc.guardian.incidents.myReports.useQuery();

  return (
    <Card className="border-0 bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <FileText className="w-4 h-4 text-orange-400" />
          Report Incident
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
              Report
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Report an Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-300">Subject User ID</Label>
                <Input value={form.subjectUserId} onChange={e => setForm(f => ({ ...f, subjectUserId: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="User ID" type="number" />
              </div>
              <div>
                <Label className="text-slate-300">Incident Type</Label>
                <Select value={form.incidentType} onValueChange={v => setForm(f => ({ ...f, incidentType: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {["grooming", "scam", "harassment", "impersonation", "violence_threat", "self_harm", "other"].map(t => (
                      <SelectItem key={t} value={t} className="text-white capitalize">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {["low", "medium", "high", "critical"].map(s => (
                      <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="Describe what happened..." rows={4} />
              </div>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => reportMutation.mutate({
                  subjectUserId: parseInt(form.subjectUserId),
                  incidentType: form.incidentType as "grooming" | "scam" | "harassment" | "impersonation" | "csam" | "violence_threat" | "self_harm" | "other",
                  severity: form.severity as "low" | "medium" | "high" | "critical",
                  description: form.description || undefined,
                })}
                disabled={!form.subjectUserId || !form.incidentType || reportMutation.isPending}
              >
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No incident reports</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-sm text-white capitalize">{r.incidentType?.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    r.severity === "critical" ? "border-red-500 text-red-400" :
                    r.severity === "high" ? "border-orange-500 text-orange-400" :
                    "border-slate-500 text-slate-400"
                  }>
                    {r.severity}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {r.caseStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── TRUST & SAFETY OPS CONSOLE (admin only) ──────────────────────────────────
function TrustSafetyOpsConsole() {
  const { user } = useAuth();
  const [incidentStatus, setIncidentStatus] = useState<string | undefined>(undefined);
  const [riskSeverity, setRiskSeverity] = useState<string | undefined>(undefined);
  const utils = trpc.useUtils();

  const { data: stats } = trpc.guardian.ops.getPlatformSafetyStats.useQuery();
  const { data: incidents = [] } = trpc.guardian.ops.listIncidents.useQuery({
    status: incidentStatus as "open" | "under_review" | "action_taken" | "closed" | "appealed" | undefined,
    limit: 20,
  });
  const { data: riskEvents = [] } = trpc.guardian.ops.listRiskEvents.useQuery({
    severityBand: riskSeverity as "low" | "moderate" | "elevated" | "high" | "critical" | undefined,
    limit: 20,
  });

  const updateIncidentMutation = trpc.guardian.ops.updateIncident.useMutation({
    onSuccess: () => {
      utils.guardian.ops.listIncidents.invalidate();
      toast.success("Incident updated");
    },
  });

  const resolveRiskMutation = trpc.guardian.ops.resolveRiskEvent.useMutation({
    onSuccess: () => {
      utils.guardian.ops.listRiskEvents.invalidate();
      toast.success("Risk event resolved");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16 text-slate-500">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Trust & Safety Ops Console is restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Incidents", value: stats.openIncidents, color: "text-orange-400" },
            { label: "Critical Risks", value: stats.criticalRisks, color: "text-red-400" },
            { label: "Active Panics", value: stats.activePanics, color: "text-red-400" },
            { label: "Verified Adults", value: stats.verifiedAdults, color: "text-emerald-400" },
          ].map(s => (
            <Card key={s.label} className="border-0 bg-slate-900">
              <CardContent className="pt-4 text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Incidents */}
      <Card className="border-0 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            Incident Queue
          </CardTitle>
          <Select value={incidentStatus ?? "all"} onValueChange={v => setIncidentStatus(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {["all", "open", "under_review", "action_taken", "closed"].map(s => (
                <SelectItem key={s} value={s} className="text-white text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {incidents.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No incidents found</div>
            ) : incidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm text-white capitalize">{inc.incidentType?.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-400">User {inc.reportedByUserId} → User {inc.subjectUserId}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    inc.severity === "critical" ? "border-red-500 text-red-400 text-xs" :
                    inc.severity === "high" ? "border-orange-500 text-orange-400 text-xs" :
                    "border-slate-500 text-slate-400 text-xs"
                  }>
                    {inc.severity}
                  </Badge>
                  {inc.caseStatus === "open" && (
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 text-xs h-6"
                      onClick={() => updateIncidentMutation.mutate({ id: inc.id, caseStatus: "under_review" })}>
                      Review
                    </Button>
                  )}
                  {inc.caseStatus === "under_review" && (
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs h-6"
                      onClick={() => updateIncidentMutation.mutate({ id: inc.id, caseStatus: "action_taken" })}>
                      Close
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Events */}
      <Card className="border-0 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            Risk Event Queue
          </CardTitle>
          <Select value={riskSeverity ?? "all"} onValueChange={v => setRiskSeverity(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {["all", "critical", "high", "elevated", "moderate", "low"].map(s => (
                <SelectItem key={s} value={s} className="text-white text-xs capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {riskEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No risk events found</div>
            ) : riskEvents.map((evt) => (
              <div key={evt.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm text-white capitalize">{evt.riskType.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-400">User {evt.userId} · Score: {(evt.riskScore * 100).toFixed(0)}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={
                    evt.severityBand === "critical" ? "border-red-500 text-red-400 text-xs" :
                    evt.severityBand === "high" ? "border-orange-500 text-orange-400 text-xs" :
                    "border-yellow-500 text-yellow-400 text-xs"
                  }>
                    {evt.severityBand}
                  </Badge>
                  {evt.status === "open" && (
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-600 text-white text-xs h-6"
                      onClick={() => resolveRiskMutation.mutate({ id: evt.id, status: "resolved" })}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GuardianShield() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-slate-800 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Guardian Shield™</h1>
              <p className="text-sm text-slate-400">Your personal safety & trust protection system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="pulse" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="pulse" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Heart className="w-3 h-3 mr-1" /> Pulse
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Users className="w-3 h-3 mr-1" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="safemeet" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <MapPin className="w-3 h-3 mr-1" /> Safe Meet
            </TabsTrigger>
            <TabsTrigger value="panic" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <AlertTriangle className="w-3 h-3 mr-1" /> Panic
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <FileText className="w-3 h-3 mr-1" /> Report
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="ops" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Eye className="w-3 h-3 mr-1" /> Ops Console
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pulse">
            <GuardianPulsePanel />
          </TabsContent>

          <TabsContent value="contacts">
            <TrustContactsPanel />
          </TabsContent>

          <TabsContent value="safemeet">
            <SafeMeetPanel />
          </TabsContent>

          <TabsContent value="panic">
            <PanicModePanel />
          </TabsContent>

          <TabsContent value="report">
            <IncidentReportPanel />
          </TabsContent>

          {user?.role === "admin" && (
            <TabsContent value="ops">
              <TrustSafetyOpsConsole />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
