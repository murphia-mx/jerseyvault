import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import stadiumBg from '../../assets/images/stadium-bg.jpg';

export function HomeHero() {
  return (
    <section className="relative w-full h-[100svh] flex flex-col justify-end overflow-hidden bg-[#0a0a0a]">
      {/* Background Image with intense cinematic dark overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] ease-out hover:scale-110"
        style={{ backgroundImage: `url(${stadiumBg})` }}
      />
      
      {/* Gradients to merge image with deep background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent" />
      
      {/* Deep noise texture for premium magazine print feel */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '100px' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 pb-20 sm:pb-32 flex flex-col items-start gap-8">
        
        <div className="animate-fade-up flex flex-col gap-1">
          <p className="text-white/60 text-sm md:text-base font-bold tracking-[0.3em] uppercase mb-2">
            Club Kit Colección 24/25
          </p>
          <h1 className="text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-tighter text-white drop-shadow-2xl uppercase">
            Cultura
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              Futbolera.
            </span>
          </h1>
        </div>

        <Link
          to="/catalogo"
          className="group relative inline-flex items-center justify-center gap-3 h-14 px-8 rounded-full bg-white text-black font-bold text-sm tracking-wide uppercase transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-up-delay-1 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        >
          <span>Descubrir Colección</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>

      </div>
    </section>
  );
}
