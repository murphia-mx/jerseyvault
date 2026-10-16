import type { Product, Liga } from '../types/product';
import type { CatalogFilters } from '../types/catalog';

/** The national-teams section (a top-level category next to the club leagues). */
export const SELECCIONES: Liga = 'Selecciones';

/** Where a league links to: club leagues have a collection page, national teams use the filtered catalog. */
export function ligaPath(liga: string): string {
  return liga === SELECCIONES
    ? `/catalogo/${SELECCIONES}`
    : `/coleccion/${liga.toLowerCase().replace(/\s+/g, '-')}`;
}

// Cache to store the dynamically loaded JSON and prevent multiple network requests
let catalogCache: Product[] | null = null;

export async function getProducts(): Promise<Product[]> {
  if (catalogCache) return catalogCache;
  const { default: data } = await import('../data/catalog.json');
  catalogCache = data.products as Product[];
  return catalogCache;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.slug === slug);
}

export async function getProductsByLiga(liga: Liga): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(p => p.liga === liga);
}

export async function getLigas(): Promise<Liga[]> {
  const products = await getProducts();
  const ligas = new Set(products.map(p => p.liga));
  return Array.from(ligas);
}

export async function getEquiposByLiga(liga: Liga): Promise<string[]> {
  const products = await getProducts();
  const equipos = new Set(
    products.filter(p => p.liga === liga).map(p => p.equipo)
  );
  return Array.from(equipos).sort((a, b) => a.localeCompare(b, 'es'));
}

/** Start year of a season label ("26/27" → 2026, "98/99" → 1998, "2024/25" → 2024). */
function seasonYear(temporada: string): number {
  const first = Number(temporada.split('/')[0]);
  if (first >= 100) return first;
  return first + (first > 40 ? 1900 : 2000);
}

/** Most recent first: "2026", "26/27", "2024/25", …, "1970". */
export function sortTemporadas(temporadas: Iterable<string>): string[] {
  return Array.from(new Set(temporadas)).sort((a, b) => seasonYear(b) - seasonYear(a) || b.localeCompare(a));
}

export interface Facet {
  value: string;
  count: number;
}

/** How many products share each value (e.g. per country), alphabetically. Values never seen are not listed. */
export function countBy(products: Product[], key: (p: Product) => string | undefined): Facet[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const value = key(p);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value, 'es'));
}

/** Lowercase without accents, so "japon" finds "Japón" and "mexico" finds "México". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Normalized searchable text per product, computed once. */
const searchText = new WeakMap<Product, string>();
function haystack(p: Product): string {
  let text = searchText.get(p);
  if (text === undefined) {
    text = normalizeText([p.nombre, p.equipo, p.liga, p.tipo].join('\n'));
    searchText.set(p, text);
  }
  return text;
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const q = filters.query ? normalizeText(filters.query.trim()) : '';
  return products.filter(p => {
    if (filters.liga && p.liga !== filters.liga) return false;
    if (filters.equipo && p.equipo !== filters.equipo) return false;
    if (filters.tipo && p.tipo !== filters.tipo) return false;
    if (filters.temporada && p.temporada !== filters.temporada) return false;
    if (q) return haystack(p).includes(q);
    return true;
  });
}
