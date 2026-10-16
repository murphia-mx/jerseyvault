import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { ProductImage } from '../ui/ProductImage';
import { WishlistButton } from '../wishlist/WishlistButton';
import { cn } from '../../utils/cn';
import { Eye } from 'lucide-react';
import { getCategoria } from '../../utils/productUtils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const BADGE_STYLES = {
  player: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
  retro: 'bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300',
  standard: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400',
} as const;

export function ProductCard({ product, index }: ProductCardProps) {
  const primarySrc = product.thumbnail || product.imagenes?.[0];
  const fallbacks = product.thumbnail
    ? product.imagenes ?? []
    : (product.imagenes ?? []).slice(1);

  const categoria = getCategoria(product);

  return (
    <div className="group flex h-full flex-col gap-3.5 animate-fade-up">
      {/* Image */}
      <Link
        to={`/producto/${product.slug}`}
        className={cn(
          'relative block aspect-[4/5] w-full flex-shrink-0 overflow-hidden rounded-2xl',
          'bg-gray-100 dark:bg-white/[0.04]',
          'ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]',
          'transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.25)]',
          'dark:group-hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]'
        )}
      >
        <ProductImage
          src={primarySrc}
          fallbackSrcs={fallbacks}
          alt={product.nombre}
          loading={index !== undefined && index < 8 ? 'eager' : 'lazy'}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* Subtle gradient from the bottom on hover, for the quick action */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Quick action (desktop only) */}
        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full p-3 transition-transform duration-300 ease-out group-hover:translate-y-0 sm:block">
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-xs font-semibold text-gray-900 opacity-0 shadow-lg backdrop-blur-md transition-opacity delay-75 duration-300 group-hover:opacity-100">
            <Eye className="h-4 w-4" />
            Ver detalles
          </div>
        </div>

        {/* Wishlist */}
        <div
          className={cn(
            'absolute right-2.5 top-2.5 z-10 transition-all duration-300',
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            'translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0'
          )}
        >
          <WishlistButton productId={product.id} className="shadow-lg" />
        </div>
      </Link>

      {/* Info */}
      <Link to={`/producto/${product.slug}`} className="flex flex-1 flex-col gap-1.5 px-0.5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
          {product.liga}
          <span className="mx-1.5 text-gray-300 dark:text-gray-700" aria-hidden="true">·</span>
          {product.equipo}
        </p>

        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-gray-600 sm:text-sm dark:text-white dark:group-hover:text-white/75">
          {product.nombre}
        </h3>

        <span
          className={cn(
            'mt-1 w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            BADGE_STYLES[categoria]
          )}
        >
          {product.tipo}
        </span>
      </Link>
    </div>
  );
}
