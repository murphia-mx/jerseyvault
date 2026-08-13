import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HomeCTA() {
  return (
    <section className="relative overflow-hidden bg-black py-32 md:py-48 border-t border-white/5 transition-colors duration-500">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", backgroundSize: '60px 60px' }}
      />
      <div className="relative max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-8">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Club Kit</p>
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase">
          Empieza tu<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30">
            Colección.
          </span>
        </h2>
        <p className="text-white/50 text-sm md:text-base max-w-lg leading-relaxed font-medium mt-4">
          Explora cientos de camisetas icónicas, cotiza por WhatsApp en segundos y asegura tu próxima pieza histórica.
        </p>
        <Link
          to="/catalogo"
          className="group mt-6 inline-flex items-center justify-center gap-3 h-14 px-10 rounded-full bg-white text-black font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform duration-300"
        >
          Ir al Catálogo
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
