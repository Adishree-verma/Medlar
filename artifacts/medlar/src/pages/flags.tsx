import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useScanFlags } from "@workspace/api-client-react";
import { AlertTriangle, Flag as FlagIcon, CheckCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Flags() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();

  const { mutate, data, isPending } = useScanFlags();

  useEffect(() => {
    if (!isReadyToAnalyze) {
      setLocation("/");
      return;
    }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze, chatText, relationshipContext, mutate, setLocation]);

  const getFlagStyle = (type: string) => {
    switch (type) {
      case "red": return "border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-900/10 text-rose-800 dark:text-rose-300";
      case "green": return "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300";
      case "yellow": return "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300";
      default: return "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/10 text-gray-800 dark:text-gray-300";
    }
  };

  const getFlagIcon = (type: string) => {
    switch (type) {
      case "red": return <AlertTriangle className="w-6 h-6 text-rose-500" />;
      case "green": return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case "yellow": return <Info className="w-6 h-6 text-amber-500" />;
      default: return <FlagIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Flag Scanner</h1>
          <p className="text-muted-foreground">The good, the bad, and the slightly concerning.</p>
        </div>

        {isPending || !data ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 text-center shadow-md">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overall Verdict</h2>
              <p className="text-xl font-serif text-foreground">{data.overallVerdict}</p>
            </div>

            {data.flags.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center text-muted-foreground">
                <FlagIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No major flags detected. It's a pretty neutral conversation.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data.flags.map((flag, idx) => (
                  <div key={idx} className={`rounded-2xl p-6 border-2 transition-transform hover:scale-[1.01] ${getFlagStyle(flag.type)}`}>
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-1 bg-white/50 dark:bg-black/20 p-2 rounded-xl">
                        {getFlagIcon(flag.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{flag.text}</h3>
                        <p className="opacity-90 leading-relaxed">{flag.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
