"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, Sparkles, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// -------------------------------------------------------------
// 8 HOW-TO & FEATURE GUIDE PRESET QUESTIONS:
// -------------------------------------------------------------
const PRESET_QUESTIONS = [
  "How do I use this dashboard to track SIF risks?",
  "How do I ingest and analyze a new near-miss report?",
  "How does real-time risk tracking and monitoring work?",
  "Where can I view PPE compliance and category analytics?",
  "How do I set up alerts for high-risk observations?",
  "What are Life Saving Rules (LSR) and how are they flagged?",
  "How do I track recurring safety patterns across sites?",
  "How does the AI model evaluate facility density risks?",
];

export default function AIAssistantDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [eventOpen, setEventOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    const handleOpen = () => setEventOpen(true);
    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  const visible = propIsOpen ?? eventOpen;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setEventOpen(false);
  };

  if (!visible) return null;

  const handleSend = (textQuery?: string) => {
    const query = (textQuery || input).trim();
    if (!query) return;

    // 1. Instantly post user question
    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // 2. Feature Guide AI Responses
    setTimeout(() => {
      let response = `Here is guidance for: "${query}"`;
      const lower = query.toLowerCase();

      if (lower.includes("use this dashboard") || lower.includes("track sif")) {
        response =
          "📌 Command Center Overview:\n\n" +
          "1. Dashboard Overview displays live SIF risk scores, category breakdowns, and high-priority reports.\n" +
          "2. Navigation Menu on the left lets you jump between Report Ingestion, Risk Intelligence, Facility Density, and Alerts.\n" +
          "3. Use this AI Assistant anytime for quick system guidance and risk analysis.";
      } else if (lower.includes("ingest") || lower.includes("near-miss")) {
        response =
          "📥 Report Ingestion Guide:\n\n" +
          "1. Go to 'Report Ingestion' in the left menu.\n" +
          "2. Upload raw incident logs (PDF/CSV) or type observation details.\n" +
          "3. The NLP engine auto-classifies SIF precursors, severity, and root causes.";
      } else if (lower.includes("real-time") || lower.includes("monitoring")) {
        response =
          "📡 Risk Intelligence & Live Monitoring:\n\n" +
          "• Open 'Risk Intelligence' to see live operational heatmaps.\n" +
          "• Risk levels update automatically as new site observations are submitted.\n" +
          "• Track exposure scores categorized by High, Medium, and Low risk thresholds.";
      } else if (lower.includes("ppe") || lower.includes("category")) {
        response =
          "📊 PPE Compliance & Category Analytics:\n\n" +
          "1. View the 'Category Analysis' section on your dashboard.\n" +
          "2. Check compliance percentages for Working at Heights, LOTO, and Machinery Safety.\n" +
          "3. Click any category bar to filter underlying observation logs.";
      } else if (lower.includes("alert") || lower.includes("notifications")) {
        response =
          "🔔 Alerts & Notifications Setup:\n\n" +
          "1. Select 'Alerts & Notifications' from the left sidebar.\n" +
          "2. Configure threshold rules (e.g., alert when SIF risk score > 75%).\n" +
          "3. High-risk precursor flags immediately highlight on your dashboard.";
      } else if (lower.includes("life saving") || lower.includes("lsr")) {
        response =
          "🛡️ Life Saving Rules (LSR):\n\n" +
          "• The LSR module maps site reports to standardized safety rules.\n" +
          "• Instantly tracks compliance for Energy Isolation, Work Permits, and Fall Protection.\n" +
          "• Flags repeat violations before severe incidents happen.";
      } else if (lower.includes("recurring") || lower.includes("pattern")) {
        response =
          "🔁 Tracking Recurring Safety Patterns:\n\n" +
          "1. Look at the 'Recurring Patterns' card on your main dashboard.\n" +
          "2. The AI aggregates repeated unsafe acts across different shifts or sites.\n" +
          "3. Focus preventive audits on repeat high-precursor patterns.";
      } else if (lower.includes("facility density") || lower.includes("model")) {
        response =
          "🏢 Facility Density Evaluation:\n\n" +
          "1. Access 'Facility Density' to analyze high-consequence work zones.\n" +
          "2. Combines equipment density, worker headcount, and historical flags.\n" +
          "3. Generates localized risk density heatmaps for targeted intervention.";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="flex-1" onClick={handleClose} />

      {/* Slide-over Drawer */}
      <div className="w-full max-w-md bg-[#0b1220] border-l border-white/10 text-white h-full flex flex-col shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#070b14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                AI safety assistant <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Intelligence engine online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-slate-300 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Welcome! I can guide you on how to use every feature on this SIF Sentinel dashboard. Click any question below to get started.
            </p>
          </div>

          {/* 8 How-To / Feature Preset Buttons */}
          {messages.length === 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-semibold text-slate-400 px-1">
                How-To & Dashboard Features Guide
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 font-medium transition text-slate-200 cursor-pointer flex items-center justify-between group"
                  >
                    <span className="pr-2 text-[11px]">{q}</span>
                    <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-purple-400 shrink-0 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Stream */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-white/[0.05] border border-white/10 text-slate-200 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white/[0.05] border border-white/10 text-purple-400 rounded-2xl px-4 py-2.5 text-xs animate-pulse">
                Fetching feature guide details...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-white/10 bg-[#070b14]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how to use any dashboard feature..."
              className="w-full pl-3 pr-10 py-2.5 text-xs bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              className="absolute right-2 p-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}