import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronRight, ArrowRight } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { getLigas, getEquiposByLiga, countBy, filterProducts, sortTemporadas, SELECCIONES } from '../services/catalog.service';
import type { Liga } from '../types/product';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { ActiveFilters } from '../components/catalog/ActiveFilters';
import { EmptyState } from '../components/catalog/EmptyState';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SectionTitle } from '../components/ui/SectionTitle';
import { NewSectionTag } from '../components/ui/NewSectionTag';
import { cn } from '../utils/cn';
import { Helmet } from 'react-helmet-async';

/**
 * Mobile Filter Drawer — fully accessible overlay drawer with:
 * - Body scroll lock while open
 * - ESC key to close
 * - Backdrop tap to close
 * - Always-visible close button
 * - Swipe handle pill for native mobile feel
 * - Active filter count badge on trigger button
 */
function MobileFilterDrawer({
  isOpen,
  onClose,
  activeFilterCount,
  resultCount,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeFilterCount: number;
  resultCount: number;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Drawer panel — slides from bottom on mobile, from right on sm */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        className={cn(
          'lg:hidden fixed z-50 flex flex-col',
          // Mobile (< sm): bottom sheet
          'inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh]',
          // sm+: right drawer
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:rounded-none sm:rounded-l-3xl sm:w-80 sm:max-h-full',
          'bg-white dark:bg-[#0a0a0a]',
          'border-t border-gray-100 dark:border-white/10 sm:border-t-0 sm:border-l',
          'transition-transform duration-300 ease-out will-change-transform',
          isOpen
            ? 'translate-y-0 sm:translate-x-0 shadow-[0_-16px_40px_rgba(0,0,0,0.15)] sm:shadow-[-16px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.6)]'
            : 'translate-y-full sm:translate-y-0 sm:translate-x-full shadow-none'
        )}
      >
        {/* Swipe handle pill — mobile only visual affordance */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Filtros
            </h2>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Cerrar filtros"
          >
            Cerrar
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {/* Footer CTA — always visible */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            {resultCount === 0
              ? 'Sin resultados'
              : `Ver ${resultCount.toLocaleString('es-MX')} ${resultCount === 1 ? 'resultado' : 'resultados'}`}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

/** Discreet entry point to the national-teams section from the main catalog. */
function DiscoverSelecciones({ countries }: { countries: number }) {
  return (
    <Link
      to={`/catalogo/${SELECCIONES}`}
      className="group mt-5 inline-flex max-w-full items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3.5 text-[13px] transition-colors hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
    >
      <NewSectionTag variant="solid" />
      <span className="truncate font-medium text-gray-800 dark:text-gray-100">Selecciones nacionales</span>
      <span className="hidden text-gray-400 sm:inline dark:text-gray-500">{countries} países</span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-900 dark:group-hover:text-white" />
    </Link>
  );
}

export default function Catalog() {
  const { liga } = useParams<{ liga?: string }>();
  const navigate = useNavigate();
  const { allProducts, products, isLoading, filters, setFilter, clearFilters, setQuery, hasMore, loadMore, totalResults } = useCatalog();
  
  const [ligas, setLigas] = useState<Liga[]>([]);
  const [equipos, setEquipos] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isSelecciones = filters.liga === SELECCIONES;

  // National-teams section figures, from the real products
  const selecciones = useMemo(() => allProducts.filter(p => p.liga === SELECCIONES), [allProducts]);
  const seleccionesCountries = useMemo(() => new Set(selecciones.map(p => p.equipo)).size, [selecciones]);

  // Country and season options with counts, given the other active filters (never empty options)
  const paises = useMemo(
    () => (isSelecciones ? countBy(filterProducts(allProducts, { ...filters, equipo: null }), p => p.equipo) : []),
    [allProducts, filters, isSelecciones]
  );
  const paisesTotal = useMemo(() => paises.reduce((sum, p) => sum + p.count, 0), [paises]);
  const temporadas = useMemo(
    () => (isSelecciones
      ? sortTemporadas(filterProducts(allProducts, { ...filters, temporada: null }).flatMap(p => (p.temporada ? [p.temporada] : [])))
      : []),
    [allProducts, filters, isSelecciones]
  );

  // Count active filters for the badge
  const activeFilterCount = [filters.liga, filters.equipo, filters.tipo, filters.temporada, filters.query].filter(Boolean).length;

  // Changing the category resets the filters that only make sense inside it
  const selectLiga = useCallback((value: Liga | null) => {
    setFilter('liga', value);
    setFilter('equipo', null);
    setFilter('temporada', null);
  }, [setFilter]);

  // Initialize from query strings on mount
  useEffect(() => {
    const qTipo = searchParams.get('tipo');
    const qQuery = searchParams.get('query');
    if (qTipo) setFilter('tipo', qTipo as any);
    if (qQuery) setQuery(qQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar lista de ligas disponibles
  useEffect(() => {
    getLigas().then(setLigas);
  }, []);

  // Sincronizar ruta /catalogo/:liga con el estado de filtros (también al volver a /catalogo desde el menú)
  useEffect(() => {
    if (liga) {
      if (ligas.includes(liga as Liga) && filters.liga !== liga) selectLiga(liga as Liga);
    } else if (filters.liga) {
      selectLiga(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liga, ligas, selectLiga]);

  // Cargar equipos cuando cambia la liga
  useEffect(() => {
    let isMounted = true;
    if (filters.liga) {
      getEquiposByLiga(filters.liga).then(res => {
        if (isMounted) setEquipos(res);
      });
    } else {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setEquipos([]);
        if (filters.equipo) {
          setFilter('equipo', null);
        }
      });
    }
    return () => { isMounted = false; };
  }, [filters.liga, filters.equipo, setFilter]);

  // Actualizar URL al cambiar la liga para que sea compartible
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    if (key === 'liga') {
      navigate(value ? `/catalogo/${value}` : `/catalogo`, { replace: true });
      selectLiga(value);
      return;
    }
    setFilter(key, value);
  };

  const removeFilter = (key: keyof typeof filters) => {
    if (key === 'query') {
      setQuery('');
    } else {
      handleFilterChange(key, null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-12 animate-fade-in">
      <Helmet>
        <title>{isSelecciones ? 'Selecciones nacionales | Club Kit' : liga ? `${liga} | Catálogo | Club Kit` : 'Catálogo | Club Kit'}</title>
        <meta name="description" content={isSelecciones
          ? 'Camisetas de selecciones nacionales: México y más selecciones, ediciones actuales, versiones de jugador y clásicos retro.'
          : `Explora nuestra colección completa de jerseys oficiales${liga ? ` de la ${liga}` : ''}. Las mejores equipaciones en versión jugador y aficionado.`} />
        <meta property="og:title" content={isSelecciones ? 'Selecciones nacionales | Club Kit' : liga ? `${liga} | Catálogo | Club Kit` : 'Catálogo | Club Kit'} />
      </Helmet>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6 mb-8 md:mb-12">
        {isSelecciones ? (
          <div className="flex flex-col gap-3">
            <NewSectionTag variant="solid" className="w-fit" />
            <SectionTitle
              title="Selecciones"
              subtitle={`Camisetas de ${seleccionesCountries} selecciones nacionales: ediciones actuales, versiones de jugador y clásicos retro.`}
            />
          </div>
        ) : (
          <div className="min-w-0">
            <SectionTitle
              title="Catálogo"
              subtitle="Explora nuestra colección completa de camisetas oficiales."
            />
            {seleccionesCountries > 0 && <DiscoverSelecciones countries={seleccionesCountries} />}
          </div>
        )}
        <div className="w-full md:w-96 flex gap-2.5">
          <Input
            placeholder="Buscar equipos o selecciones..."
            icon={<Search className="w-5 h-5" />}
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* Mobile filter trigger with active filter badge */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className={cn(
              'lg:hidden relative flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border transition-all',
              activeFilterCount > 0
                ? 'bg-gray-900 dark:bg-white border-transparent text-white dark:text-gray-900'
                : 'bg-white dark:bg-transparent border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-white/20'
            )}
            aria-label={`Abrir filtros${activeFilterCount > 0 ? `, ${activeFilterCount} activos` : ''}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-900 dark:border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        activeFilterCount={activeFilterCount}
        resultCount={totalResults}
      >
        <FilterSidebar
          ligas={ligas}
          equipos={equipos}
          paises={paises}
          paisesTotal={paisesTotal}
          temporadas={temporadas}
          seleccionesTotal={selecciones.length}
          selectedLiga={filters.liga}
          selectedEquipo={filters.equipo}
          selectedTipo={filters.tipo}
          selectedTemporada={filters.temporada}
          onFilterChange={handleFilterChange}
        />
      </MobileFilterDrawer>

      <div className="flex flex-col lg:flex-row gap-10 xl:gap-14 relative items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-60 flex-shrink-0 -ml-3" aria-label="Filtros">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar pb-6">
            <FilterSidebar
              ligas={ligas}
              equipos={equipos}
              paises={paises}
              paisesTotal={paisesTotal}
              temporadas={temporadas}
              seleccionesTotal={selecciones.length}
              selectedLiga={filters.liga}
              selectedEquipo={filters.equipo}
              selectedTipo={filters.tipo}
              selectedTemporada={filters.temporada}
              onFilterChange={handleFilterChange}
            />
          </div>
        </aside>

        {/* Results */}
        <section className="flex-1 min-w-0" aria-label="Productos">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 min-h-8">
            <ActiveFilters
              filters={filters}
              onClear={clearFilters}
              onRemove={removeFilter}
            />
            {!isLoading && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 sm:ml-auto">
                <span className="text-gray-900 dark:text-white font-semibold">{totalResults.toLocaleString('es-MX')}</span>{' '}
                {totalResults === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3.5">
                  <div className="aspect-[4/5] bg-gray-100 dark:bg-white/[0.04] rounded-2xl w-full" />
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.04] rounded w-1/2" />
                  <div className="h-3.5 bg-gray-100 dark:bg-white/[0.04] rounded w-4/5" />
                  <div className="h-4 bg-gray-100 dark:bg-white/[0.04] rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <div className="flex flex-col gap-12">
              <ProductGrid products={products} />
              {hasMore && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Viendo {products.length} de {totalResults.toLocaleString('es-MX')}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={loadMore}
                    className="w-full max-w-xs text-sm font-semibold"
                  >
                    Cargar más productos
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
