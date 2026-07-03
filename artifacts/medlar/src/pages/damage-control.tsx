import { Layout } from "@/components/layout";
import { useChat } from "@/context/chat";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useCheckDamageControl } from "@workspace/api-client-react";
import { ShieldAlert, ThumbsUp, AlertOctagon, Flame, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DamageControl() {
  const { chatText, relationshipContext, isReadyToAnalyze } = useChat();
  const [, setLocation] = useLocation();

  const { mutate, data, isPending } = useCheckDamageControl();

  useEffect(() => {
    if (!isReadyToAnalyze) {
      setLocation("/");
      return;
    }
    mutate({ data: { chatText, relationshipContext: relationshipContext as any } });
  }, [isReadyToAnalyze, chatText, relationshipContext, mutate, setLocation]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "worked": 
        return {
          icon: <ThumbsUp className="w-16 h-16 text-emerald-500" />,
          bg: "bg-emerald-50 dark:bg-emerald-900/10",
          border: "border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-400"
        };
      case "risky":
        return {
          icon: <AlertOctagon className="w-16 h-16 text-amber-500" />,
          bg: "bg-amber-50 dark:bg-amber-900/10",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-400"
        };
      case "damage_control":
        return {
          icon: <Flame className="w-16 h-16 text-rose-500" />,
          bg: "bg-rose-50 dark:bg-rose-900/10",
          border: "border-rose-200 dark:border-rose-800",
          text: "text-rose-700 dark:text-rose-400"
        };
      default:
        return {
          icon: <ShieldAlert className="w-16 h-16 text-gray-500" />,
          bg: "bg-gray-50 dark:bg-gray-900/10",
          border: "border-gray-200 dark:border-gray-800",
          text: "text-gray-700 dark:text-gray-400"
        };
    }
  };

  return (
    <Layout>
      <div className="pt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Did I Mess This Up?</h1>
          <p className="text-muted-foreground">The honest truth about your last message.</p>
        </div>

        {isPending || !data ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`rounded-3xl p-8 md:p-12 text-center border-2 ${getStatusConfig(data.status).bg} ${getStatusConfig(data.status).border}`}>
              <div className="flex justify-center mb-6">
                <div className="bg-white/80 dark:bg-black/40 p-4 rounded-full shadow-sm">
                  {getStatusConfig(data.status).icon}
                </div>
              </div>
              
              <h2 className={`text-3xl font-bold font-serif mb-4 ${getStatusConfig(data.status).text}`}>
                {data.statusLabel}
              </h2>
              <p className="text-lg text-foreground/90 leading-relaxed max-w-xl mx-auto font-medium">
                {data.verdict}
              </p>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-foreground">
                <ArrowRight className="w-5 h-5 text-primary" />
                What to do next
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {data.advice}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
