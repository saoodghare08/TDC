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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
