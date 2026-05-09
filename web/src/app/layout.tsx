import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { PowerOnPreloader } from "@/components/ui/power-on";
import { GoogleTagManager } from '@next/third-parties/google';
import "./globals.css";

// Fontes Locais da Marca
const chillax = localFont({
  src: [
    {
      path: "../assets/fonts/Chillax-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/Chillax-Semibold.otf",
      weight: "600",
      style: "normal",
    }
  ],
  variable: "--font-chillax",
});

const steelfish = localFont({
  src: [
    {
      path: "../assets/fonts/Steelfish Bd.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/Steelfish Rg.otf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-steelfish",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://xtage.app'),
  title: "XPACE DANCE | A Evolução do Streaming e Ensino de Dança",
  description: "Aprenda com os maiores coreógrafos e mestres da dança urbana. Acompanhe aulas exclusivas de Hip Hop, Locking, Breaking, Jazz Funk e mais em uma plataforma neon gamificada e com player em 4K.",
  keywords: ["dança", "aulas de dança online", "hip hop", "dance streaming", "coreografia", "locking", "breaking", "xpace dance", "dança urbana"],
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "XPACE DANCE | Evolução da Dança Urbana Plataforma",
    description: "Aprenda, jogue, ranqueie e dance. Aulas de Hip Hop, Breaking e mais com os melhores mestres do Brasil.",
    url: "https://xtage.app",
    siteName: "XPACE DANCE",
    images: [
      {
        url: "/images/bg-degrade.png",
        width: 1200,
        height: 630,
        alt: "Painel XPACE DANCE - Streaming de Dança",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XPACE DANCE",
    description: "Sua nova academia de dança online.",
  },
};

import { Analytics } from "@vercel/analytics/next";
import { AffiliateTracker } from "@/components/providers/affiliate-tracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${chillax.variable} ${steelfish.variable} ${poppins.variable} font-sans antialiased text-gray-100 bg-black`}
      >
        {/* Skip Navigation — Acessibilidade WCAG 2.1 AA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest"
        >
          Pular para o conteúdo
        </a>
        <PowerOnPreloader>
          <AffiliateTracker />
          <main id="main-content">
            {children}
          </main>
        </PowerOnPreloader>
        <script dangerouslySetInnerHTML={{
          __html: `
          if (localStorage.getItem('xpace-theme') === 'light') {
            document.documentElement.classList.add('theme-light');
          }
        `}} />
        <Analytics />
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
      </body>
    </html>
  );
}
