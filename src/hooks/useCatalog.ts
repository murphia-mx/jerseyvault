import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../types/product';
import type { CatalogFilters } from '../types/catalog';
import { getProducts, filterProducts } from '../services/catalog.service';

const initialFilters: CatalogFilters = {
  liga: null,
  equipo: null,
  tipo: null,
  temporada: null,
  query: '',
};

const PAGE_SIZE = 24;

export function useCatalog() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [page, setPage] = useState(1);

  // Load raw data once
  useEffect(() => {
    let mounted = true;
    getProducts()
      .then(data => {
        if (mounted) {
          setAllProducts(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error loading catalog:', err);
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Compute the full filtered list (fast in-memory operation)
  const fullFilteredProducts = useMemo(() => {
    return filterProducts(allProducts, filters);
  }, [allProducts, filters]);

  // Derive the sliced list for rendering to avoid DOM bloat
  const products = useMemo(() => {
    return fullFilteredProducts.slice(0, page * PAGE_SIZE);
  }, [fullFilteredProducts, page]);

  const hasMore = products.length < fullFilteredProducts.length;

  const loadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const setFilter = useCallback(<K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset pagination on any filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setPage(1);
  }, []);

  return {
    allProducts, // Full catalog, for facet counts
    products, // Sliced array for DOM rendering
    isLoading,
    filters,
    setFilter,
    clearFilters,
    query: filters.query,
    setQuery,
    totalResults: fullFilteredProducts.length, // Total available for these filters
    loadMore,
    hasMore,
  };
}
