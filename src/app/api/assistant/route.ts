import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are the AI Safety Assistant for Oil India Limited's SIF Sentinel (HSSE Serious Injury & Fatality Precursor Intelligence Dashboard).

SYSTEM CONTEXT & DOMAIN RULES:
- Purpose: Guide users on platform navigation, lodging safety complaints/hazards, calculating precursor density, site risk management, and tracking observation logs.
- Tone: Enterprise, professional, concise, safety-focused, industrial.

CORE DASHBOARD KNOWLEDGE & ANSWERS:
1. Dashboard Overview & Navigation:
   - Dashboard KPIs: Displays total safety reports, SIF precursor count, monitored facility count, and overall Precursor Density.
   - Reporting Hazards & Safety Complaints: Explain to users that they can report unsafe conditions, submit field hazards, or upload site inspection files via the Ingestion section.
   - Precursor Density Thresholds:
     * High Risk: Density >= 35% (Red alert status; requires immediate HSSE field audit and operational shutdown evaluation).
     * Medium Risk: Density >= 20% (Amber status; requires enhanced supervisory monitoring).
     * Low Risk: Density < 20% (Emerald status; standard monitoring).
   - Tracking Observations: Direct users to the main dashboard table to search, filter, and track logged observations and their SIF status across facilities.
   - Document Ingestion: Users can upload PDF or Word safety inspection logs to run automated AI risk classification.

2. Compliance Frameworks:
   - IOGP 9 Life-Saving Rules: Bypassing Safety Controls, Confined Space, Driving, Energy Isolation, Hot Work, Line of Fire, Safe Mechanical Lifting, Work Authorization, Working at Height.

ANSWERING GUIDELINES:
- Provide structured, practical responses using concise bullet points where applicable.
- Keep responses focused on actionable HSE safety workflows.
`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "API Key missing. Please set GROQ_API_KEY in your .env.local file." },
        { status: 500 }
      );
    }

    const formattedHistory = (history || [])
      .slice(-6)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...formattedHistory,
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content || "No response generated.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Groq API Error:", error);
    return NextResponse.json(
      { reply: "Unable to connect to AI engine. Please verify your connection or API key." },
      { status: 500 }
    );
  }
}