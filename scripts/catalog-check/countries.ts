/**
 * National teams: the names Yupoo uses in album titles (English, plus the
 * misspellings seen on the supplier) → the name shown in the store.
 * A title with no known country is not imported (we never guess a team).
 */
const COUNTRIES: ReadonlyArray<readonly [string, string]> = [
  ["Mexico", "México"], ["Argentina", "Argentina"], ["Brazil", "Brasil"], ["Brazilian", "Brasil"], ["Brasil", "Brasil"],
  ["United States", "Estados Unidos"], ["USA", "Estados Unidos"], ["USMNT", "Estados Unidos"], ["Canada", "Canadá"],
  ["Colombia", "Colombia"], ["Columbia", "Colombia"], ["Uruguay", "Uruguay"], ["Chile", "Chile"], ["Peru", "Perú"],
  ["Ecuador", "Ecuador"], ["Paraguay", "Paraguay"], ["Venezuela", "Venezuela"], ["Bolivia", "Bolivia"],
  ["Costa Rica", "Costa Rica"], ["Honduras", "Honduras"], ["Panama", "Panamá"], ["Jamaica", "Jamaica"],
  ["El Salvador", "El Salvador"], ["Guatemala", "Guatemala"], ["Haiti", "Haití"], ["Curacao", "Curazao"], ["Curaçao", "Curazao"],
  ["Trinidad and Tobago", "Trinidad y Tobago"], ["Trinidad & Tobago", "Trinidad y Tobago"],
  ["Spain", "España"], ["France", "Francia"], ["Frence", "Francia"],
  ["West Germany", "Alemania Occidental"], ["East Germany", "Alemania Oriental"], ["Germany", "Alemania"], ["German", "Alemania"],
  ["England", "Inglaterra"], ["Italy", "Italia"], ["Portugal", "Portugal"], ["Netherlands", "Países Bajos"], ["Holland", "Países Bajos"],
  ["Belgium", "Bélgica"], ["Croatia", "Croacia"], ["Serbia", "Serbia"], ["Switzerland", "Suiza"], ["Denmark", "Dinamarca"],
  ["Sweden", "Suecia"], ["Norway", "Noruega"], ["Poland", "Polonia"], ["Austria", "Austria"], ["Scotland", "Escocia"],
  ["Wales", "Gales"], ["Northern Ireland", "Irlanda del Norte"], ["Ireland", "Irlanda"], ["Ukraine", "Ucrania"],
  ["Czech Republic", "República Checa"], ["Czechia", "República Checa"], ["Czechoslovakia", "Checoslovaquia"],
  ["Hungary", "Hungría"], ["Turkey", "Turquía"], ["Türkiye", "Turquía"], ["Turkiye", "Turquía"], ["Greece", "Grecia"],
  ["Russia", "Rusia"], ["Soviet Union", "Unión Soviética"], ["USSR", "Unión Soviética"], ["CCCP", "Unión Soviética"],
  ["Yugoslavia", "Yugoslavia"], ["Romania", "Rumania"], ["Bulgaria", "Bulgaria"], ["Slovakia", "Eslovaquia"],
  ["Slovenia", "Eslovenia"], ["Iceland", "Islandia"], ["Finland", "Finlandia"], ["Bosnia", "Bosnia y Herzegovina"],
  ["Albania", "Albania"], ["Georgia", "Georgia"], ["North Macedonia", "Macedonia del Norte"], ["Montenegro", "Montenegro"],
  ["Israel", "Israel"], ["Japan", "Japón"], ["South Korea", "Corea del Sur"], ["North Korea", "Corea del Norte"],
  ["Korea", "Corea del Sur"], ["China", "China"], ["Saudi Arabia", "Arabia Saudita"], ["Qatar", "Catar"], ["Iran", "Irán"],
  ["Iraq", "Irak"], ["Jordan", "Jordania"], ["Uzbekistan", "Uzbekistán"], ["United Arab Emirates", "Emiratos Árabes Unidos"],
  ["UAE", "Emiratos Árabes Unidos"], ["Palestine", "Palestina"], ["India", "India"], ["Thailand", "Tailandia"],
  ["Vietnam", "Vietnam"], ["Indonesia", "Indonesia"], ["Australia", "Australia"], ["New Zealand", "Nueva Zelanda"],
  ["Morocco", "Marruecos"], ["Senegal", "Senegal"], ["Nigeria", "Nigeria"], ["Cameroon", "Camerún"], ["Ghana", "Ghana"],
  ["Egypt", "Egipto"], ["Algeria", "Argelia"], ["Tunisia", "Túnez"], ["Ivory Coast", "Costa de Marfil"],
  ["Cote d'Ivoire", "Costa de Marfil"], ["South Africa", "Sudáfrica"], ["Mali", "Malí"], ["Cape Verde", "Cabo Verde"],
  ["DR Congo", "RD del Congo"], ["Congo", "Congo"], ["Equatorial Guinea", "Guinea Ecuatorial"], ["Guinea", "Guinea"],
  ["Burkina Faso", "Burkina Faso"], ["Zambia", "Zambia"], ["Angola", "Angola"], ["Kenya", "Kenia"], ["Gabon", "Gabón"],
  ["Benin", "Benín"],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Longest names first, so "South Korea" wins over "Korea" and "West Germany" over "Germany". */
const MATCHERS = [...COUNTRIES]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([name, store]) => ({ re: new RegExp(`(^|[^\\p{L}])${escape(name)}(?![\\p{L}])`, "iu"), length: name.length, store }));

/**
 * The national team named first in the title ("19-20 Brazil home Made in
 * Indonesia" → Brasil), or null when the title names no known country.
 */
export function detectCountry(title: string): string | null {
  let best: { index: number; length: number; store: string } | null = null;
  for (const { re, length, store } of MATCHERS) {
    const m = re.exec(title);
    if (!m) continue;
    const index = m.index + m[1].length;
    if (!best || index < best.index || (index === best.index && length > best.length)) best = { index, length, store };
  }
  return best?.store ?? null;
}
