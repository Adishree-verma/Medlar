import React from "react";
import { useChat } from "@/context/chat";
import { X, Clock, Trash2, FolderHeart } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onClose: () => void;
}

const REL_LABELS: Record<string, string> = {
  one_sided: "One Sided",
  already_dating: "Dating",
  mutual_crush: "Mutual Crush",
  ex: "Ex",
};

export function HistorySidebar({ open, onClose }: Props) {
  const { cases, loadCase, deleteCase } = useChat();
  const [, setLocation] = useLocation();

  const handleLoad = (id: string) => {
    loadCase(id);
    onClose();
    setLocation("/");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 h-full w-80 z-50 flex flex-col bg-white/95 dark:bg-[#1a0f14]/98 backdrop-blur-xl border-r border-primary/10 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-lg">Your Cases</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {cases.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderHeart className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No saved cases yet.</p>
              <p className="text-xs mt-1 opacity-60">
                After analyzing a chat, save it here to track patterns over time.
              </p>
            </div>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                className="group relative bg-white/60 dark:bg-white/5 hover:bg-primary/5 rounded-2xl p-4 border border-primary/10 hover:border-primary/25 transition-all cursor-pointer"
                onClick={() => handleLoad(c.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{c.moodEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {REL_LABELS[c.relationshipContext] ?? c.relationshipContext}
                    </p>
                    {c.moodSummary && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed opacity-70">
                        {c.moodSummary}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-muted-foreground/50">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-500 text-muted-foreground transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCase(c.id);
                  }}
                  title="Delete case"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-4 pb-6 pt-3 border-t border-primary/10">
          <p className="text-center text-xs text-muted-foreground opacity-60">
            Up to 5 cases saved locally
          </p>
        </div>
      </aside>
    </>
  );
}
