import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface WishlistContextType {
  ids: number[];
  toggleWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'Club Kit-wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(() => {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse wishlist from local storage', e);
      }
    }
    return [];
  });


  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const toggleWishlist = (productId: number) => {
    setIds(currentIds => {
      if (currentIds.includes(productId)) {
        return currentIds.filter(id => id !== productId);
      }
      return [...currentIds, productId];
    });
  };

  const isWishlisted = (productId: number) => {
    return ids.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        ids,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
}
