import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useDetectMood } from "@workspace/api-client-react";
import { HeartCrack, Search, Activity, Heart, Frown, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function Mood() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();

  const { mutate, data, isPending } = useDetectMood();

  useEffect(() => {
    if (!isReadyToAnalyze) {
      setLocation("/");
      return;
    }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze, chatText, relationshipContext, mutate, setLocation]);

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "interested": return <Heart className="w-12 h-12 text-rose-500" />;
      case "dry": return <Frown className="w-12 h-12 text-amber-500" />;
      case "excited": return <Sparkles className="w-12 h-12 text-emerald-500" />;
      case "mixed": return <Activity className="w-12 h-12 text-purple-500" />;
      case "distant": return <AlertCircle className="w-12 h-12 text-blue-500" />;
      case "confused": return <HelpCircle className="w-12 h-12 text-orange-500" />;
      default: return <Search className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
            <HeartCrack className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Mood Detector</h1>
          <p className="text-muted-foreground">Reading between the lines so you don't have to overthink it.</p>
        </div>

        {isPending || !data ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-48 mx-auto mb-4 rounded-xl" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-8 rounded-full" />
            
            <div className="space-y-4 max-w-md mx-auto">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 mx-auto rounded-full" />
              <Skeleton className="h-4 w-4/6 mx-auto rounded-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center ring-8 ring-secondary/10">
                  {getMoodIcon(data.mood)}
                </div>
              </div>
              
              <h2 className="text-4xl font-bold font-serif mb-4 capitalize">{data.moodLabel}</h2>
              <p className="text-lg text-foreground/80 leading-relaxed max-w-xl mx-auto mb-8">
                {data.summary}
              </p>

              <div className="max-w-xs mx-auto bg-white/50 dark:bg-black/20 rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="text-primary">{data.confidence}%</span>
                </div>
                <Progress value={data.confidence} className="h-2 bg-secondary" />
              </div>
            </div>

            {data.signals && data.signals.length > 0 && (
              <div className="glass-card rounded-3xl p-6 md:p-8">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Signals Detected
                </h3>
                <ul className="space-y-3">
                  {data.signals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-muted-foreground bg-white/40 dark:bg-white/5 p-3 rounded-xl">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-snug">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
