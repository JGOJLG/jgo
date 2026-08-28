import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "JGO OS",
  description: "JGO Hire Operating System",
  manifest: "/manifest.webmanifest",
  applicationName: "JGO OS",
  appleWebApp: {
    capable: true,
    title: "JGO OS",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
