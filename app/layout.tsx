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
import ScrollProvider from "@/components/ScrollProvider";
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
  metadataBase: new URL("https://manpanchotiya.com"),
  title: "Man Panchotiya — AI/ML Engineer & Founder",
  description:
    "I build LLMs, AI agents & data-driven intelligent software. Founder of Qeist.io and Aoneq Labs.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Man Panchotiya — AI/ML Engineer & Founder",
    description:
      "I build LLMs, AI agents & data-driven intelligent software. Founder of Qeist.io and Aoneq Labs.",
    url: "https://manpanchotiya.com",
    siteName: "Man Panchotiya",
    type: "website",
    images: [
      {
        url: "/og-image",
        width: 1200,
        height: 630,
        alt: "Man Panchotiya — AI/ML Engineer & Founder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Man Panchotiya — AI/ML Engineer & Founder",
    description:
      "I build LLMs, AI agents & data-driven intelligent software. Founder of Qeist.io and Aoneq Labs.",
    images: ["/og-image"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Man Panchotiya",
  jobTitle: "AI/ML Engineer & Founder",
  url: "https://manpanchotiya.com",
  email: "manpatel0649@gmail.com",
  sameAs: [
    "https://github.com/manpatel0649-dot",
    "https://linkedin.com/in/manpanchotiya",
    "https://huggingface.co/manpanchotiya",
  ],
  worksFor: [
    { "@type": "Organization", name: "Qeist.io" },
    { "@type": "Organization", name: "Aoneq Labs" },
  ],
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
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Skip navigation for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {/* Fixed background: glows, grain, vignette, 3D canvas */}
        <BackgroundLayers />
        {/* Lenis smooth scroll + GSAP ScrollTrigger hero pin */}
        <ScrollProvider>
          {/* All page content at z-index 2 */}
          <div className="relative z-[2]">{children}</div>
        </ScrollProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
