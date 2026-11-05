import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

/** One family, its width axis does the talking: wide titles, narrow spines. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const viewport: Viewport = {
  themeColor: "#17141f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TrophyHunter : suivi de tes jeux",
  description: "Suis tes jeux Steam, Xbox, Epic Games et GOG : en cours, à jouer, terminés, avec tes succès en bonus.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrophyHunter",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

import AppShell from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${archivo.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper selection:bg-lamp selection:text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
