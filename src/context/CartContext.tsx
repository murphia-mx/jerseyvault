import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, CartState } from '../types/cart';
import type { Talla } from '../config/app.config';
import { getProducts } from '../services/catalog.service';

interface CartContextType extends CartState {
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, talla: Talla) => void;
  updateQuantity: (productId: number, talla: Talla, quantity: number) => void;
  changeTalla: (productId: number, oldTalla: Talla, newTalla: Talla) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'Club Kit-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [hadSavedItems] = useState(() => items.length > 0);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // A saved cart may hold products that have since left the catalog (no longer
  // available at the supplier): drop them, and refresh the rest (e.g. a repaired photo).
  useEffect(() => {
    if (!hadSavedItems) return;
    let active = true;
    getProducts()
      .then(products => {
        if (!active) return;
        const byId = new Map(products.map(p => [p.id, p]));
        setItems(current =>
          current
            .filter(item => byId.has(item.product.id))
            .map(item => ({ ...item, product: byId.get(item.product.id)! }))
        );
      })
      .catch(err => console.error('Failed to sync cart with catalog', err));
    return () => {
      active = false;
    };
  }, [hadSavedItems]);

  const addItem = (newItem: CartItem) => {
    setItems(current => {
      const existingIndex = current.findIndex(
        item => item.product.id === newItem.product.id && item.talla === newItem.talla
      );
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...current, newItem];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: number, talla: Talla) => {
    setItems(current =>
      current.filter(item => !(item.product.id === productId && item.talla === talla))
    );
  };

  const updateQuantity = (productId: number, talla: Talla, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, talla);
      return;
    }
    setItems(current =>
      current.map(item =>
        item.product.id === productId && item.talla === talla
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Change the talla of an existing cart item.
   * If the new talla already exists for this product, merge quantities.
   */
  const changeTalla = (productId: number, oldTalla: Talla, newTalla: Talla) => {
    if (oldTalla === newTalla) return;
    setItems(current => {
      const source = current.find(i => i.product.id === productId && i.talla === oldTalla);
      if (!source) return current;

      const withoutOld = current.filter(i => !(i.product.id === productId && i.talla === oldTalla));
      const existingNew = withoutOld.findIndex(i => i.product.id === productId && i.talla === newTalla);

      if (existingNew >= 0) {
        const merged = [...withoutOld];
        merged[existingNew] = {
          ...merged[existingNew],
          quantity: merged[existingNew].quantity + source.quantity,
        };
        return merged;
      }
      return [...withoutOld, { ...source, talla: newTalla }];
    });
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{ items, isOpen, addItem, removeItem, updateQuantity, changeTalla, clearCart, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
