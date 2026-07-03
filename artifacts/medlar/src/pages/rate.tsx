import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useRateConversation } from "@workspace/api-client-react";
import { Star, TrendingUp, Zap, ThumbsDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Rate() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();

  const { mutate, data, isPending } = useRateConversation();

  useEffect(() => {
    if (!isReadyToAnalyze) {
      setLocation("/");
      return;
    }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze, chatText, relationshipContext, mutate, setLocation]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 5) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <Zap className="w-16 h-16 text-emerald-500" />;
    if (score >= 5) return <TrendingUp className="w-16 h-16 text-amber-500" />;
    return <ThumbsDown className="w-16 h-16 text-rose-500" />;
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 mb-4">
            <Star className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Chat Rating</h1>
          <p className="text-muted-foreground">A brutal out of 10 score for this conversation.</p>
        </div>

        {isPending || !data ? (
          <div className="glass-card rounded-3xl p-8 text-center space-y-6">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 mx-auto rounded-full" />
            <div className="pt-8">
              <Skeleton className="h-6 w-32 mb-4 rounded-full" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {getScoreIcon(data.score)}
                  <div className={`absolute inset-0 blur-xl opacity-20 ${getScoreColor(data.score)} bg-current rounded-full`} />
                </div>
              </div>
              
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className={`text-6xl md:text-7xl font-bold font-serif ${getScoreColor(data.score)}`}>
                  {data.score}
                </span>
                <span className="text-2xl text-muted-foreground font-serif">/10</span>
              </div>
              
              <h2 className="text-2xl font-bold font-serif mb-4 capitalize">{data.label}</h2>
              <p className="text-lg text-foreground/80 leading-relaxed max-w-xl mx-auto">
                {data.summary}
              </p>
            </div>

            {data.tips && data.tips.length > 0 && (
              <div className="glass-card rounded-3xl p-6 md:p-8">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  How to improve it
                </h3>
                <div className="grid gap-3">
                  {data.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/40 dark:bg-white/5 p-4 rounded-2xl">
                      <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-foreground leading-snug">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
