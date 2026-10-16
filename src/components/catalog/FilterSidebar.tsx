import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import type { Liga, TipoManga } from '../../types/product';
import { SELECCIONES, normalizeText, type Facet } from '../../services/catalog.service';
import { cn } from '../../utils/cn';
import { NewSectionTag } from '../ui/NewSectionTag';

interface FilterSidebarProps {
  ligas: Liga[];
  /** Club teams of the selected league. */
  equipos: string[];
  /** Countries with their product counts (national-teams section only). */
  paises: Facet[];
  /** Products matching the current filters in every country ("Todas las selecciones"). */
  paisesTotal: number;
  /** Seasons present in the current results (national-teams section only). */
  temporadas: string[];
  /** Products in the national-teams section. */
  seleccionesTotal: number;
  selectedLiga: Liga | null;
  selectedEquipo: string | null;
  selectedTipo: TipoManga | null;
  selectedTemporada: string | null;
  onFilterChange: <K extends 'liga' | 'equipo' | 'tipo' | 'temporada'>(key: K, value: any) => void;
}

const TIPOS_MANGA: TipoManga[] = ['Manga corta', 'Manga larga'];

function FilterGroup({ title, tag, children }: { title: string; tag?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
          {title}
        </h3>
        {tag}
      </div>
      {children}
    </div>
  );
}

function FilterOption({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
          active
            ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-white/[0.07] dark:text-white'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors',
            active ? 'bg-gray-900 dark:bg-white' : 'bg-transparent'
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {count !== undefined && (
          <span
            className={cn(
              'flex-shrink-0 text-xs tabular-nums',
              active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'
            )}
          >
            {count}
          </span>
        )}
      </button>
    </li>
  );
}

function TipoMangaFilter({ selected, onChange }: { selected: TipoManga | null; onChange: (t: TipoManga | null) => void }) {
  return (
    <FilterGroup title="Tipo de manga">
      <ul className="space-y-0.5">
        <FilterOption active={selected === null} onClick={() => onChange(null)}>
          Todos los tipos
        </FilterOption>
        {TIPOS_MANGA.map(tipo => (
          <FilterOption key={tipo} active={selected === tipo} onClick={() => onChange(tipo)}>
            {tipo}
          </FilterOption>
        ))}
      </ul>
    </FilterGroup>
  );
}

/** Country list of the national-teams section: alphabetical, with counts and a quick search. */
function CountryFilter({
  paises,
  total,
  selected,
  onSelect,
}: {
  paises: Facet[];
  total: number;
  selected: string | null;
  onSelect: (pais: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const q = normalizeText(query.trim());

  // Keep the selected country visible inside the scrollable list (desktop).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!list || !item || list.scrollHeight <= list.clientHeight) return;
    const top = item.offsetTop; // the list is the offsetParent (relative)
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 2 + item.offsetHeight / 2;
    }
  }, [selected]);
  // The selected country stays listed even if other filters leave it without results.
  const options = selected && !paises.some(p => p.value === selected)
    ? [...paises, { value: selected, count: 0 }].sort((a, b) => a.value.localeCompare(b.value, 'es'))
    : paises;
  const visible = q ? options.filter(p => normalizeText(p.value).includes(q)) : options;

  return (
    <FilterGroup title="País">
      <div className="relative mb-2 px-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar país"
          aria-label="Buscar país"
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-8 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-0 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-600 dark:focus:border-white/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Borrar búsqueda de país"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {/* Always in view, outside the scrollable list */}
      <ul className="mb-0.5 pr-1">
        <FilterOption active={selected === null} count={total} onClick={() => onSelect(null)}>
          Todas las selecciones
        </FilterOption>
      </ul>
      <ul ref={listRef} className="custom-scrollbar relative space-y-0.5 pr-1 lg:max-h-80 lg:overflow-y-auto">
        {visible.map(pais => (
          <FilterOption key={pais.value} active={selected === pais.value} count={pais.count} onClick={() => onSelect(pais.value)}>
            {pais.value}
          </FilterOption>
        ))}
        {q && visible.length === 0 && (
          <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Ningún país coincide con «{query.trim()}»</li>
        )}
      </ul>
    </FilterGroup>
  );
}

export function FilterSidebar({
  ligas,
  equipos,
  paises,
  paisesTotal,
  temporadas,
  seleccionesTotal,
  selectedLiga,
  selectedEquipo,
  selectedTipo,
  selectedTemporada,
  onFilterChange
}: FilterSidebarProps) {
  const clubLigas = ligas.filter(liga => liga !== SELECCIONES);

  // National-teams section: only its own filters (country, sleeve, season).
  if (selectedLiga === SELECCIONES) {
    return (
      <div className="flex flex-col gap-7">
        <div className="px-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Selecciones</p>
            <NewSectionTag />
          </div>
          <button
            type="button"
            onClick={() => onFilterChange('liga', null)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a todo el catálogo
          </button>
        </div>

        <CountryFilter
          paises={paises}
          total={paisesTotal}
          selected={selectedEquipo}
          onSelect={pais => onFilterChange('equipo', pais)}
        />

        <TipoMangaFilter selected={selectedTipo} onChange={tipo => onFilterChange('tipo', tipo)} />

        {temporadas.length > 1 && (
          <FilterGroup title="Temporada">
            <div className="px-1">
              <select
                value={selectedTemporada ?? ''}
                onChange={e => onFilterChange('temporada', e.target.value || null)}
                aria-label="Temporada"
                className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-700 transition-colors focus:border-gray-400 focus:outline-none dark:border-white/10 dark:bg-[#0a0a0a] dark:text-gray-200 dark:focus:border-white/30"
              >
                <option value="">Todas las temporadas</option>
                {temporadas.map(temporada => (
                  <option key={temporada} value={temporada}>{temporada}</option>
                ))}
              </select>
            </div>
          </FilterGroup>
        )}
      </div>
    );
  }

  // Full catalog and club leagues.
  return (
    <div className="flex flex-col gap-7">
      <ul className="space-y-0.5">
        <FilterOption active={selectedLiga === null} onClick={() => onFilterChange('liga', null)}>
          Todo el catálogo
        </FilterOption>
      </ul>

      {seleccionesTotal > 0 && (
        <FilterGroup title="Selecciones" tag={<NewSectionTag />}>
          <ul className="space-y-0.5">
            <FilterOption active={false} count={seleccionesTotal} onClick={() => onFilterChange('liga', SELECCIONES)}>
              Selecciones nacionales
            </FilterOption>
          </ul>
        </FilterGroup>
      )}

      <FilterGroup title="Clubes · Ligas">
        <ul className="space-y-0.5">
          {clubLigas.map(liga => (
            <FilterOption key={liga} active={selectedLiga === liga} onClick={() => onFilterChange('liga', liga)}>
              {liga}
            </FilterOption>
          ))}
        </ul>
      </FilterGroup>

      {/* Equipo (only if a club league is selected) */}
      {selectedLiga && equipos.length > 0 && (
        <FilterGroup title="Equipos">
          <ul className="custom-scrollbar max-h-72 space-y-0.5 overflow-y-auto pr-1">
            <FilterOption active={selectedEquipo === null} onClick={() => onFilterChange('equipo', null)}>
              Todos los equipos
            </FilterOption>
            {equipos.map(equipo => (
              <FilterOption key={equipo} active={selectedEquipo === equipo} onClick={() => onFilterChange('equipo', equipo)}>
                {equipo}
              </FilterOption>
            ))}
          </ul>
        </FilterGroup>
      )}

      <TipoMangaFilter selected={selectedTipo} onChange={tipo => onFilterChange('tipo', tipo)} />
    </div>
  );
}
