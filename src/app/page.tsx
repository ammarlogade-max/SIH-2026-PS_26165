"use client";

import Link from "next/link";
import {
  ShieldAlert,
  Home,
  LayoutDashboard,
  UploadCloud,
  BrainCircuit,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  FileText,
  AlertTriangle,
  Activity,
  Factory,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Zap,
  Layers3,
  Target,
} from "lucide-react";

const stats = [
  {
    label: "Reports Processed",
    value: "12,842",
    change: "+24%",
    sub: "This Month",
    icon: FileText,
    type: "blue",
  },
  {
    label: "Active Alerts",
    value: "23",
    change: "+15%",
    sub: "High Priority",
    icon: CircleAlert,
    type: "red",
  },
  {
    label: "Life-Saving Rules",
    value: "12",
    change: "IOGP",
    sub: "Rules Covered",
    icon: ShieldCheck,
    type: "green",
  },
  {
    label: "Facilities Monitored",
    value: "48",
    change: "Across India",
    sub: "Operational Sites",
    icon: Factory,
    type: "purple",
  },
  {
    label: "Facility Density Index",
    value: "Medium",
    change: "Stable",
    sub: "Overall Risk Level",
    icon: Activity,
    type: "gold",
  },
];

const alerts = [
  {
    title: "Bypass of Safety Instrumented Function",
    facility: "Digboi Refinery",
    time: "2m ago",
    level: "High",
  },
  {
    title: "Loss of Primary Containment",
    facility: "Bongaigaon Terminal",
    time: "15m ago",
    level: "High",
  },
  {
    title: "Gas Leak Detected",
    facility: "Numaligarh Refinery",
    time: "32m ago",
    level: "Medium",
  },
  {
    title: "Hot Work without Permit",
    facility: "Paradip Terminal",
    time: "1h ago",
    level: "Medium",
  },
];

const riskCategories = [
  { name: "Process Safety", value: 35 },
  { name: "Mechanical Integrity", value: 26 },
  { name: "Work Practices", value: 17 },
  { name: "Asset Integrity", value: 13 },
  { name: "Other", value: 9 },
];

const sidebarItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Command Center", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Report Ingestion", icon: UploadCloud, href: "/dashboard/ingest" },
  { name: "Risk Intelligence", icon: BrainCircuit, href: "/dashboard" },
  { name: "Facility Density", icon: BarChart3, href: "/dashboard" },
  { name: "Alerts & Notifications", icon: Bell, href: "/dashboard" },
  { name: "Life-Saving Rules", icon: ShieldCheck, href: "/dashboard" },
  { name: "Analytics", icon: TrendingUp, href: "/dashboard" },
  { name: "Settings", icon: Settings, href: "/dashboard" },
];

function StatIcon({
  type,
  icon: Icon,
}: {
  type: string;
  icon: React.ElementType;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    gold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div
      className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${styles[type]}`}
    >
      <Icon className="w-6 h-6" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex overflow-x-hidden">
      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside className="hidden lg:flex w-[260px] shrink-0 min-h-screen fixed left-0 top-0 bottom-0 z-50 flex-col border-r border-white/[0.07] bg-[#07101d]/95 backdrop-blur-2xl">
        {/* Logo */}
        <div className="h-[88px] px-6 flex items-center border-b border-white/[0.06]">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="ml-3">
            <div className="font-bold text-white text-[17px] tracking-tight">
              SIF SENTINEL
            </div>
            <div className="inline-flex mt-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-bold tracking-wide">
              OIL INDIA LIMITED
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-600 font-bold px-3 mb-3">
            Safety Intelligence
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all group ${
                    active
                      ? "bg-amber-500/[0.10] text-amber-400 border border-amber-500/[0.08]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.035]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-amber-400" />
                  )}

                  <Icon
                    className={`w-[18px] h-[18px] ${
                      active
                        ? "text-amber-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System status */}
        <div className="px-4 pb-5">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-600 font-bold mb-3">
              System Status
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">
                Operational
              </span>
            </div>

            <div className="text-xs text-slate-500 mt-2">
              All systems normal
            </div>
          </div>

          <div className="mt-5 px-2 flex items-center gap-2 text-xs text-slate-600">
            <ShieldAlert className="w-4 h-4" />
            SIF Sentinel v2.0.0
          </div>

          <div className="px-2 mt-2 text-[10px] text-slate-700">
            © 2026 Oil India Limited
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN AREA
      ========================================================= */}
      <main className="lg:ml-[260px] flex-1 min-w-0">
        {/* =======================================================
            TOP HEADER
        ======================================================= */}
        <header className="h-[88px] sticky top-0 z-40 border-b border-white/[0.07] bg-[#070b13]/85 backdrop-blur-2xl">
          <div className="h-full px-6 xl:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

                <span className="text-xs text-slate-400">
                  SIH26165
                </span>

                <span className="text-slate-700">•</span>

                <span className="text-xs text-slate-500">
                  Serious Injury & Fatality Precursor Detection
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="hidden sm:flex text-sm text-slate-400 hover:text-white transition-colors"
              >
                Command Center
              </Link>

              <Link
                href="/dashboard/ingest"
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-5 py-3 transition-all shadow-lg shadow-amber-500/10"
              >
                <UploadCloud className="w-4 h-4" />
                Ingest Reports
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button className="relative w-11 h-11 rounded-xl border border-white/[0.08] bg-white/[0.025] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* =======================================================
            PAGE CONTENT
        ======================================================= */}
        <div className="p-5 sm:p-6 xl:p-8 space-y-6">
          {/* =====================================================
              HERO
          ===================================================== */}
          <section className="relative min-h-[430px] rounded-3xl overflow-hidden border border-white/[0.08]">
            {/* Video */}
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src="/SIH.mp4"
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Video overlays */}
            <div className="absolute inset-0 bg-[#06101f]/55" />

            <div className="absolute inset-0 bg-gradient-to-r from-[#06101f]/95 via-[#06101f]/70 to-[#06101f]/35" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#06101f] via-transparent to-[#06101f]/40" />

            {/* Hero content */}
            <div className="relative z-10 min-h-[430px] p-7 sm:p-10 xl:p-12 flex flex-col justify-center">
              <div className="max-w-4xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.07] backdrop-blur-md px-4 py-2 text-xs font-semibold text-amber-300 mb-7">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Serious Injury & Fatality Intelligence Platform
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] text-white">
                  Predict & Prevent Fatalities
                  <span className="block text-amber-400 mt-2">
                    Before High-Risk Incidents Occur
                  </span>
                </h1>

                <p className="mt-6 max-w-3xl text-sm sm:text-base xl:text-lg leading-7 text-slate-300">
                  SIF Sentinel transforms unstructured safety observations,
                  near-miss reports and plant hazard cards into explainable
                  precursor intelligence, IOGP Life-Saving Rule classifications
                  and actionable facility risk insights.
                </p>

                {/* Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 text-sm transition-all shadow-xl shadow-amber-500/15"
                  >
                    Launch Safety Command Center
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/dashboard/ingest"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.10] backdrop-blur-md text-white font-semibold px-6 py-3.5 text-sm transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload / Ingest Reports
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Hero status card */}
              <div className="absolute hidden xl:flex right-8 bottom-8 w-[275px] rounded-2xl border border-white/[0.10] bg-[#07101d]/75 backdrop-blur-xl p-5">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                      Today's Overview
                    </span>

                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Reports Processed
                      </span>
                      <span className="font-bold text-white">1,248</span>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Active Alerts
                      </span>
                      <span className="font-bold text-red-400">17</span>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Life-Saving Rules
                      </span>
                      <span className="font-bold text-emerald-400">12</span>
                    </div>

                    <div className="h-px bg-white/[0.06]" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        System Uptime
                      </span>
                      <span className="font-bold text-white">99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              KPI CARDS
          ===================================================== */}
          <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group relative rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 hover:bg-[#0e1624] hover:border-amber-500/20 transition-all p-5 overflow-hidden"
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-500/[0.025] blur-2xl group-hover:bg-amber-500/[0.06] transition-all" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <StatIcon type={stat.type} icon={Icon} />

                      {stat.type === "red" ? (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="text-2xl font-bold text-white tracking-tight">
                        {stat.value}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {stat.label}
                      </div>

                      <div className="text-[10px] text-slate-600 mt-1">
                        {stat.sub}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* =====================================================
              ANALYTICS ROW
          ===================================================== */}
          <section className="grid xl:grid-cols-[1.5fr_1fr_1.15fr] gap-5">
            {/* Alerts Trend */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm font-bold text-white">
                    Alerts Trend
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    High-priority precursor alerts
                  </div>
                </div>

                <select className="bg-[#101725] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-400 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>

              {/* Chart */}
              <div className="h-[220px] relative">
                {/* horizontal grid */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[40, 30, 20, 10, 0].map((n) => (
                    <div
                      key={n}
                      className="flex items-center gap-3"
                    >
                      <span className="w-5 text-[10px] text-slate-700 text-right">
                        {n}
                      </span>
                      <div className="h-px bg-white/[0.045] flex-1" />
                    </div>
                  ))}
                </div>

                {/* Area */}
                <div className="absolute left-8 right-0 top-3 bottom-5">
                  <svg
                    viewBox="0 0 700 200"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                  >
                    <defs>
                      <linearGradient
                        id="chartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f59e0b"
                          stopOpacity="0.28"
                        />
                        <stop
                          offset="100%"
                          stopColor="#f59e0b"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0,145 C35,135 55,80 100,85 C145,90 150,130 190,120 C230,110 235,50 280,62 C325,74 315,115 360,110 C405,105 405,92 445,95 C485,98 480,115 520,110 C560,105 555,65 600,68 C640,70 650,105 700,55 L700,200 L0,200 Z"
                      fill="url(#chartGradient)"
                    />

                    <path
                      d="M0,145 C35,135 55,80 100,85 C145,90 150,130 190,120 C230,110 235,50 280,62 C325,74 315,115 360,110 C405,105 405,92 445,95 C485,98 480,115 520,110 C560,105 555,65 600,68 C640,70 650,105 700,55"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                    />

                    {[
                      [100, 85],
                      [190, 120],
                      [280, 62],
                      [360, 110],
                      [445, 95],
                      [520, 110],
                      [600, 68],
                      [700, 55],
                    ].map(([x, y], i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#f59e0b"
                        stroke="#0b111d"
                        strokeWidth="3"
                      />
                    ))}
                  </svg>
                </div>

                <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-slate-700">
                  <span>May 15</span>
                  <span>May 16</span>
                  <span>May 17</span>
                  <span>May 18</span>
                  <span>May 19</span>
                  <span>May 20</span>
                  <span>May 21</span>
                </div>
              </div>
            </div>

            {/* Risk Categories */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm font-bold text-white">
                    Top Risk Categories
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Distribution of current alerts
                  </div>
                </div>

                <BarChart3 className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex items-center gap-6">
                {/* Donut */}
                <div
                  className="relative w-32 h-32 rounded-full shrink-0"
                  style={{
                    background:
                      "conic-gradient(#3b82f6 0deg 126deg, #ef4444 126deg 219.6deg, #f59e0b 219.6deg 280.8deg, #10b981 280.8deg 327.6deg, #64748b 327.6deg 360deg)",
                  }}
                >
                  <div className="absolute inset-[18px] rounded-full bg-[#0b111d] flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      23
                    </span>
                    <span className="text-[9px] text-slate-600 uppercase">
                      Total Alerts
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {riskCategories.map((risk, index) => {
                    const dots = [
                      "bg-blue-400",
                      "bg-red-400",
                      "bg-amber-400",
                      "bg-emerald-400",
                      "bg-slate-500",
                    ];

                    return (
                      <div
                        key={risk.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${dots[index]}`}
                          />
                          <span className="text-[10px] text-slate-400 truncate">
                            {risk.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-slate-300">
                          {risk.value}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm font-bold text-white">
                    Recent High Priority Alerts
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Live precursor intelligence
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.title}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.025] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                        alert.level === "High"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {alert.level === "High" ? (
                        <CircleAlert className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-slate-200 truncate">
                        {alert.title}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-500 truncate">
                          {alert.facility}
                        </span>
                        <span className="text-slate-700">•</span>
                        <span className="text-[9px] text-slate-600">
                          {alert.time}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-1 rounded-md border ${
                        alert.level === "High"
                          ? "text-red-400 border-red-500/20 bg-red-500/5"
                          : "text-amber-400 border-amber-500/20 bg-amber-500/5"
                      }`}
                    >
                      {alert.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =====================================================
              INTELLIGENCE MODULES
          ===================================================== */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-white">
                  Safety Intelligence Engine
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Core analytical capabilities powering SIF Sentinel
                </div>
              </div>

              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                Open Command Center
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5 hover:border-amber-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Target className="w-5 h-5" />
                </div>

                <div className="text-sm font-bold text-white">
                  SIF Precursor Detection
                </div>

                <p className="text-xs text-slate-500 leading-5 mt-2">
                  Identifies observations containing potential serious injury
                  and fatality precursors.
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Layer A Active
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5 hover:border-amber-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Layers3 className="w-5 h-5" />
                </div>

                <div className="text-sm font-bold text-white">
                  IOGP Life-Saving Rules
                </div>

                <p className="text-xs text-slate-500 leading-5 mt-2">
                  Maps safety observations to relevant Life-Saving Rule
                  categories for compliance intelligence.
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  9 Rules Covered
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5 hover:border-amber-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <BrainCircuit className="w-5 h-5" />
                </div>

                <div className="text-sm font-bold text-white">
                  Explainable AI
                </div>

                <p className="text-xs text-slate-500 leading-5 mt-2">
                  Provides transparent mathematical reasoning behind safety
                  classifications and precursor predictions.
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auditable Results
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#0b111d]/80 p-5 hover:border-amber-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>

                <div className="text-sm font-bold text-white">
                  Pattern Intelligence
                </div>

                <p className="text-xs text-slate-500 leading-5 mt-2">
                  Detects recurring safety patterns and highlights facilities
                  requiring immediate attention.
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Continuous Monitoring
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              FOOTER
          ===================================================== */}
          <footer className="pt-3 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldAlert className="w-4 h-4 text-amber-500/60" />
              <span>SIF Sentinel · Oil India Limited</span>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-700">
              <span>SIH26165</span>
              <span>•</span>
              <span>Safety Intelligence Platform</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
          </footer>
        </div>
      </main>

      {/* Floating action */}
      <button className="fixed bottom-5 left-5 lg:left-[278px] z-50 w-11 h-11 rounded-full border border-white/10 bg-[#0c1420]/90 backdrop-blur-xl text-white flex items-center justify-center shadow-xl hover:border-amber-500/30 transition-all">
        <Zap className="w-5 h-5 text-amber-400" />
      </button>
    </div>
  );
}