// app/layout.tsx
import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Professional Ironing Service | PSR Aster, Sarjapur Road",
  description:
    "Fast, affordable, professional steam ironing service with pickup & drop. Serving PSR Aster, Chambenahalli – book your ironing now!",
  openGraph: {
    title: "Professional Steam Ironing Service – PSR Aster",
    description:
      "Fast & reliable steam ironing with pickup and drop at PSR Aster, Sarjapur Road.",
    url: "https://iron-shop-web.vercel.app",
    siteName: "Ironing Service",
    images: [
      {
        url: "/og-banner.jpg", // file lives in /public
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Steam Ironing Service – PSR Aster",
    description:
      "Fast & reliable steam ironing with pickup and drop at PSR Aster.",
    images: ["/og-banner.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0DVK0CPTNN"
          strategy="afterInteractive"
        />
        <Script id="ga-gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0DVK0CPTNN');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
