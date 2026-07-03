import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useGetPrediction } from "@workspace/api-client-react";
import { TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Predict() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();

  const { mutate, data, isPending } = useGetPrediction();

  useEffect(() => {
    if (!isReadyToAnalyze) { setLocation("/"); return; }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze]);

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Prediction Mode</h1>
          <p className="text-muted-foreground">Where is this actually going?</p>
        </div>

        {isPending || !data ? (
          <div className="space-y-5">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
            </div>
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="glass-card rounded-3xl p-7 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400/20 via-violet-500 to-violet-400/20" />
              <div className="text-4xl mb-4">🔮</div>
              <p className="text-xl font-serif font-semibold text-foreground mb-3">{data.prediction}</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                data.positiveChance >= 65
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : data.positiveChance >= 40
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
              }`}>
                {data.positiveChance}% positive chance
              </div>
              <div className="w-full bg-secondary/30 rounded-full h-2 mt-4">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    data.positiveChance >= 65 ? "bg-emerald-500" : data.positiveChance >= 40 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${data.positiveChance}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" /> Possible outcomes
              </h3>
              {data.outcomes.map((outcome, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-14">
                    <div className={`text-lg font-bold font-serif ${
                      outcome.chance >= 40 ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {outcome.chance}%
                    </div>
                  </div>
                  <div className="flex-1 border-l border-border/50 pl-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{outcome.label}</p>
                    <p className="text-sm text-foreground leading-relaxed">{outcome.scenario}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <Activity className="w-4 h-4 text-primary" /> Pattern insight
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{data.patternInsight}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
