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

export async function generateMetadata() {
  const supabase = await createClient();
  const { data: seo } = await supabase
    .from('seo_metadata')
    .select('*')
    .eq('route', '/')
    .single();

  return {
    title: seo?.title || "The Diet Cascade | Clinical Dietitian & Lifestyle Coach",
    description: seo?.description || "Discover effective diet transformations with The Diet Cascade program. Personalized regimens for health, nutrition, and weight management.",
    keywords: seo?.keywords || "diet, nutrition, weight loss, health, wellness, clinical dietitian",
    icons: {
      icon: '/images/logo.png', // Main favicon
      shortcut: '/images/logo.png', // Shortcut icon
      apple: '/images/logo.png', // Apple touch icon
    },
    verification: {
      google: 'guS34CTX4qg6zjDiGQFWarDgoqN90f41xhAIm5Ubn9Y',
    },
  };
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
      </body>
    </html>
  );
}
