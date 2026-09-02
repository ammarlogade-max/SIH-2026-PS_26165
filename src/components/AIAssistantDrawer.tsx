"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronRight, Send, Sparkles, X } from "lucide-react";
import { useAIAssistant } from "@/context/AIAssistantContext";

type Message = { role: "user" | "assistant"; content: string };
type PrototypePrompt = { id: string; label: string; question: string };

const prototypePrompts: PrototypePrompt[] = [
  { id: "overview", label: "How does SIF Sentinel work?", question: "Explain how the SIF Sentinel prototype detects and prioritizes serious injury and fatality precursors." },
  { id: "classify", label: "Classify a near-miss", question: "How do I classify a new near-miss or safety observation using the SIF Sentinel prototype?" },
  { id: "density", label: "Interpret risk density", question: "How should an HSE manager interpret precursor density and facility risk ranking in this prototype?" },
  { id: "patterns", label: "Investigate patterns", question: "How does SIF Sentinel identify recurring precursor patterns and what should an HSE manager do next?" },
  { id: "rules", label: "Understand IOGP rules", question: "How are IOGP Life-Saving Rules used to classify safety observations in SIF Sentinel?" },
  { id: "xai", label: "Explain an AI decision", question: "How can I understand why SIF Sentinel flagged an observation as a SIF precursor?" },
  { id: "action", label: "Plan HSE action", question: "What actions should an HSE manager take after SIF Sentinel identifies a high-priority precursor?" },
];

export default function AIAssistantDrawer() {
  const { isOpen, closeAssistant } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const hasAssistantResponse = messages.some((message) => message.role === "assistant");
  const remainingPrompts = useMemo(
    () => prototypePrompts.filter((prompt) => prompt.id !== selectedPromptId),
    [selectedPromptId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const send = async (suggestion?: PrototypePrompt) => {
    const message = (suggestion?.question ?? input).trim();
    if (!message || isThinking) return;

    if (suggestion) setSelectedPromptId(suggestion.id);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setInput("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: messages }),
      });
      const payload = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply || "The AI service did not return a response.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "The AI service is unavailable. Please check the configured AI connection and try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  const showPrompts = messages.length === 0 || (hasAssistantResponse && !isThinking);
  const visiblePrompts = messages.length === 0 ? prototypePrompts : remainingPrompts;

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-slate-950/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="AI safety assistant"
    >
      <button
        className="flex-1 cursor-default"
        onClick={closeAssistant}
        aria-label="Close AI assistant"
      />

      <section className="ai-assistant-drawer flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10">
              <Bot className="h-5 w-5 text-violet-400" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold text-slate-100">AI safety assistant</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected to the safety AI service
              </p>
            </div>
          </div>
          <button
            onClick={closeAssistant}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-surface-hover hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-3.5 text-xs leading-relaxed text-slate-300">
            Ask about the real SIF Sentinel workflow, classification logic, IOGP framework, or how to act on safety intelligence.
          </div>

          <div className="mt-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={
                    message.role === "user"
                      ? "max-w-[88%] rounded-2xl rounded-br-sm bg-violet-600 px-3.5 py-2.5 text-xs leading-relaxed text-white"
                      : "ai-assistant-response max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-surface-border bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-slate-300"
                  }
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isThinking && (
              <div className="ai-assistant-response rounded-2xl rounded-bl-sm border border-surface-border bg-surface px-3.5 py-2.5 text-xs text-violet-400">
                Analyzing safety context…
              </div>
            )}
          </div>

          {showPrompts && (
            <section className="mt-5 border-t border-surface-border pt-4" aria-label="Suggested assistant questions">
              <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {messages.length === 0 ? "Explore the prototype" : "Continue exploring"}
              </p>
              <div className="space-y-2">
                {visiblePrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => void send(prompt)}
                    className="ai-assistant-prompt flex w-full items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface/55 px-3.5 py-3 text-left text-xs font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-500/[0.07] hover:text-slate-100"
                  >
                    <span>{prompt.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  </button>
                ))}
              </div>
            </section>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="border-t border-surface-border p-4"
        >
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about SIF safety intelligence…"
              className="ai-assistant-input min-w-0 flex-1 bg-transparent px-2 py-3 text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-45"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
