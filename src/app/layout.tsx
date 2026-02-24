import type { Metadata } from "next";
import { Oswald, Montserrat } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eataliano — Italiaans Restaurant in Arnhem & Huissen",
  description:
    "Authentieke Italiaanse pizza, pasta en meer. Bestel online of reserveer een tafel bij Eataliano in Arnhem of Huissen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${oswald.variable} ${montserrat.variable}`}>
      <body>
        {children}
        {/* ChatToggle: added by SER-65 (Chatbot UI) */}
      </body>
    </html>
  );
}
