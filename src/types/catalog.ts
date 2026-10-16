import type { Liga, TipoManga } from './product';

export interface CatalogFilters {
  liga: Liga | null;
  equipo: string | null;
  tipo: TipoManga | null;
  temporada: string | null;
  query: string;
}
