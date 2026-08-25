import type { Metadata, Viewport } from "next";
import { Anton, Barlow_Semi_Condensed } from "next/font/google";

import { ArenaHeader } from "@/components/arena/ArenaHeader";
import { MobileBottomNav } from "@/components/arena/MobileBottomNav";
import "./globals.css";

/**
 * Anton porte les titres : condensé, très lourd, proche du lettrage des
 * références. Barlow Semi Condensed porte tout le reste — assez étroit pour
 * rester dans l'univers sportif, assez ouvert pour rester lisible à 11 px.
 */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const barlow = Barlow_Semi_Condensed({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "L’ARÈNE — Tournoi de foot en salle",
  description:
    "Suivez L’ARÈNE en direct : scores, poules, classements et tableau final du tournoi de football en salle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-arena-black text-arena-white">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-arena-gold focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:uppercase focus:tracking-wider focus:text-arena-black"
        >
          Aller au contenu
        </a>

        <ArenaHeader />

        {/* La réserve basse libère la hauteur de la barre de navigation mobile,
            encoche comprise. Aucun contenu ne passe dessous. */}
        <div
          id="contenu"
          className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0"
        >
          {children}
        </div>

        <MobileBottomNav />
      </body>
    </html>
  );
}
