export type Liga =
  | 'Premier League'
  | 'La Liga'
  | 'Serie A'
  | 'Bundesliga'
  | 'Ligue 1'
  | 'Liga MX'
  | 'Selecciones';

export type TipoManga = 'Manga corta' | 'Manga larga';

export interface Product {
  id: number;
  /** Stable Yupoo album id, used to sync availability (data/availability.json). */
  albumId?: string;
  slug: string;
  liga: Liga;
  equipo: string;
  tipo: TipoManga;
  nombre: string;
  thumbnail: string;
  url: string;
  imagenes: string[];
  /** Season and size range as written by the supplier (national teams only). */
  temporada?: string;
  tallas?: string;
}
