import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useGetNextMove } from "@workspace/api-client-react";
import { Navigation, MessageCircle, Copy, Check, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NextMove() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { mutate, data, isPending } = useGetNextMove();

  useEffect(() => {
    if (!isReadyToAnalyze) {
      setLocation("/");
      return;
    }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze, chatText, relationshipContext, mutate, setLocation]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
            <Navigation className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">What Should I Say Next?</h1>
          <p className="text-muted-foreground">Strategic moves to keep the conversation going.</p>
        </div>

        {isPending || !data ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">The Strategy</h3>
                  <p className="text-foreground/80 leading-relaxed">{data.context}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {data.suggestions.map((suggestion, idx) => (
                <div key={idx} className="glass-card rounded-3xl p-6 relative group border-2 border-transparent hover:border-primary/20 transition-all">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-secondary-foreground">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-2 pr-12">
                      <p className="text-lg text-foreground font-medium leading-snug">"{suggestion}"</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(suggestion, idx)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:scale-105 active:scale-95 transition-all text-muted-foreground hover:text-primary"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === idx ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
