import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import About from '@/components/home/About';
import Stats from '@/components/home/Stats';
import Regimen from '@/components/home/Regimen';
import ServiceSuite from '@/components/home/ServiceSuite';
import Pricing from '@/components/home/Pricing';
import Workouts from '@/components/home/Workouts';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/layout/Footer';
import data from '@/data/content.json';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    'name': 'The Diet Cascade',
    'image': 'https://thedietcascade.com/images/logo.png',
    'description': data.about.paragraphs[0],
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': data.footer.address,
      'addressCountry': 'IN'
    },
    'telephone': data.footer.phone,
    'priceRange': '$$'
  };

  return (
    <main className="bg-white min-h-screen selection:bg-primary selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Analytics />
      <SpeedInsights/>
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Regimen />
      <ServiceSuite />
      <Pricing />
      <Workouts />
      <Testimonials />
      <Footer />
    </main>
  );
}
