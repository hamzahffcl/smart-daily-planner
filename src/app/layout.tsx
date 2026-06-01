import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeTextureProvider } from "@/components/ThemeTextureProvider";
import AlarmManager from "@/components/AlarmManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Daily Planner | Gamified Productivity Dashboard",
  description: "Boost your daily productivity. Carry over tasks, manage routines, track streaks, and level up with a Pomodoro Focus Mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ThemeTextureProvider>
              {children}
              <AlarmManager />
            </ThemeTextureProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
