import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "RepoMax — GitHub Repo Score & Resume Bullets",
  description:
    "Paste a public GitHub repo. Get a Repo Score across 6 categories, see what's weak, and copy 3 resume bullets grounded in your code.",
  openGraph: {
    title: "RepoMax — GitHub Repo Score & Resume Bullets",
    description: "Score your GitHub repo across 6 categories and get resume bullets grounded in what you built.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoMax — GitHub Repo Score & Resume Bullets",
    description: "Score your GitHub repo across 6 categories and get resume bullets grounded in what you built.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
