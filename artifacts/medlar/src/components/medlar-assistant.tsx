import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/context/chat";
import { MessageCircleHeart, X, Send, Sparkles, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const WELCOME_WITH_CHAT =
  "Hey, I'm Medlar 🌸 I've read the chat. What do you want to know? Why they said that, what it means, what you should do — ask anything.";
const WELCOME_NO_CHAT =
  "Hey! I'm Medlar 🌸 I help you decode dating & relationship situations. Load a chat on the home screen for specific analysis, or just ask me anything.";

export function MedlarAssistant() {
  const { chatText, relationshipContext, backstory } = useChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasChatLoaded = chatText.trim().length > 0 && relationshipContext !== "";
  const WELCOME = hasChatLoaded ? WELCOME_WITH_CHAT : WELCOME_NO_CHAT;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: WELCOME }]);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, open]);

  const sendStream = useCallback(
    async (userMessages: Message[]) => {
      if (isStreaming) return;
      setIsStreaming(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "", isStreaming: true }]);

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/analyze/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: userMessages
              .filter((m) => m.content !== WELCOME_WITH_CHAT && m.content !== WELCOME_NO_CHAT)
              .map((m) => ({ role: m.role, content: m.content })),
            chatContext: hasChatLoaded
              ? {
                  chatText,
                  relationshipContext,
                  backstory: backstory || undefined,
                }
              : null,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { token: string };
              accumulated += parsed.token;
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  role: "assistant",
                  content: accumulated,
                  isStreaming: true,
                };
                return msgs;
              });
            } catch {}
          }
        }

        setMessages((prev) => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: "assistant", content: accumulated };
          return msgs;
        });
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = {
              role: "assistant",
              content: "Something went wrong. Try again?",
            };
            return msgs;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, chatText, relationshipContext, backstory, hasChatLoaded, WELCOME]
  );

  const send = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    sendStream(newMessages);
  };

  const regenerate = () => {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const truncated = messages.slice(0, idx + 1);
    setMessages(truncated);
    sendStream(truncated);
  };

  const handleClose = () => {
    if (abortRef.current) abortRef.current.abort();
    setOpen(false);
  };

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant" && !isStreaming;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="font-serif font-semibold text-base text-foreground leading-tight">Ask Medlar</p>
                <p className="text-xs text-muted-foreground">
                  {hasChatLoaded ? "analyzing your situation" : "dating & relationship advisor"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2.5 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary/30 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-2.5 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-secondary/30 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Regenerate */}
          {lastIsAssistant && messages.length > 1 && (
            <div className="px-5 pb-2 flex justify-start ml-9">
              <button
                onClick={regenerate}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          )}

          <div className="px-4 pb-6 pt-2 border-t border-primary/10">
            <div className="flex gap-2 items-end bg-secondary/20 rounded-2xl p-2 max-w-2xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none py-1.5 px-2 leading-relaxed max-h-32"
              />
              <button
                onClick={send}
                disabled={!input.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full shadow-lg shadow-primary/25 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          open
            ? "bg-foreground/10 text-foreground"
            : "bg-gradient-to-br from-primary to-secondary text-white"
        }`}
        title="Ask Medlar"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircleHeart className="w-6 h-6" />}
      </button>
    </>
  );
}
