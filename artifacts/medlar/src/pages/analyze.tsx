import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useGetQuickAnalysis } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Scale,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Minus,
  Sparkles,
  RefreshCw,
} from "lucide-react";

type FlagType = "red" | "green" | "yellow";
type KeyPointType = "positive" | "negative" | "neutral" | "warning";

interface FlagItem {
  type: FlagType;
  text: string;
  explanation: string;
}

interface KeyPoint {
  text: string;
  type: KeyPointType;
}

const RISK_CONFIG: Record<string, { color: string; bg: string }> = {
  low: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  medium: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  high: { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
};

const FLAG_STYLES: Record<FlagType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  red: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
  green: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  yellow: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
};

const KEYPOINT_STYLES: Record<KeyPointType, { icon: React.ElementType; color: string; bg: string }> = {
  positive: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-900/10" },
  negative: { icon: XCircle, color: "text-rose-500", bg: "bg-rose-50/60 dark:bg-rose-900/10" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-white/40 dark:bg-white/5" },
  warning: { icon: TriangleAlert, color: "text-amber-500", bg: "bg-amber-50/60 dark:bg-amber-900/10" },
};

function ScoreRing({ value, max = 10, colorClass }: { value: number; max?: number; colorClass: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, (value / max) * 100) / 100) * circ;
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} strokeWidth="6" className="stroke-secondary fill-none" />
      <circle
        cx="36" cy="36" r={r} strokeWidth="6" fill="none" strokeLinecap="round"
        stroke="currentColor" className={colorClass}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function ScoreCard({ icon: Icon, label, value, colorClass, sublabel }: {
  icon: React.ElementType; label: string; value: number; colorClass: string; sublabel?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2">
      <div className="relative">
        <ScoreRing value={value} colorClass={colorClass} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold font-serif ${colorClass}`}>{value}</span>
          <span className="text-[10px] text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="text-center">
        <div className={`flex items-center justify-center gap-1 text-xs font-semibold ${colorClass}`}>
          <Icon className="w-3 h-3" /><span>{label}</span>
        </div>
        {sublabel && <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/20 dark:hover:bg-white/5 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-foreground text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

function DeepDiveLink({ emoji, title, description, href }: {
  emoji: string; title: string; description: string; href: string;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-4 bg-white/40 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 text-left transition-all group border-2 border-transparent hover:border-primary/20"
    >
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

export default function Analyze() {
  const { chatText, relationshipContext, isReadyToAnalyze, caseName, saveCase } = useChat();
  const [, setLocation] = useLocation();
  const [shared, setShared] = useState(false);
  const [caseSaved, setCaseSaved] = useState(false);

  const { mutate, data, isPending, error } = useGetQuickAnalysis();

  useEffect(() => {
    if (!isReadyToAnalyze) { setLocation("/"); return; }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze]);

  useEffect(() => {
    if (data && !caseSaved) {
      saveCase({ moodEmoji: data.moodEmoji, moodSummary: data.moodSummary });
      setCaseSaved(true);
    }
  }, [data]);

  const handleShare = async () => {
    if (!data) return;
    const text = [
      `🌸 Medlar Analysis${caseName ? ` — ${caseName}` : ""}`,
      ``,
      `${data.moodEmoji} ${data.moodSummary}`,
      ``,
      `❤️ Attraction: ${data.attractionScore}/10  ⚖️ Effort: ${data.effortScore}/10  🚩 ${data.riskLabel}`,
      ``,
      `🎭 Their vibe: ${data.personVibeEmoji} ${data.personVibeLabel}`,
      `🔮 ${data.prediction} (${data.predictionChance}% positive)`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Medlar Analysis", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {}
  };

  const attractionColor = (v: number) => v >= 7 ? "text-rose-500" : v >= 4 ? "text-amber-500" : "text-muted-foreground";
  const effortColor = (v: number) => v >= 7 ? "text-emerald-500" : v >= 4 ? "text-amber-500" : "text-rose-500";

  if (!isReadyToAnalyze) return null;

  return (
    <Layout backTo="/" backLabel="New Chat">
      <div className="max-w-2xl mx-auto pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Loading */}
        {isPending && (
          <div className="space-y-5">
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-serif font-semibold mb-2">Reading the vibes...</p>
              <p className="text-sm text-muted-foreground">Patterns, energy, red flags — all of it.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        )}

        {/* Error */}
        {error && !isPending && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Something went wrong. Try again?</p>
            <button
              onClick={() => mutate({ data: { chatText, relationshipContext: relationshipContext as any } })}
              className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Results */}
        {data && !isPending && (
          <div className="space-y-4">

            {/* Mood hero */}
            <div className="glass-card rounded-3xl p-7 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              <div className="text-5xl mb-4">{data.moodEmoji}</div>
              <p className="text-lg text-foreground leading-relaxed font-medium max-w-sm mx-auto">
                {data.moodSummary}
              </p>
              {caseName && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-secondary/30 text-xs text-muted-foreground">
                  {caseName}
                </div>
              )}
            </div>

            {/* Score row */}
            <div className="grid grid-cols-3 gap-3">
              <ScoreCard
                icon={Heart} label="Attraction" value={data.attractionScore}
                colorClass={attractionColor(data.attractionScore)}
                sublabel={data.attractionScore >= 7 ? "They're into it" : data.attractionScore >= 4 ? "Somewhat there" : "Pretty cold"}
              />
              <ScoreCard
                icon={Scale} label="Effort" value={data.effortScore}
                colorClass={effortColor(data.effortScore)}
                sublabel={data.effortScore >= 7 ? "Balanced" : data.effortScore >= 4 ? "Slight gap" : "You're carrying"}
              />
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 justify-center">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${RISK_CONFIG[data.riskLevel]?.bg ?? ""}`}>
                  <TriangleAlert className={`w-5 h-5 ${RISK_CONFIG[data.riskLevel]?.color ?? "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold ${RISK_CONFIG[data.riskLevel]?.color ?? ""}`}>{data.riskLabel}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{data.riskLevel} risk</p>
                </div>
              </div>
            </div>

            {/* Their vibe */}
            <div className="glass-card rounded-3xl px-6 py-4 flex items-center gap-4">
              <span className="text-3xl shrink-0">{data.personVibeEmoji}</span>
              <div>
                <p className="text-xs text-muted-foreground">Their vibe</p>
                <p className="font-semibold text-foreground">{data.personVibeLabel}</p>
              </div>
            </div>

            {/* Key points */}
            <Accordion title="📌 What's going on" defaultOpen={true}>
              <div className="space-y-2 pt-1">
                {(data.keyPoints as KeyPoint[]).map((kp, i) => {
                  const s = KEYPOINT_STYLES[kp.type] ?? KEYPOINT_STYLES.neutral;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-2xl ${s.bg}`}>
                      <s.icon className={`w-4 h-4 shrink-0 mt-0.5 ${s.color}`} />
                      <span className="text-sm text-foreground leading-relaxed">{kp.text}</span>
                    </div>
                  );
                })}
              </div>
            </Accordion>

            {/* Safety warning */}
            {data.safetyWarning && (
              <div className="rounded-3xl p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-1">Heads up</p>
                  <p className="text-sm text-amber-700/80 dark:text-amber-300/80 leading-relaxed">{data.safetyWarning}</p>
                </div>
              </div>
            )}

            {/* Prediction */}
            <div className="glass-card rounded-3xl px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0">🔮</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm leading-snug">{data.prediction}</p>
                    <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                      data.predictionChance >= 65
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : data.predictionChance >= 40
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                    }`}>
                      {data.predictionChance}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary/30 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-1000 ${
                        data.predictionChance >= 65 ? "bg-emerald-500" : data.predictionChance >= 40 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${data.predictionChance}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top flags */}
            {data.topFlags && data.topFlags.length > 0 && (
              <Accordion title="🚩 Notable flags">
                <div className="space-y-2.5 pt-1">
                  {(data.topFlags as FlagItem[]).map((flag, i) => {
                    const s = FLAG_STYLES[flag.type] ?? FLAG_STYLES.yellow;
                    return (
                      <div key={i} className={`p-3.5 rounded-2xl border ${s.bg} ${s.border} flex items-start gap-3`}>
                        <s.icon className={`w-4 h-4 shrink-0 mt-0.5 ${s.color}`} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{flag.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{flag.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Accordion>
            )}

            {/* Go deeper */}
            <Accordion title="🔍 Go deeper" defaultOpen={true}>
              <div className="space-y-2 pt-1">
                <DeepDiveLink emoji="💬" title="Reply suggestions" description="Pick a vibe and get 4 crafted replies" href="/replies" />
                <DeepDiveLink emoji="🚩" title="Full flag scan" description="Every red, green, and yellow flag in detail" href="/flags" />
                <DeepDiveLink emoji="🔮" title="Prediction deep dive" description="Multiple outcome scenarios and pattern analysis" href="/predict" />
                <DeepDiveLink emoji="💔" title="Did I mess it up?" description="Honest verdict on your last message" href="/damage-control" />
                <DeepDiveLink emoji="➡️" title="What to say next" description="Strategic next message suggestions" href="/next-move" />
                <DeepDiveLink emoji="⭐" title="Rate this chat" description="A score out of 10 with actionable tips" href="/rate" />
              </div>
            </Accordion>

            {/* Bottom actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-primary/20 hover:bg-primary/5 transition-all text-sm font-medium"
              >
                {shared
                  ? <><CheckCircle className="w-4 h-4 text-emerald-500" /> Copied!</>
                  : <><Share2 className="w-4 h-4 text-primary" /> Share</>}
              </button>
              <button
                onClick={() => setLocation("/")}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-all text-sm font-medium text-primary"
              >
                <RefreshCw className="w-4 h-4" /> New chat
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
