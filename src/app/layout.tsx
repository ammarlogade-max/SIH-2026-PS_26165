import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AIAssistantProvider } from "@/context/AIAssistantContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIF Sentinel — Industrial Safety Intelligence",
  description:
    "AI-powered industrial knowledge intelligence for serious injury and fatality prevention.",
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
