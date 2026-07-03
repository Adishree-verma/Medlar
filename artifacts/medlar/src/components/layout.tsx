import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Sparkles, LogIn, LogOut } from "lucide-react";
import { HistorySidebar } from "./history-sidebar";
import { MedlarAssistant } from "./medlar-assistant";
import { useAuth } from "@workspace/replit-auth-web";

export function Layout({
  children,
  showBack = true,
  backTo = "/analyze",
  backLabel = "Back",
}: {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] gradient-bg flex flex-col relative overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px] pointer-events-none" />

      <HistorySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="w-full max-w-4xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 group transition-all hover:opacity-80 active:scale-95"
          title="Open case history"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-serif font-semibold text-xl tracking-wide">Medlar</span>
        </button>

        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(backTo)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>
          )}

          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <button
                  onClick={logout}
                  title={`Signed in as ${user.firstName ?? user.email ?? "you"} — click to sign out`}
                  className="flex items-center gap-2 group"
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName ?? "profile"}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold group-hover:bg-primary/25 transition-colors">
                      {(user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-28 relative z-10">
        {children}
      </main>

      <MedlarAssistant />
    </div>
  );
}
