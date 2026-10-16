import { useState } from 'react';
import { ShoppingBag, Check, Expand } from 'lucide-react';
import type { Product } from '../../types/product';
import type { Talla } from '../../config/app.config';
import { APP_CONFIG } from '../../config/app.config';
import { useCart } from '../../hooks/useCart';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TallaSelector } from '../ui/TallaSelector';
import { WishlistButton } from '../wishlist/WishlistButton';
import { cn } from '../../utils/cn';

interface ProductInfoProps {
  product: Product;
  /** Callback to open the fullscreen image lightbox from outside the gallery */
  onOpenLightbox: () => void;
}

export function ProductInfo({ product, onOpenLightbox }: ProductInfoProps) {
  const [selectedTalla, setSelectedTalla] = useState<Talla | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [tallaError, setTallaError] = useState(false);
  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    if (!selectedTalla) {
      setTallaError(true);
      setTimeout(() => setTallaError(false), 800);
      return;
    }
    addItem({ product, talla: selectedTalla, quantity: 1 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-up-delay-1">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="liga">{product.liga}</Badge>
          <Badge variant="tipo">{product.tipo}</Badge>
          {product.temporada && <Badge variant="default">Temporada {product.temporada}</Badge>}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
            {product.equipo}
          </p>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.05] uppercase">
            {product.nombre}
          </h1>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-100 dark:border-white/10" />

      {/* Talla selector */}
      <div className={cn('transition-all duration-200', tallaError && 'animate-[shake_0.4s_ease]')}>
        <TallaSelector
          selectedTalla={selectedTalla}
          onChange={(t) => {
            setSelectedTalla(t);
            setTallaError(false);
          }}
        />
        {tallaError && (
          <p className="mt-2 text-sm text-red-500 font-medium">
            Selecciona una talla para continuar
          </p>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3">
        {/* Primary row: Add to cart + Wishlist */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className={cn(
              'flex-1 transition-all overflow-hidden relative h-14',
              justAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200 border-transparent text-sm font-bold uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(255,255,255,0.15)] hover:shadow-none hover:scale-[0.98]'
            )}
            onClick={justAdded ? openCart : handleAddToCart}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Agregado — Ver pedido
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 mr-2" />
                Agregar al pedido
              </>
            )}
          </Button>
          <WishlistButton productId={product.id} variant="full" className="w-14 h-14" />
        </div>

        {/* Secondary: Ampliar imagen */}
        <button
          type="button"
          onClick={onOpenLightbox}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-all"
        >
          <Expand className="w-4 h-4" />
          Ampliar imagen
        </button>
      </div>

      {/* Info note — WhatsApp flow */}
      <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] p-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border border-gray-100 dark:border-white/5">
        <p>
          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs block mb-1">
            Cotización por WhatsApp
          </span>
          Agrega los productos que deseas a tu pedido y al finalizar te generamos
          un mensaje automático con todo el detalle. Un asesor confirmará disponibilidad
          y precio instantáneamente.
        </p>
      </div>

      {/* Tallas reference */}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <p>Tallas disponibles: <span className="font-medium">{APP_CONFIG.tallas.join(' · ')}</span></p>
        <p className="mt-1">Las tallas son americanas estándar.</p>
      </div>
    </div>
  );
}
