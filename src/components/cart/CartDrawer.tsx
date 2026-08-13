import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { CartItem } from './CartItem';
import { CartEmpty } from './CartEmpty';
import { CartSummary } from './CartSummary';
import { cn } from '../../utils/cn';
import { Helmet } from 'react-helmet-async';

/**
 * Cart drawer with smooth CSS slide-in/out animation.
 * Stays mounted to avoid layout jumps; animation is driven by `isOpen` state.
 */
export default function CartDrawer() {
  const { isOpen, closeCart, items } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Trap focus: close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  return (
    <>
      {isOpen && (
        <Helmet>
          <title>Carrito | Club Kit</title>
        </Helmet>
      )}

      {/* Backdrop — always in DOM, fade in/out */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Drawer panel — slides from right */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-white dark:bg-[#0a0a0a] shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_rgba(0,0,0,0.5)] border-l border-transparent dark:border-white/5',
          'transition-transform duration-300 ease-in-out will-change-transform',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Mi pedido</h2>
            {items.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold">
                {items.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar pedido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className={cn(
            'flex-1 overflow-y-auto',
            items.length === 0 ? 'flex flex-col' : 'px-4 sm:px-6'
          )}
        >
          {items.length === 0 ? (
            <CartEmpty onClose={closeCart} />
          ) : (
            items.map(item => (
              <CartItem
                key={`${item.product.id}-${item.talla}`}
                item={item}
              />
            ))
          )}
        </div>

        {/* Footer summary (sticky to bottom) */}
        <CartSummary />
      </div>
    </>
  );
}
