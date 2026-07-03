import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type RelCtx = "one_sided" | "already_dating" | "mutual_crush" | "ex";

export interface SavedCase {
  id: string;
  name: string;
  chatText: string;
  relationshipContext: RelCtx;
  backstory?: string;
  createdAt: number;
  moodEmoji: string;
  moodSummary: string;
}

export interface ChatContextType {
  chatText: string;
  setChatText: (text: string) => void;
  relationshipContext: RelCtx | "";
  setRelationshipContext: (ctx: RelCtx | "") => void;
  yourName: string;
  setYourName: (name: string) => void;
  caseName: string;
  setCaseName: (name: string) => void;
  backstory: string;
  setBackstory: (backstory: string) => void;
  isReadyToAnalyze: boolean;
  clearChat: () => void;
  cases: SavedCase[];
  saveCase: (opts: { moodEmoji?: string; moodSummary?: string }) => void;
  loadCase: (id: string) => void;
  deleteCase: (id: string) => void;
}

const STORAGE_KEY = "medlar_cases";
const MAX_CASES = 5;

function loadCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCases(cases: SavedCase[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {}
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatText, setChatText] = useState("");
  const [relationshipContext, setRelationshipContext] = useState<RelCtx | "">("");
  const [yourName, setYourName] = useState("");
  const [caseName, setCaseName] = useState("");
  const [backstory, setBackstory] = useState("");
  const [cases, setCases] = useState<SavedCase[]>(() => loadCases());

  const isReadyToAnalyze = chatText.trim().length > 0 && relationshipContext !== "";

  const clearChat = useCallback(() => {
    setChatText("");
    setRelationshipContext("");
    setYourName("");
    setCaseName("");
    setBackstory("");
  }, []);

  const saveCase = useCallback(
    ({ moodEmoji = "💬", moodSummary = "" }: { moodEmoji?: string; moodSummary?: string }) => {
      if (!chatText.trim() || !relationshipContext) return;
      const newCase: SavedCase = {
        id: Date.now().toString(),
        name: caseName.trim() || "Unnamed Chat",
        chatText,
        relationshipContext: relationshipContext as RelCtx,
        backstory: backstory.trim() || undefined,
        createdAt: Date.now(),
        moodEmoji,
        moodSummary,
      };
      const updated = [newCase, ...cases].slice(0, MAX_CASES);
      setCases(updated);
      persistCases(updated);
    },
    [chatText, relationshipContext, caseName, backstory, cases]
  );

  const loadCase = useCallback(
    (id: string) => {
      const found = cases.find((c) => c.id === id);
      if (!found) return;
      setChatText(found.chatText);
      setRelationshipContext(found.relationshipContext);
      setCaseName(found.name);
      setBackstory(found.backstory ?? "");
    },
    [cases]
  );

  const deleteCase = useCallback(
    (id: string) => {
      const updated = cases.filter((c) => c.id !== id);
      setCases(updated);
      persistCases(updated);
    },
    [cases]
  );

  return (
    <ChatContext.Provider
      value={{
        chatText,
        setChatText,
        relationshipContext,
        setRelationshipContext,
        yourName,
        setYourName,
        caseName,
        setCaseName,
        backstory,
        setBackstory,
        isReadyToAnalyze,
        clearChat,
        cases,
        saveCase,
        loadCase,
        deleteCase,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
