import { APP_CONFIG } from '../config/app.config';
import type { CartItem } from '../types/cart';

/** Base URL for Club Kit product links in WhatsApp messages. */
const STORE_BASE_URL = 'https://Club Kit.netlify.app';

/**
 * Builds the WhatsApp quote request message.
 *
 * Each line includes: product name, team, league, size, quantity,
 * and a link to the Club Kit product page.
 *
 * NOTE: product.url (Yupoo) is intentionally NOT included — the customer
 * should never see or interact with the supplier's platform directly.
 */
const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function buildOrderMessage(items: CartItem[]): string {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const lines = items.map((item, index) => {
    const { product, talla, quantity } = item;
    const productUrl = `${STORE_BASE_URL}/producto/${product.slug}`;
    const num = index < 10 ? NUMBER_EMOJIS[index] : `${index + 1}.`;
    
    return `${num} ${product.nombre}

🏟️ Equipo: ${product.equipo}
🏆 Liga: ${product.liga}
📏 Talla: ${talla}
📦 Cantidad: ${quantity}

🔗 Producto:
${productUrl}`;
  });

  return `¡Hola! 👋

Me gustaría solicitar una cotización para el siguiente pedido de Club Kit.

🛒 Pedido

• Total de artículos: ${totalItems}

${lines.join('\n\n')}

¿Podrían confirmarme disponibilidad y precio?

¡Muchas gracias!`;
}

export function requestQuote(items: CartItem[]): void {
  const message = buildOrderMessage(items);
  const url = `https://wa.me/${APP_CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
