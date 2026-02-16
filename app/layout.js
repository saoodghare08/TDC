import { Work_Sans, Poppins } from "next/font/google"; // Import standard fonts
import "./globals.css";
import Providers from "@/components/Providers";
import Script from "next/script";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

import { createClient } from '@/utils/supabase/server';

export const revalidate = 518400; // 6 days in seconds

export async function generateMetadata() {
  const supabase = await createClient();
  const { data: seo } = await supabase
    .from('seo_metadata')
    .select('*')
    .eq('route', '/')
    .single();

  const title = seo?.title || "The Diet Cascade | Clinical Dietitian & Lifestyle Coach";
  const description = seo?.description || "Discover effective diet transformations with The Diet Cascade program. Personalized regimens for health, nutrition, and weight management.";
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://thedietcascade.com';

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: `%s | The Diet Cascade`,
    },
    description: description,
    keywords: seo?.keywords || "diet, nutrition, weight loss, health, wellness, clinical dietitian",
    icons: {
      icon: '/images/logo.png', // Main favicon
      shortcut: '/images/logo.png', // Shortcut icon
      apple: '/images/logo.png', // Apple touch icon
    },
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: 'The Diet Cascade',
      images: [
        {
          url: '/images/logo.png', // Replace with a dedicated OG image if available
          width: 800,
          height: 600,
          alt: 'The Diet Cascade Logo',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ['/images/logo.png'], // Replace with a dedicated Twitter image if available
    },
    alternates: {
      canonical: url,
    },
    verification: {
      google: 'guS34CTX4qg6zjDiGQFWarDgoqN90f41xhAIm5Ubn9Y',
    },
  };
}

function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'The Diet Cascade',
    image: 'https://thedietcascade.com/images/logo.png',
    '@id': 'https://thedietcascade.com',
    url: 'https://thedietcascade.com',
    telephone: '+919004491160',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nerul',
      addressLocality: 'Navi Mumbai',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.0330,
      longitude: 73.0297,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide'
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '09:00',
      closes: '21:00',
    },
    sameAs: [
      'https://www.instagram.com/thedietcascade',
      'https://twitter.com/thedietcascade',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({ children }) {

  return (
    <html lang="en" className="lenis">
      <body
        className={`${workSans.variable} ${poppins.variable} font-sans antialiased bg-gray-50`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1D06V6TYFC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-1D06V6TYFC');
          `}
        </Script>
        {/* End Google Analytics */}

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5MDWV8L5');
          `}
        </Script>
        {/* End Google Tag Manager */}

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5MDWV8L5"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          {children}
        </Providers>
        <StructuredData />
      </body>
    </html>
  );
}
