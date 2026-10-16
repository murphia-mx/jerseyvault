/**
 * Product rules shared with the original Python scraper (../YupooScraper/scraper.py),
 * so imported products follow the same criteria as the existing catalog.
 */

/** scraper.py IGNORE: not an adult jersey (women, kids, jackets, training wear, goalkeeper…). */
const IGNORE = [
  "women", "woman", "kids", "kid", "baby", "short", "shorts", "polo", "windbreaker", "training",
  "track jacket", "tracksuit", "jacket", "hoodie", "t-shirt", "t shirt", "tee", "sock",
  "basketball", "crop top", "goalkeeper", "gk", "lifestyle",
];

/** scraper.py ALLOW: the title must look like a jersey. */
const ALLOW = ["jersey", "player version", "retro", "home", "away", "third", "fourth", "goalkeeper", "gk", "anniversary"];

export function isValidJersey(title: string): boolean {
  const text = title.toLowerCase();
  if (IGNORE.some((word) => text.includes(word))) return false;
  return ALLOW.some((word) => text.includes(word));
}

/** "Long Sleeve", "Long-Sleeves", "Long sleeved"… → Manga larga. */
export function sleeveType(title: string): "Manga corta" | "Manga larga" {
  return /long[\s-]*sleeve/i.test(title) ? "Manga larga" : "Manga corta";
}

/** scraper.py crear_slug. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** First season written in the title ("2026", "25/26", "2024/25", "19-20" → "19/20"), or undefined. */
export function parseSeason(title: string): string | undefined {
  const patterns = [
    /\b((?:19|20)\d{2})\s*\/\s*(\d{2})\b/g, // 2024/25
    /(?<![\d/])(\d{2})\s*[/-]\s*(\d{2})(?![\d/])/g, // 26/27, 80/82, 19-20
    /\b(19[3-9]\d|20[0-4]\d)\b/g, // 2026, 1994
  ];
  let best: { index: number; value: string } | undefined;
  for (const re of patterns) {
    for (const m of title.matchAll(re)) {
      const value = m[2] ? `${m[1]}/${m[2]}` : m[1];
      if (!best || m.index < best.index) best = { index: m.index, value };
    }
  }
  return best?.value;
}

/** Size range as written in the title ("S-XXL", "S-4XL"), or undefined. */
export function parseSizes(title: string): string | undefined {
  const m = /\b(XS|S|M|L|XL|XXL|XXXL|[2-5]XL)\s*[-–]\s*(XS|S|M|L|XL|XXL|XXXL|[2-5]XL)\b/i.exec(title);
  return m ? `${m[1].toUpperCase()}-${m[2].toUpperCase()}` : undefined;
}

/** Decodes the few HTML entities Yupoo uses in titles. */
export function decodeHtml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
