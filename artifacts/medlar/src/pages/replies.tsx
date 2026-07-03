import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useGetSuggestedReplies } from "@workspace/api-client-react";
import { MessageSquare, Copy, Check, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const VIBE_MODES = [
  { id: "classic", label: "Classic", emoji: "✨" },
  { id: "delulu", label: "Delulu", emoji: "💅" },
  { id: "ice_queen", label: "Ice Queen", emoji: "🧊" },
  { id: "therapist", label: "Therapist", emoji: "🧠" },
  { id: "savage", label: "Savage", emoji: "😈" },
] as const;

type VibeMode = typeof VIBE_MODES[number]["id"];

const TONE_STYLES: Record<string, { bg: string; text: string }> = {
  flirty: { bg: "bg-rose-50/80 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400" },
  chill: { bg: "bg-sky-50/80 dark:bg-sky-900/20", text: "text-sky-600 dark:text-sky-400" },
  funny: { bg: "bg-amber-50/80 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  confident: { bg: "bg-purple-50/80 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
  delulu: { bg: "bg-pink-50/80 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400" },
  ice_queen: { bg: "bg-cyan-50/80 dark:bg-cyan-900/20", text: "text-cyan-600 dark:text-cyan-400" },
  therapist: { bg: "bg-emerald-50/80 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  savage: { bg: "bg-red-50/80 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
};

export default function Replies() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<number | null>(null);
  const [vibeMode, setVibeMode] = useState<VibeMode>("classic");

  const { mutate, data, isPending } = useGetSuggestedReplies();

  const fetch = (mode: VibeMode) => {
    mutate({
      data: {
        chatText,
        relationshipContext: relationshipContext as any,
        vibeMode: mode === "classic" ? null : mode,
      },
    });
  };

  useEffect(() => {
    if (!isReadyToAnalyze) { setLocation("/"); return; }
    fetch(vibeMode);
  }, [isReadyToAnalyze]);

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleVibeChange = (mode: VibeMode) => {
    setVibeMode(mode);
    fetch(mode);
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Reply Suggestions</h1>
          <p className="text-muted-foreground">Pick a vibe and send it.</p>
        </div>

        {/* Vibe mode tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          {VIBE_MODES.map((v) => (
            <button
              key={v.id}
              onClick={() => handleVibeChange(v.id)}
              disabled={isPending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border-2 ${
                vibeMode === v.id
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span>{v.emoji}</span>
              <span>{v.label}</span>
            </button>
          ))}
          <button
            onClick={() => fetch(vibeMode)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border-2 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all ml-auto"
            title="Regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isPending || !data ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-3xl p-5">
                <Skeleton className="h-5 w-20 mb-3 rounded-full" />
                <Skeleton className="h-14 w-full mb-3 rounded-xl" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {data.replies.map((reply, idx) => {
              const style = TONE_STYLES[reply.tone] ?? TONE_STYLES.chill;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-3xl p-5 group transition-all hover:shadow-md border-2 border-transparent hover:border-primary/15"
                >
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${style.bg} ${style.text}`}>
                    <span>{reply.toneEmoji ?? ""}</span>
                    <span className="capitalize">{reply.toneLabel ?? reply.tone}</span>
                  </div>

                  <div className="relative bg-white/50 dark:bg-black/20 rounded-2xl p-4 mb-3 pr-12">
                    <p className="text-base text-foreground leading-relaxed">"{reply.text}"</p>
                    <button
                      onClick={() => handleCopy(reply.text, idx)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                      title="Copy"
                    >
                      {copied === idx ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    <span className="text-primary mr-1">↳</span>
                    {reply.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
