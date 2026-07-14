import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ThemeProvider, themeInitScript } from '@/components/layout/ThemeProvider';
import { Footer } from '@/components/layout/Footer';
import {
  SITE,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from '@/lib/seo';

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.author, url: 'https://swarms.ai' }],
  creator: SITE.author,
  publisher: SITE.author,
  category: 'technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE.url,
    languages: { 'en-US': SITE.url },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: SITE.locale,
    images: [
      {
        url: `${SITE.url}${SITE.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [`${SITE.url}${SITE.ogImage}`],
  },
  icons: {
    icon: [{ url: '/swarms-logo.svg', type: 'image/svg+xml' }],
    shortcut: '/swarms-logo.svg',
    apple: '/swarms-logo.svg',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: 'black-translucent',
  },
  // Populate via env to verify ownership in each search console.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION && {
      other: {
        'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
      },
    }),
    ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION && {
      yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} overflow-x-hidden`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden max-w-[100vw] bg-background text-foreground">
        <ThemeProvider>
          <div className="min-h-screen min-h-[100dvh] min-w-0 max-w-full overflow-x-hidden flex flex-col">
            <div className="flex-1 flex flex-col min-w-0">{children}</div>
            <Footer />
            <ToastContainer />
            <OnboardingWizard />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
