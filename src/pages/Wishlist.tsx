import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { getProducts } from '../services/catalog.service';
import type { Product } from '../types/product';
import { ProductCard } from '../components/catalog/ProductCard';
import { Button } from '../components/ui/Button';
import { Helmet } from 'react-helmet-async';

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3 p-2">
          <div className="aspect-[4/5] bg-gray-100 dark:bg-white/5 rounded-[20px] w-full" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-2/3 ml-1.5" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/2 ml-1.5" />
        </div>
      ))}
    </div>
  );
}

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProducts().then(all => {
      setProducts(all.filter(p => ids.includes(p.id)));
      setIsLoading(false);
    });
  }, [ids]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-up">
      <Helmet>
        <title>Favoritos | Club Kit</title>
        <meta name="description" content="Guarda y organiza tus jerseys de fútbol favoritos en tu colección personal de Club Kit." />
      </Helmet>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Colección personal</p>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">Favoritos</h1>
        </div>
        {products.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">{products.length}</span>{' '}
            {products.length === 1 ? 'producto guardado' : 'productos guardados'}
          </p>
        )}
      </div>

      {isLoading ? (
        <WishlistSkeleton />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6">
            <Heart className="w-9 h-9 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin favoritos aún</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mb-8 leading-relaxed">
            Guarda las camisetas que te interesan tocando el corazón en cada producto.
          </p>
          <Link to="/catalogo">
            <Button className="gap-2">
              Explorar catálogo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
