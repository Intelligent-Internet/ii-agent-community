import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TripGenius - AI-Powered Travel Planner",
  description: "Plan your perfect trip with AI-powered itineraries, smart recommendations, and seamless booking experiences.",
  keywords: ["travel", "AI", "trip planning", "itinerary", "vacation", "tourism"],
  authors: [{ name: "TripGenius Team" }],
  openGraph: {
    title: "TripGenius - AI-Powered Travel Planner",
    description: "Plan your perfect trip with AI-powered itineraries",
    type: "website",
    url: "https://tripgenius.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background font-nunito antialiased">
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <ClientBody>{children}</ClientBody>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
