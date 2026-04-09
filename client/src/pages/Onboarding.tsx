import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles, Brain, Star, Shield, Zap, ChevronRight,
  CheckCircle, MessageSquare, RefreshCw, User,
  Target, Flame, ArrowRight, Clock, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InterviewQuestion {
  id: string;
  text: string;
  type: "open" | "scale" | "choice" | "scenario" | "rapid";
  traitSignals: string[];
  importance: number;
  layer: 1 | 2 | 3 | 4;
}

interface PredictionMoment {
  copy: string;
  traitSignals: string[];
  questionId: string;
}

interface SynthesisResult {
  name: string;
  tagline: string;
  catchphrase: string;
  aboutMe: string;
  explanation: string;
  chemistryScorePercent: number;
  overallConfidencePercent: number;
  originCardCopy: string;
  whyWeMatchedCopy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LAYER_LABELS = ["", "Getting to Know You", "Trait Probing", "Prediction Magic", "Deep Synthesis"];
const LAYER_COLORS = [
  "",
  "from-blue-600 to-cyan-500",
  "from-violet-600 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

const SOCIAL_MODES = [
  { id: "best_friend", label: "Best Friend", emoji: "🤝", desc: "Find genuine friends and companions", trpcMode: "best_friend" as const },
  { id: "dating_support", label: "Dating", emoji: "💕", desc: "Discover romantic connections", trpcMode: "dating_support" as const },
  { id: "business_networking", label: "Business", emoji: "💼", desc: "Build professional relationships", trpcMode: "business_networking" as const },
  { id: "family_coordinator", label: "Family", emoji: "🏡", desc: "Connect with family-oriented people", trpcMode: "family_coordinator" as const },
];

const AVATARS = [
  { id: "cartoon" as const, label: "Cosmic", emoji: "🌌", color: "from-violet-600 to-purple-800" },
  { id: "realistic" as const, label: "Aurora", emoji: "🌠", color: "from-cyan-500 to-blue-600" },
  { id: "fantasy" as const, label: "Mythic", emoji: "🔥", color: "from-orange-500 to-red-600" },
  { id: "aspirational" as const, label: "Stellar", emoji: "⭐", color: "from-yellow-400 to-orange-500" },
];

const STEPS = [
  { id: 1, title: "Welcome", icon: Sparkles },
  { id: 2, title: "Soul Forge", icon: Brain },
  { id: 3, title: "Social Mode", icon: Target },
  { id: 4, title: "Avatar", icon: Star },
  { id: 5, title: "Activate", icon: Zap },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);

  // Interview state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(12);
  const [answer, setAnswer] = useState("");
  const [scaleValue, setScaleValue] = useState(5);
  const [predictionMoment, setPredictionMoment] = useState<PredictionMoment | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [traitSnapshot, setTraitSnapshot] = useState<Record<string, number>>({});

  // Synthesis state
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [showForgeReveal, setShowForgeReveal] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);

  // Wingman creation state
  const [selectedMode, setSelectedMode] = useState(SOCIAL_MODES[0]);
  const [selectedAvatar, setSelectedAvatar] = useState<"cartoon" | "realistic" | "fantasy" | "aspirational">("cartoon");
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const answerRef = useRef<HTMLTextAreaElement>(null);

  // ─── tRPC mutations ─────────────────────────────────────────────────────────
  const startInterview = trpc.interview.start.useMutation();
  const submitAnswer = trpc.interview.answer.useMutation();
  const confirmPrediction = trpc.interview.confirmPrediction.useMutation();
  const runSynthesis = trpc.synthesis.synthesize.useMutation();
  const createWingman = trpc.wingman.createWingman.useMutation();
  const activateWingman = trpc.wingman.activateWingman.useMutation();
  const generateAvatar = trpc.soulForge.generateAvatar.useMutation();

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // ─── Start interview ─────────────────────────────────────────────────────────
  const handleStartInterview = async () => {
    try {
      const result = await startInterview.mutateAsync({ mode: "text" });
      setCurrentQuestion(result.question as InterviewQuestion);
      setTotalQuestions(result.totalQuestions);
      setInterviewStarted(true);
      setQuestionCount(0);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to start Soul Forge");
    }
  };

  // ─── Submit answer ───────────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    const answerText = currentQuestion.type === "scale"
      ? `Scale: ${scaleValue}/10`
      : answer.trim();
    if (!answerText && currentQuestion.type !== "scale") {
      toast.error("Please provide an answer");
      return;
    }

    try {
      const result = await submitAnswer.mutateAsync({
        questionId: currentQuestion.id,
        answer: answerText || `Scale: ${scaleValue}/10`,
        answerType: currentQuestion.type === "scale" ? "scale" : "text",
        scaleValue: currentQuestion.type === "scale" ? scaleValue : undefined,
      });

      setQuestionCount(result.questionCount);
      setTraitSnapshot(result.currentTraitSnapshot as Record<string, number>);
      setAnswer("");
      setScaleValue(5);

      if (result.predictionMoment) {
        setPredictionMoment(result.predictionMoment as PredictionMoment);
        setShowPrediction(true);
        // Store next question for after prediction
        if (result.nextQuestion) {
          setCurrentQuestion(result.nextQuestion as InterviewQuestion);
        } else if (result.isComplete) {
          setInterviewComplete(true);
        }
      } else if (result.isComplete) {
        setInterviewComplete(true);
        setCurrentQuestion(null);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion as InterviewQuestion);
        setTimeout(() => answerRef.current?.focus(), 100);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to submit answer");
    }
  };

  // ─── Confirm prediction ──────────────────────────────────────────────────────
  const handleConfirmPrediction = async (
    response: "confirmed" | "denied" | "softened" | "intensified"
  ) => {
    if (!predictionMoment) return;
    try {
      const result = await confirmPrediction.mutateAsync({
        questionId: predictionMoment.questionId,
        response,
      });
      toast.success(result.delightMessage);
      setShowPrediction(false);
      setPredictionMoment(null);

      // If interview is complete (already set before prediction), stay on complete screen
      // Otherwise the next question was already set in handleSubmitAnswer
      if (interviewComplete) return;
      if (!currentQuestion) {
        setInterviewComplete(true);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to confirm prediction");
    }
  };

  // ─── Run synthesis ───────────────────────────────────────────────────────────
  const handleSynthesize = async () => {
    setSynthesizing(true);
    try {
      const result = await runSynthesis.mutateAsync({ mode: selectedMode.trpcMode });
      setSynthesisResult(result as SynthesisResult);
      setShowForgeReveal(true);
      setRevealPhase(0);
      setTimeout(() => setRevealPhase(1), 800);
      setTimeout(() => setRevealPhase(2), 1800);
      setTimeout(() => setRevealPhase(3), 2800);
      setTimeout(() => setRevealPhase(4), 3800);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Synthesis failed — please complete the interview first");
    } finally {
      setSynthesizing(false);
    }
  };

  // ─── Generate avatar ─────────────────────────────────────────────────────────
  const handleGenerateAvatar = async () => {
    if (!synthesisResult) return;
    try {
      const topTraits = Object.entries(traitSnapshot)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k]) => k.replace(/_/g, " "));
      const result = await generateAvatar.mutateAsync({
        style: selectedAvatar,
        aesthetic: synthesisResult.tagline,
        personalityArchetype: synthesisResult.name,
        topTraits: topTraits.length > 0 ? topTraits : ["warmth", "curiosity", "energy"],
      });
      setGeneratedAvatarUrl(result.avatarUrl ?? null);
      toast.success("Avatar generated!");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Avatar generation failed");
    }
  };

  // ─── Create + activate Wingman ───────────────────────────────────────────────
  const handleActivate = async () => {
    if (!synthesisResult) return;
    setActivating(true);
    try {
      // Step 1: Create Wingman profile from MAESTRO synthesis result
      const { wingmanId } = await createWingman.mutateAsync({
        wingmanName: synthesisResult.name,
        tagline: synthesisResult.tagline,
        aboutMe: synthesisResult.aboutMe,
        catchphrase: synthesisResult.catchphrase,
        avatarUrl: generatedAvatarUrl ?? undefined,
        avatarStyle: selectedAvatar,
        socialMode: [selectedMode.id],
      });

      // Step 2: Activate Wingman (creates HSE in Murph.AI, sets onboardingCompleted)
      await activateWingman.mutateAsync({ wingmanId });

      toast.success(`${synthesisResult.name} is now live!`);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Activation failed");
      setActivating(false);
    }
  };

  // ─── Derived state ───────────────────────────────────────────────────────────
  const progress = Math.round((step / STEPS.length) * 100);
  const interviewProgress = totalQuestions > 0
    ? Math.round((questionCount / totalQuestions) * 100)
    : 0;
  const currentLayer = currentQuestion?.layer ?? (interviewComplete ? 4 : 1);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060612] text-white flex flex-col">
      {/* Fixed top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-white">Soul Forge™</span>
          </div>
          <div className="flex-1">
            <Progress value={progress} className="h-1.5 bg-white/10" />
          </div>
          <span className="text-xs text-white/40 shrink-0">Step {step}/{STEPS.length}</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                step >= s.id ? "bg-violet-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-2xl">

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1 — Welcome
          ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/50">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-full border border-violet-500/30 animate-pulse" />
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                  Welcome to Soul Forge™
                </h1>
                <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
                  I'm going to ask you a series of questions to understand who you really are — not just who you think you are. Then I'll forge your perfect AI Wingman.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: Brain, label: "4-Layer Interview", desc: "Adaptive questions" },
                  { icon: TrendingUp, label: "Trait Synthesis", desc: "Real-time analysis" },
                  { icon: Flame, label: "Forge Reveal", desc: "Cinematic activation" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <Icon className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-white/40">{desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <Clock className="w-4 h-4" />
                <span>About 8 minutes</span>
              </div>

              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-10 py-6 text-lg rounded-2xl shadow-lg shadow-violet-900/40"
              >
                Begin Soul Forge <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2 — Soul Forge Interview
          ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">

              {/* Not started yet */}
              {!interviewStarted && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-900/40">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">The Interview Begins</h2>
                  <p className="text-white/60 max-w-md mx-auto">
                    I'll ask you 12 adaptive questions across 4 layers. Be honest — the more real you are, the better your Wingman will be.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleStartInterview}
                    disabled={startInterview.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-8 py-5 text-base rounded-2xl"
                  >
                    {startInterview.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                    ) : (
                      <><MessageSquare className="w-4 h-4 mr-2" /> Start Interview</>
                    )}
                  </Button>
                </div>
              )}

              {/* ── Prediction Magic Moment overlay ── */}
              {showPrediction && predictionMoment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                  <div className="max-w-lg w-full bg-gradient-to-br from-amber-900/80 to-orange-900/60 border border-amber-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-amber-900/50 animate-in zoom-in duration-500">
                    <div className="text-4xl">✨</div>
                    <div>
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
                        Prediction Magic Moment™
                      </div>
                      <p className="text-xl font-semibold text-white leading-relaxed">
                        "{predictionMoment.copy}"
                      </p>
                    </div>
                    <p className="text-white/50 text-sm">Is this accurate?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Yes, exactly", value: "confirmed" as const, color: "bg-emerald-600 hover:bg-emerald-500" },
                        { label: "Even more so", value: "intensified" as const, color: "bg-amber-600 hover:bg-amber-500" },
                        { label: "Sort of", value: "softened" as const, color: "bg-blue-600 hover:bg-blue-500" },
                        { label: "Not really", value: "denied" as const, color: "bg-slate-600 hover:bg-slate-500" },
                      ].map(({ label, value, color }) => (
                        <Button
                          key={value}
                          onClick={() => handleConfirmPrediction(value)}
                          disabled={confirmPrediction.isPending}
                          className={`${color} text-white rounded-xl py-3`}
                        >
                          {confirmPrediction.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Active interview ── */}
              {interviewStarted && !interviewComplete && currentQuestion && !showPrediction && (
                <div className="space-y-5">
                  {/* Layer indicator + progress */}
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`bg-gradient-to-r ${LAYER_COLORS[currentLayer]} text-white border-0 px-3 py-1`}
                    >
                      Layer {currentLayer}: {LAYER_LABELS[currentLayer]}
                    </Badge>
                    <span className="text-white/40 text-sm">{questionCount}/{totalQuestions}</span>
                  </div>
                  <Progress value={interviewProgress} className="h-1 bg-white/10" />

                  {/* Live trait snapshot */}
                  {Object.keys(traitSnapshot).length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wide">
                        Live Trait Signals
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {Object.entries(traitSnapshot).slice(0, 5).map(([trait, value]) => (
                          <div key={trait} className="flex items-center gap-1.5">
                            <span className="text-xs text-white/50">{trait.replace(/_/g, " ")}</span>
                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, value)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question card */}
                  <div className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-6 border border-white/10 shadow-xl space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="w-4 h-4 text-violet-400" />
                      </div>
                      <p className="text-lg font-medium text-white leading-relaxed">
                        {currentQuestion.text}
                      </p>
                    </div>

                    {/* Scale */}
                    {currentQuestion.type === "scale" && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Completely flexible</span>
                          <span className="text-violet-400 font-bold text-base">{scaleValue}/10</span>
                          <span>Strictly planned</span>
                        </div>
                        <Slider
                          value={[scaleValue]}
                          onValueChange={([v]) => setScaleValue(v)}
                          min={1} max={10} step={1}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Choice */}
                    {currentQuestion.type === "choice" && (
                      <div className="grid grid-cols-2 gap-2">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const match = currentQuestion.text.match(
                            new RegExp(`\\(${opt}\\)\\s*([^,(]+)`)
                          );
                          if (!match) return null;
                          const label = match[1].trim();
                          return (
                            <button
                              key={opt}
                              onClick={() => setAnswer(`${opt}: ${label}`)}
                              className={`text-left p-3 rounded-xl border transition-all text-sm ${
                                answer.startsWith(opt)
                                  ? "border-violet-500 bg-violet-600/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                              }`}
                            >
                              <span className="font-bold text-violet-400 mr-1">{opt}.</span>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Rapid */}
                    {currentQuestion.type === "rapid" && (
                      <div className="flex gap-3">
                        {currentQuestion.text.toLowerCase().includes("morning") ? (
                          <>
                            <button
                              onClick={() => setAnswer("Morning person")}
                              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                                answer === "Morning person"
                                  ? "border-violet-500 bg-violet-600/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                              }`}
                            >🌅 Morning</button>
                            <button
                              onClick={() => setAnswer("Night owl")}
                              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                                answer === "Night owl"
                                  ? "border-violet-500 bg-violet-600/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                              }`}
                            >🌙 Night Owl</button>
                          </>
                        ) : currentQuestion.text.toLowerCase().includes("text or call") ? (
                          <>
                            <button
                              onClick={() => setAnswer("Text")}
                              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                                answer === "Text"
                                  ? "border-violet-500 bg-violet-600/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                              }`}
                            >💬 Text</button>
                            <button
                              onClick={() => setAnswer("Call")}
                              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                                answer === "Call"
                                  ? "border-violet-500 bg-violet-600/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                              }`}
                            >📞 Call</button>
                          </>
                        ) : (
                          <Textarea
                            ref={answerRef}
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            placeholder="Your answer..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                            rows={2}
                          />
                        )}
                      </div>
                    )}

                    {/* Open / scenario */}
                    {(currentQuestion.type === "open" || currentQuestion.type === "scenario") && (
                      <Textarea
                        ref={answerRef}
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        placeholder="Be honest — the more real you are, the better your Wingman will be..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none min-h-[100px]"
                        rows={4}
                        onKeyDown={e => {
                          if (e.key === "Enter" && e.metaKey) handleSubmitAnswer();
                        }}
                      />
                    )}
                  </div>

                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={
                      submitAnswer.isPending ||
                      (currentQuestion.type !== "scale" && !answer.trim())
                    }
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-4 rounded-xl text-base"
                  >
                    {submitAnswer.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <>Next <ChevronRight className="ml-1 w-4 h-4" /></>
                    )}
                  </Button>
                  <p className="text-center text-xs text-white/20">⌘ + Enter to submit</p>
                </div>
              )}

              {/* ── Interview complete ── */}
              {interviewComplete && !showForgeReveal && (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/40">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Interview Complete</h2>
                    <p className="text-white/60">
                      I've collected enough signal. Ready to synthesize your Wingman.
                    </p>
                  </div>

                  {Object.keys(traitSnapshot).length > 0 && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-left">
                      <div className="text-sm font-medium text-white/60 mb-3">Your Top Trait Signals</div>
                      <div className="space-y-2">
                        {Object.entries(traitSnapshot)
                          .sort(([, a], [, b]) => b - a)
                          .map(([trait, value]) => (
                            <div key={trait} className="flex items-center gap-3">
                              <span className="text-xs text-white/50 w-36 shrink-0">
                                {trait.replace(/_/g, " ")}
                              </span>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                                  style={{ width: `${Math.min(100, value)}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/40 w-8 text-right">
                                {Math.round(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={() => setStep(3)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-5 text-base rounded-2xl"
                  >
                    Choose Your Wingman Mode <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* ── Forge Reveal Cinematic ── */}
              {showForgeReveal && synthesisResult && (
                <div className="text-center space-y-6 animate-in fade-in duration-700">
                  <div
                    className={`transition-all duration-1000 ${
                      revealPhase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"
                    }`}
                  >
                    <div className="text-5xl mb-3">⚡</div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      Wingman Forged
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-1000 delay-300 ${
                      revealPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                  >
                    <h2 className="text-5xl font-black text-white mb-2">{synthesisResult.name}</h2>
                    <p className="text-violet-300 text-lg">{synthesisResult.tagline}</p>
                  </div>

                  <div
                    className={`transition-all duration-1000 delay-500 ${
                      revealPhase >= 3 ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/20 rounded-2xl p-6 border border-violet-500/30 text-left space-y-4">
                      <p className="text-white/80 leading-relaxed italic">
                        "{synthesisResult.catchphrase}"
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {synthesisResult.aboutMe}
                      </p>
                      <div className="flex gap-6 pt-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-violet-400">
                            {synthesisResult.chemistryScorePercent}%
                          </div>
                          <div className="text-xs text-white/40">Chemistry</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-400">
                            {synthesisResult.overallConfidencePercent}%
                          </div>
                          <div className="text-xs text-white/40">Confidence</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-1000 delay-700 ${
                      revealPhase >= 4 ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Button
                      size="lg"
                      onClick={() => setStep(4)}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-5 text-base rounded-2xl"
                    >
                      Choose Avatar <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3 — Social Mode + Synthesis trigger
          ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <Target className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-white mb-2">What's Your Wingman For?</h2>
                <p className="text-white/50">This shapes how your Wingman connects you with others.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SOCIAL_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      selectedMode.id === mode.id
                        ? "border-violet-500 bg-violet-600/20 shadow-lg shadow-violet-900/30"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="text-3xl mb-2">{mode.emoji}</div>
                    <div className="font-semibold text-white">{mode.label}</div>
                    <div className="text-xs text-white/40 mt-1">{mode.desc}</div>
                  </button>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleSynthesize}
                disabled={synthesizing || runSynthesis.isPending}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-5 text-base rounded-2xl"
              >
                {synthesizing ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Synthesizing Wingman...</>
                ) : (
                  <><Flame className="w-4 h-4 mr-2" /> Forge My Wingman</>
                )}
              </Button>

              {synthesizing && (
                <div className="text-center space-y-2">
                  <p className="text-white/40 text-sm">Running MAESTRO synthesis engine...</p>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show reveal inline if synthesis is done */}
              {showForgeReveal && synthesisResult && (
                <div className="text-center space-y-6 animate-in fade-in duration-700 mt-4">
                  <div className={`transition-all duration-1000 ${revealPhase >= 1 ? "opacity-100" : "opacity-0"}`}>
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Wingman Forged</div>
                  </div>
                  <div className={`transition-all duration-1000 ${revealPhase >= 2 ? "opacity-100" : "opacity-0"}`}>
                    <h3 className="text-4xl font-black text-white mb-1">{synthesisResult.name}</h3>
                    <p className="text-violet-300">{synthesisResult.tagline}</p>
                  </div>
                  <div className={`transition-all duration-1000 ${revealPhase >= 3 ? "opacity-100" : "opacity-0"}`}>
                    <div className="bg-violet-900/30 rounded-2xl p-5 border border-violet-500/20 text-left">
                      <p className="text-white/70 italic text-sm mb-3">"{synthesisResult.catchphrase}"</p>
                      <div className="flex gap-6">
                        <div>
                          <div className="text-xl font-bold text-violet-400">{synthesisResult.chemistryScorePercent}%</div>
                          <div className="text-xs text-white/40">Chemistry</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-cyan-400">{synthesisResult.overallConfidencePercent}%</div>
                          <div className="text-xs text-white/40">Confidence</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`transition-all duration-1000 ${revealPhase >= 4 ? "opacity-100" : "opacity-0"}`}>
                    <Button
                      size="lg"
                      onClick={() => setStep(4)}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-5 text-base rounded-2xl"
                    >
                      Choose Avatar <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 4 — Avatar
          ══════════════════════════════════════════════════════════════════ */}
          {step === 4 && synthesisResult && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-white mb-2">
                  Give {synthesisResult.name} a Face
                </h2>
                <p className="text-white/50">Choose an aesthetic for your Wingman's avatar.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {AVATARS.map(av => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`p-5 rounded-2xl border text-center transition-all ${
                      selectedAvatar === av.id
                        ? "border-violet-500 bg-violet-600/20 shadow-lg shadow-violet-900/30"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${av.color} flex items-center justify-center mx-auto mb-2 text-2xl`}
                    >
                      {av.emoji}
                    </div>
                    <div className="font-semibold text-white">{av.label}</div>
                  </button>
                ))}
              </div>

              {generatedAvatarUrl ? (
                <div className="text-center space-y-3">
                  <img
                    src={generatedAvatarUrl}
                    alt="Generated avatar"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-violet-500/50 shadow-xl shadow-violet-900/40"
                  />
                  <Button
                    variant="outline"
                    onClick={handleGenerateAvatar}
                    disabled={generateAvatar.isPending}
                    className="text-sm border-white/20 text-white/60 hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${generateAvatar.isPending ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleGenerateAvatar}
                  disabled={generateAvatar.isPending}
                  className="w-full border-white/20 text-white/60 hover:text-white hover:border-white/40 py-4 rounded-xl"
                >
                  {generateAvatar.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating Avatar...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Avatar (Optional)</>
                  )}
                </Button>
              )}

              <Button
                size="lg"
                onClick={() => setStep(5)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-5 text-base rounded-2xl"
              >
                Continue to Activation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 5 — Activate
          ══════════════════════════════════════════════════════════════════ */}
          {step === 5 && synthesisResult && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-900 flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/60">
                    {generatedAvatarUrl ? (
                      <img
                        src={generatedAvatarUrl}
                        alt={synthesisResult.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div className="absolute -inset-3 rounded-full border border-violet-500/30 animate-pulse" />
                </div>
                <h2 className="text-4xl font-black text-white mt-4 mb-1">{synthesisResult.name}</h2>
                <p className="text-violet-300">{synthesisResult.tagline}</p>
              </div>

              {/* Final summary */}
              <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 rounded-2xl p-6 border border-violet-500/20 space-y-4">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <span>
                    Mode: <span className="text-white font-medium">{selectedMode.label}</span>
                  </span>
                </div>
                <p className="text-white/70 italic text-sm">"{synthesisResult.catchphrase}"</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  {synthesisResult.explanation?.slice(0, 220)}
                  {synthesisResult.explanation?.length > 220 ? "..." : ""}
                </p>
                <div className="flex gap-6 pt-1">
                  <div>
                    <div className="text-xl font-bold text-violet-400">
                      {synthesisResult.chemistryScorePercent}%
                    </div>
                    <div className="text-xs text-white/40">Chemistry Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-cyan-400">
                      {synthesisResult.overallConfidencePercent}%
                    </div>
                    <div className="text-xs text-white/40">Confidence</div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleActivate}
                disabled={activating || activateWingman.isPending || createWingman.isPending}
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 text-white py-6 text-lg rounded-2xl shadow-xl shadow-violet-900/50"
              >
                {activating ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Activating {synthesisResult.name}...</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" /> Activate {synthesisResult.name}</>
                )}
              </Button>
              <p className="text-center text-xs text-white/20">
                Your Wingman will be live and ready to make connections
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
