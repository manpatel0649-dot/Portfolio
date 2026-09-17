import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Courier_Prime,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import BackgroundLayers from "@/components/ui/BackgroundLayers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-courier-prime",
});

export const metadata: Metadata = {
  title: "Man Panchotiya — AI/ML Engineer & Founder",
  description:
    "I build LLMs, AI agents & data-driven intelligent software. Founder of Qeist.io and Aoneq Labs.",
  openGraph: {
    title: "Man Panchotiya — AI/ML Engineer & Founder",
    description:
      "I build LLMs, AI agents & data-driven intelligent software. Founder of Qeist.io and Aoneq Labs.",
    type: "website",
    // TODO: add og:image once design is final
  },
};

const fontVars = [
  geist.variable,
  geistMono.variable,
  instrumentSerif.variable,
  courierPrime.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVars}>
      <body className="antialiased overflow-x-hidden">
        {/* Fixed background: glows, grain, vignette — 3D canvas mounts here later */}
        <BackgroundLayers />
        {/* All page content at z-index 2 */}
        <div className="relative z-[2]">{children}</div>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
