import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command } from 'lucide-react';
import { getProducts, getLigas, normalizeText, ligaPath } from '../../services/catalog.service';
import type { Product } from '../../types/product';
import { ProductImage } from '../ui/ProductImage';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    products: Product[];
    ligas: string[];
    equipos: string[];
  }>({ products: [], ligas: [], equipos: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isOpen]);

  // Search logic (Client side, ultra fast)
  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], ligas: [], equipos: [] });
      return;
    }

    const search = async () => {
      const q = normalizeText(query);

      const allProducts = await getProducts();
      const allLigas = await getLigas();

      // Match Ligas
      const matchedLigas = allLigas.filter(l => normalizeText(l).includes(q));

      // Match Equipos (extract unique teams across catalog)
      const allEquipos = Array.from(new Set(allProducts.map(p => p.equipo)));
      const matchedEquipos = allEquipos.filter(e => normalizeText(e).includes(q)).slice(0, 5);

      // Match Products (limit to 5)
      const matchedProducts = allProducts.filter(p =>
        normalizeText(p.nombre).includes(q) ||
        normalizeText(p.equipo).includes(q)
      ).slice(0, 5);

      setResults({
        ligas: matchedLigas,
        equipos: matchedEquipos,
        products: matchedProducts
      });
    };

    const debounce = setTimeout(search, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 group"
        aria-label="Buscar (Cmd+K)"
      >
        <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2 py-1 rounded">
          <Command className="w-3 h-3" />K
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
          <div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden border border-transparent dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-white/10">
              <Search className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar equipos, ligas o camisetas..."
                className="flex-1 w-full bg-transparent border-none focus:ring-0 text-lg sm:text-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 px-4 py-2 outline-none"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain" aria-live="polite">
              {!query.trim() ? (
                <div className="px-8 py-20 text-center flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6">
                    <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explora el archivo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">Busca por equipo, liga o estilo de camiseta.</p>
                </div>
              ) : results.products.length === 0 && results.ligas.length === 0 && results.equipos.length === 0 ? (
                <div className="px-8 py-20 text-center flex flex-col items-center justify-center animate-fade-in">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Sin resultados para "{query}"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Intenta con términos más generales.</p>
                </div>
              ) : (
                <div className="p-2">
                  
                  {/* Ligas */}
                  {results.ligas.length > 0 && (
                    <div className="mb-4">
                      <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        Ligas
                      </div>
                      {results.ligas.map((liga, i) => (
                        <button
                          key={liga}
                          onClick={() => handleNavigate(ligaPath(liga))}
                          className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group animate-fade-up"
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{liga}</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver liga</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Equipos */}
                  {results.equipos.length > 0 && (
                    <div className="mb-4">
                      <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        Equipos
                      </div>
                      {results.equipos.map((equipo, i) => (
                        <button
                          key={equipo}
                          onClick={() => handleNavigate(`/catalogo?query=${encodeURIComponent(equipo)}`)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors group animate-fade-up"
                          style={{ animationDelay: `${(i + results.ligas.length) * 30}ms` }}
                        >
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{equipo}</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver equipo</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {results.products.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        Camisetas
                      </div>
                      {results.products.map((product, i) => (
                        <button
                          key={product.id}
                          onClick={() => handleNavigate(`/producto/${product.slug}`)}
                          className="w-full text-left p-2 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors animate-fade-up group"
                          style={{ animationDelay: `${(i + results.ligas.length + results.equipos.length) * 30}ms` }}
                        >
                          <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                            <ProductImage 
                              src={product.thumbnail || product.imagenes?.[0]} 
                              alt={product.nombre}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-0.5 tracking-widest uppercase truncate">
                              {product.equipo}
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {product.nombre}
                            </p>
                          </div>
                        </button>
                      ))}
                      
                      <button 
                        onClick={() => handleNavigate(`/catalogo?query=${encodeURIComponent(query)}`)}
                        className="w-full mt-2 py-3 text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                      >
                        Ver todos los resultados para "{query}"
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="hidden sm:flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-[#0a0a0a] text-[10px] text-gray-400 dark:text-gray-600 font-medium">
              <div className="flex gap-4">
              </div>
              <div className="flex items-center gap-1">
                <span>Cerrar</span>
                <kbd className="bg-white dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10">ESC</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
