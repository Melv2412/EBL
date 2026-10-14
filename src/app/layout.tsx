import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RevealObserver } from "@/components/motion";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["500", "600", "700"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ESATIC Basket League", template: "%s · EBL" },
  description:
    "La ligue de basket inter-promos de l'ESATIC : éditions, promos, finales et MVP depuis 2019.",
  openGraph: {
    siteName: "ESATIC Basket League",
    locale: "fr_CI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#15191d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition seulement si le JS tourne. */}
        <script dangerouslySetInnerHTML={{ __html:
              "document.documentElement.classList.add('js');try{if(localStorage.getItem('ebl-theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}" }} />
      </head>
      <body className={`${inter.variable} ${oswald.variable} overflow-x-hidden font-sans antialiased`}>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-teal focus:px-3 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="min-h-[70vh]">
          {children}
        </main>
        <SiteFooter />
        <RevealObserver />
      </body>
    </html>
  );
}
