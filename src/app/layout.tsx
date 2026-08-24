import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndusMind AI — Industrial Knowledge Intelligence",
  description:
    "AI-powered platform for industrial document intelligence. Query manuals, SOPs, maintenance records, and compliance documents instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
