import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getProducts } from '../services/catalog.service';
import type { Product } from '../types/product';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { getCategoria } from '../utils/productUtils';
import { Helmet } from 'react-helmet-async';

interface CollectionMeta {
  id: string;
  title: string;
  subtitle: string;
  filterFn: (p: Product) => boolean;
}

const COLLECTIONS: Record<string, CollectionMeta> = {
  'retro': {
    id: 'retro',
    title: 'Retro Collection',
    subtitle: 'La historia del fútbol tejida en cada hilo. Descubre las camisetas clásicas que marcaron una época.',
    filterFn: (p) => getCategoria(p) === 'retro'
  },
  'player-version': {
    id: 'player-version',
    title: 'Player Version',
    subtitle: 'Corte ajustado, tecnología de alto rendimiento. Las mismas camisetas que usan los profesionales en la cancha.',
    filterFn: (p) => getCategoria(p) === 'player'
  },
  'premier-league': {
    id: 'premier-league',
    title: 'Premier League',
    subtitle: 'Intensidad, pasión y el fútbol más rápido del mundo. Viste los colores de Inglaterra.',
    filterFn: (p) => p.liga === 'Premier League'
  },
  'la-liga': {
    id: 'la-liga',
    title: 'La Liga',
    subtitle: 'El talento puro y la técnica española. Las equipaciones de los gigantes de España.',
    filterFn: (p) => p.liga === 'La Liga'
  },
  'serie-a': {
    id: 'serie-a',
    title: 'Serie A',
    subtitle: 'Táctica, historia y elegancia italiana. Explora la colección del Calcio.',
    filterFn: (p) => p.liga === 'Serie A'
  },
  'bundesliga': {
    id: 'bundesliga',
    title: 'Bundesliga',
    subtitle: 'Fútbol total y aficiones incondicionales. El espíritu de Alemania en cada camiseta.',
    filterFn: (p) => p.liga === 'Bundesliga'
  },
  'liga-mx': {
    id: 'liga-mx',
    title: 'Liga MX',
    subtitle: 'La pasión del fútbol mexicano. Colores, historia y tradición de México.',
    filterFn: (p) => p.liga === 'Liga MX'
  },
  'ligue-1': {
    id: 'ligue-1',
    title: 'Ligue 1',
    subtitle: 'Talento, destello y el fútbol galo en su máxima expresión.',
    filterFn: (p) => p.liga === 'Ligue 1'
  },
  'novedades': {
    id: 'novedades',
    title: 'Novedades',
    subtitle: 'Lo último en llegar a la bóveda. Mantente siempre al día con los lanzamientos más recientes.',
    // As a proxy for newest, we can just reverse the array and take the first 100
    filterFn: () => true 
  }
};

export default function Collection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const collection = id ? COLLECTIONS[id] : null;

  useEffect(() => {
    if (!collection) {
      navigate('/404', { replace: true });
      return;
    }

    setIsLoading(true);
    getProducts().then(all => {
      let filtered = all.filter(collection.filterFn);
      
      // Special logic for "novedades" (we just reverse and slice to simulate latest)
      if (collection.id === 'novedades') {
        filtered = filtered.reverse().slice(0, 100);
      }
      
      setProducts(filtered);
      setIsLoading(false);
    });
  }, [collection, navigate]);

  return (
    <>
      <Helmet>
        <title>{collection ? `${collection.title} | Club Kit` : 'Cargando... | Club Kit'}</title>
        {collection && (
          <>
            <meta name="description" content={collection.subtitle} />
            <meta property="og:title" content={`${collection.title} | Club Kit`} />
            <meta property="og:description" content={collection.subtitle} />
          </>
        )}
      </Helmet>

      {collection && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
          {/* Breadcrumb / Back */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Collection Header */}
      <div className="mb-12 md:mb-16 max-w-3xl">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
          Colección Exclusiva
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-6">
          {collection.title}
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
          {collection.subtitle}
        </p>
        
        {!isLoading && (
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </div>
        )}
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3 p-2">
              <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[20px] w-full"></div>
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3 ml-1.5"></div>
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3 ml-1.5"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay productos en esta colección en este momento.</p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
        </div>
      )}
    </>
  );
}
