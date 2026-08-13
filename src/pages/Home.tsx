import { HomeHero } from '../components/home/Hero';
import { BentoDiscovery } from '../components/home/BentoDiscovery';
import { SpotlightManifesto } from '../components/home/SpotlightManifesto';
import { TrendingSection } from '../components/home/TrendingSection';
import { HomeCTA } from '../components/home/HomeCTA';
import { Helmet } from 'react-helmet-async';

/**
 * Home page narrative funnel (Cinematic Brand Experience):
 * 1. Hero (Impact & Atmosphere) - Deep Dark
 * 2. Bento Discovery (Exploration) - White/Dark
 * 3. Spotlight (Logic/Process) - White/Dark
 * 4. Trending (Desire/Social Proof) - Gray/Dark
 * 5. CTA (Action) - Brand Accent
 */
export default function Home() {
  return (
    <div className="flex flex-col w-full animate-fade-in">
      <Helmet>
        <title>Club Kit | Jerseys de Fútbol Premium</title>
        <meta name="description" content="Explora una colección premium de jerseys de fútbol de clubes y selecciones. Encuentra modelos Home, Away, Retro y Player Version en Club Kit." />
        <meta property="og:title" content="Club Kit | Jerseys de Fútbol Premium" />
        <meta property="og:description" content="Explora una colección premium de jerseys de fútbol de clubes y selecciones. Encuentra modelos Home, Away, Retro y Player Version en Club Kit." />
      </Helmet>
      <HomeHero />
      <BentoDiscovery />
      <SpotlightManifesto />
      <TrendingSection />
      <HomeCTA />
    </div>
  );
}
