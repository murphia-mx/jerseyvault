import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import manifestoBg from '../../assets/images/manifesto-bg.jpg';

export function SpotlightManifesto() {
  return (
    <section className="relative w-full py-40 md:py-60 flex items-center justify-center overflow-hidden bg-black border-t border-white/5">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 bg-fixed"
        style={{ backgroundImage: `url(${manifestoBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/80" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6 block">
          Manifiesto Club Kit
        </span>
        
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8 uppercase tracking-tight">
          No vendemos ropa.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30">
            Preservamos historia.
          </span>
        </h2>
        
        <p className="text-white/60 text-sm md:text-lg max-w-2xl font-medium leading-relaxed mb-12">
          Cada costura, cada escudo, cada dorsal cuenta una historia. Seleccionamos rigurosamente cada pieza de nuestro archivo para garantizar autenticidad, calidad y el respeto absoluto por la cultura del fútbol.
        </p>

        <Link
          to="/catalogo"
          className="group inline-flex items-center justify-center gap-3 h-14 px-10 rounded-full border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
        >
          Explorar el Archivo
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
