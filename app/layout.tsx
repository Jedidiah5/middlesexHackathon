import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const tripeeDisplay = Nunito({
  subsets: ["latin"],
  variable: "--font-tripee",
  display: "swap",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Tripee",
  description:
    "Tripee compares Gemini and Perplexity city perception on a 3D globe: sentiment, theme clusters, keywords, tag filters, and similar cities — static demo data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrains.variable} ${tripeeDisplay.variable} min-h-screen bg-white font-sans text-black`}
      >
        {children}
      </body>
    </html>
  );
}
