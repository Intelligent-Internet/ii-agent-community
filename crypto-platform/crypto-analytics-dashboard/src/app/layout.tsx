import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import AuthProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Crypto Analytics Dashboard",
  description: "Advanced crypto analytics platform with AI-powered predictions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} dark`} suppressHydrationWarning>
      <body className={`${nunitoSans.className} antialiased`}>
        <AuthProvider>
          <ClientBody>{children}</ClientBody>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
