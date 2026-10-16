import { X } from 'lucide-react';
import type { CatalogFilters } from '../../types/catalog';

interface ActiveFiltersProps {
  filters: CatalogFilters;
  onClear: () => void;
  onRemove: (key: keyof CatalogFilters) => void;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-white/20 dark:hover:text-white"
      aria-label={`Quitar filtro ${label}`}
    >
      {label}
      <X className="h-3 w-3 opacity-60" />
    </button>
  );
}

export function ActiveFilters({ filters, onClear, onRemove }: ActiveFiltersProps) {
  const hasActiveFilters = filters.liga || filters.equipo || filters.tipo || filters.temporada || filters.query;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.query && <FilterChip label={`“${filters.query}”`} onRemove={() => onRemove('query')} />}
      {filters.liga && <FilterChip label={filters.liga} onRemove={() => onRemove('liga')} />}
      {filters.equipo && <FilterChip label={filters.equipo} onRemove={() => onRemove('equipo')} />}
      {filters.tipo && <FilterChip label={filters.tipo} onRemove={() => onRemove('tipo')} />}
      {filters.temporada && <FilterChip label={`Temporada ${filters.temporada}`} onRemove={() => onRemove('temporada')} />}

      <button
        type="button"
        onClick={onClear}
        className="ml-1 text-xs font-medium text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        Limpiar todo
      </button>
    </div>
  );
}
