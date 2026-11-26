import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "amens.store — mets en ligne tes projets IA, apps et business (même sans carte bancaire)",
    template: "%s | amens.store",
  },
  description:
    "Le guide francophone pour mettre en ligne tes projets IA, tes apps, ton site, ton email pro et ton business — même sans carte bancaire. Guides testés, prix réels sur 12-36 mois, données Labo. Mise à jour novembre 2026.",
  keywords: [
    "héberger n8n",
    "déployer app lovable",
    "hébergeur orange money",
    "VPS pas cher",
    "email pro nom de domaine",
    "black friday hébergement 2026",
    "site web cameroun fcfa",
    "quitter vercel",
  ],
  authors: [{ name: "Équipe amens.store" }],
  openGraph: {
    title: "amens.store — le guide francophone de la mise en ligne",
    description:
      "Projets IA, apps, sites, email pro — même sans carte bancaire. Chaque hébergeur testé, chaque prix daté.",
    url: SITE_URL,
    siteName: "amens.store",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "amens.store — mets en ligne tes projets",
    description: "Guides testés + prix réels + données Labo. Même sans carte bancaire.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organisation`,
      name: "amens.store",
      url: SITE_URL,
      description:
        "Guide francophone de mise en ligne : projets IA, apps, sites, email pro — même sans carte bancaire.",
      knowsAbout: [
        "hébergement web",
        "auto-hébergement IA",
        "n8n",
        "vibe coding",
        "Mobile Money",
        "email professionnel",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      url: SITE_URL,
      name: "amens.store",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organisation` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
