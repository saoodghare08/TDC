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

import { createClient } from '@/utils/supabase/server';

export const revalidate = 518400; // 6 days in seconds

export default async function Home() {
  const supabase = await createClient();
  const { data: dbReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return (
    <main className="bg-white min-h-screen selection:bg-primary selection:text-white">
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Regimen />
      <ServiceSuite />
      <Pricing />
      <Workouts />
      <Testimonials initialReviews={dbReviews} />
      <Footer />
    </main>
  );
}
