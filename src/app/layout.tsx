import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AIAssistantProvider } from "@/context/AIAssistantContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIF Sentinel | Oil India Limited",
  description:
    "AI/NLP Engine for Serious Injury & Fatality Precursor Detection for Oil India Limited (SIH26165)",
  openGraph: {
    title: "SIF Sentinel | Oil India Limited",
    description:
      "AI/NLP Engine for Serious Injury & Fatality Precursor Detection for Oil India Limited (SIH26165)",
  },
};

const themeBootstrapScript = `
  (() => {
    try {
      const storedTheme = localStorage.getItem("sif-theme");
      const theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AIAssistantProvider>
            {children}
          </AIAssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
