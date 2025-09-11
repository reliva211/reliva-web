import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/mobile-responsive.css";
import "@/styles/horizontal-list.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import LayoutWrapper from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Reliva",
  description: "Track your music, books, and movies all in one place",
  generator: "v0.dev",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="google-site-verification" content="LWPPCUOVUq2lwKifp4K7Ith4Jqmvzy8eH42omVsmJQo" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-140K6ZQMCD"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-140K6ZQMCD');
            `,
          }}
        />
        
        {/* Global JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://www.reliva.me",
              "name": "Reliva",
              "alternateName": "What's your Reliva?",
              "description": "Reliva is a social platform where you can share your favorite music, movies, TV shows, and books all in one place. give and get recommendations from your friends, rate and review media.",
              "inLanguage": "en",
              "publisher": {
                "@type": "Organization",
                "name": "Reliva",
                "url": "https://www.reliva.me",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.reliva.me/placeholder-logo.svg"
                },
                "sameAs": [
                  "https://www.instagram.com/relivaofficial",
                  "https://x.com/relivaofficial",
                  "https://www.reddit.com/r/relivaofficial"
                ],
                "email": "reliva211@gmail.com"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.reliva.me",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
