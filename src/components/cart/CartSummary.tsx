import { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { DisclaimerModal } from '../ui/DisclaimerModal';

export function CartSummary() {
  const { totalItems, clearCart, items } = useCart();
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
      {/* Item count row */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span>{' '}
          {totalItems === 1 ? 'artículo' : 'artículos'} en tu pedido
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          aria-label="Vaciar carrito"
        >
          <Trash2 className="w-3 h-3" />
          Vaciar
        </button>
      </div>

      {/* Note */}
      <p className="px-6 pb-4 text-xs text-gray-400 leading-relaxed">
        Los precios se confirman directamente con el asesor por WhatsApp.
      </p>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Button
          size="lg"
          fullWidth
          onClick={() => setIsDisclaimerOpen(true)}
          className="gap-2 bg-[#25D366] hover:bg-[#20bd5a] focus:ring-[#25D366] text-white shadow-lg shadow-green-900/20"
        >
          <MessageCircle className="w-5 h-5" />
          Solicitar cotización por WhatsApp
        </Button>
      </div>

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
    </div>
  );
}
