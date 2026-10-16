import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectCountry } from "../countries.ts";
import { buildProduct, classify, isImportable, orderNationalTeams } from "../import-national-teams.ts";
import { parseCategoryPage } from "../listing.ts";
import { isValidJersey, parseSeason, parseSizes, sleeveType, slugify } from "../product-rules.ts";
import type { MasterCatalog } from "../catalog.ts";

const listingHtml = readFileSync(resolve(import.meta.dirname, "../fixtures/category-national-teams.html"), "utf8");

test("category listing: albums, titles, small covers and page count (real Yupoo markup)", () => {
  const page = parseCategoryPage(listingHtml);
  assert.equal(page.totalPages, 9);
  assert.equal(page.albums.length, 6);
  assert.deepEqual(page.albums[0], {
    albumId: "257639822",
    title: "South Africa 1994 Home Retro Jersey S-XXL",
    cover: "https://photo.yupoo.com/minkang/79b750c70e/small.jpg",
    href: "/albums/257639822?uid=1&isSubCate=false&referrercate=3118456",
  });
  assert.equal(page.albums[1].title, "Travis Scott Cactus Jack x NK Total France 90 Retro Jersey S-4XL");
});

test("national team detection uses the first country named and never guesses", () => {
  const cases: Array<[string, string | null]> = [
    ["Mexico 2004 Home Retro Jersey S-XXL", "México"],
    ["South Africa 1994 Home Retro Jersey S-XXL", "Sudáfrica"],
    ["Travis Scott Cactus Jack xNK Korea Total 90 Retro Jersey S-4XL", "Corea del Sur"],
    ["German 2026 Away Jersey S-XXL", "Alemania"],
    ["Columbia 2026 Home Jersey S-4XL", "Colombia"],
    ["Turkiye 2026 Heritage Jersey S-4XL", "Turquía"],
    ["Retro 13/14 Brazilian Black S-XXL", "Brasil"],
    ["19-20 Brazil home Made in Indonesia 1:1", "Brasil"],
    ["Northern Ireland 1986 Home Retro Jersey", "Irlanda del Norte"],
    ["Ireland 2002 Home Retro Jersey S-XXL", "Irlanda"],
    ["Equatorial Guinea 25/26 Home Jersey S-4XL", "Guinea Ecuatorial"],
    ["Jordan 2026 Home World Cup Jersey S-4XL", "Jordania"],
    ["Al Ahli 2026 Home S-4XL", null],
    ["Besiktas JK 91/92 Home Retro Jersey S-XXL", null],
    ["Curatu 2026 Away Jersey S-4XL", null],
  ];
  for (const [title, expected] of cases) assert.equal(detectCountry(title), expected, title);
});

test("same product rules as the original scraper", () => {
  assert.equal(isValidJersey("Mexico 2026 Home Jersey S-4XL"), true);
  assert.equal(isValidJersey("Spain 2026 Full-Zip Jacket - White S-XXL"), false);
  assert.equal(isValidJersey("Spain 2026 2 Stars Special Edition Womens Jersey - Maroon S-XXL"), false);
  assert.equal(isValidJersey("Brazil 2026 Goalkeeper Jersey S-4XL"), false);
  assert.equal(isValidJersey("Spain 26/27 Polo Blue Jersey S-4XL"), false);
  assert.equal(isValidJersey("Brazil 2026 Concept S-2XL"), false);
  assert.equal(sleeveType("Portugal 2014 Home Long-Sleeves Retro Jersey S-XXL"), "Manga larga");
  assert.equal(sleeveType("Mexico 2004 Home Retro Jersey S-XXL"), "Manga corta");
  assert.equal(slugify("Mexico 2004 Home Retro Jersey S-XXL"), "mexico-2004-home-retro-jersey-s-xxl");
  assert.equal(slugify("England 26/27 Special Edition"), "england-26-27-special-edition");
});

test("season and sizes are only taken from the title", () => {
  assert.equal(parseSeason("Mexico 2026 Home Jersey S-4XL"), "2026");
  assert.equal(parseSeason("England 26/27 Special Edition Jersey S-XXL"), "26/27");
  assert.equal(parseSeason("Mexico 2024/25 Away Jersey"), "2024/25");
  assert.equal(parseSeason("19-20 Brazil home Made in Indonesia 1:1"), "19/20");
  assert.equal(parseSeason("Travis Scott Cactus Jack x NK Total France 90 Retro Jersey S-4XL"), undefined);
  assert.equal(parseSeason("Argentina Commemorative Edition No. 10 Jersey S-4XL"), undefined);
  assert.equal(parseSizes("Germany 2026 Commemorative Edition S–4XL"), "S-4XL");
  assert.equal(parseSizes("Uruguay 2010 Home Retro Jersey"), undefined);
});

test("classify skips known albums, non-jerseys and unidentified teams", () => {
  const listed = [
    { albumId: "1", title: "Mexico 2026 Home Jersey S-4XL", cover: "c1", href: "/albums/1?uid=1" },
    { albumId: "2", title: "Hamburg 1996 Away Retro Jersey S-XXL", cover: "c2", href: "/albums/2?uid=1" },
    { albumId: "3", title: "Spain 2026 Full Zip Jacket - Red S-XXL", cover: "c3", href: "/albums/3?uid=1" },
    { albumId: "4", title: "Al Ahli 2026 Home S-4XL", cover: "c4", href: "/albums/4?uid=1" },
    { albumId: "5", title: "Argentina 2026 Away Jersey S-4XL", cover: "c5", href: "/albums/5?uid=1" },
  ];
  const plan = classify(listed, new Set(["2"]));
  assert.equal(plan.alreadyInCatalog, 1);
  assert.deepEqual(plan.notJersey, ["Spain 2026 Full Zip Jacket - Red S-XXL"]);
  assert.deepEqual(plan.noCountry, ["Al Ahli 2026 Home S-4XL"]);
  assert.deepEqual(plan.candidates.map((c) => c.country), ["México", "Argentina"], "México first, then alphabetical");
});

test("new products get the next id, a unique slug and leave existing products untouched", () => {
  const existing = {
    id: 2184, albumId: "9", slug: "mexico-2026-home-jersey-s-4xl", liga: "Liga MX", equipo: "X", tipo: "Manga corta",
    nombre: "x", thumbnail: "t", url: "https://minkang.x.yupoo.com/albums/9?uid=1", imagenes: ["t"],
  };
  const catalog: MasterCatalog = { generatedAt: "g", totalProducts: 1, products: [existing] };
  const snapshot = JSON.stringify(catalog);
  const slugs = new Set([existing.slug]);
  const product = buildProduct(
    {
      country: "México",
      listed: {
        albumId: "777", title: "Mexico 2026 Home Jersey S-4XL",
        cover: "https://photo.yupoo.com/minkang/aaa/small.jpg", href: "/albums/777?uid=1&isSubCate=false&referrercate=3118456",
      },
    },
    ["https://photo.yupoo.com/minkang/aaa/small.jpg", "https://photo.yupoo.com/minkang/bbb/small.jpg"],
    catalog,
    slugs,
  );
  assert.equal(JSON.stringify(catalog), snapshot, "buildProduct does not mutate the catalog");
  assert.deepEqual(product, {
    id: 2185,
    albumId: "777",
    slug: "mexico-2026-home-jersey-s-4xl-777",
    liga: "Selecciones",
    equipo: "México",
    tipo: "Manga corta",
    nombre: "Mexico 2026 Home Jersey S-4XL",
    thumbnail: "https://photo.yupoo.com/minkang/aaa/small.jpg",
    url: "https://minkang.x.yupoo.com/albums/777?uid=1&isSubCate=false&referrercate=3118456",
    imagenes: ["https://photo.yupoo.com/minkang/aaa/small.jpg", "https://photo.yupoo.com/minkang/bbb/small.jpg"],
    temporada: "2026",
    tallas: "S-4XL",
  });
});

test("national teams are ordered with México first, without moving club products", () => {
  const p = (id: number, liga: string, equipo: string, nombre: string) => ({
    id, albumId: String(id), slug: `s${id}`, liga, equipo, tipo: "Manga corta", nombre, thumbnail: "t", url: "u", imagenes: [],
  });
  const products = [
    p(1, "Bundesliga", "Augsburg", "A"),
    p(2, "Selecciones", "Alemania", "Germany 2026 Home"),
    p(3, "Selecciones", "México", "Mexico 2026 Away"),
    p(4, "Selecciones", "Argentina", "Argentina 2026 Home"),
    p(5, "Selecciones", "México", "Mexico 2026 Home"),
  ];
  const ordered = orderNationalTeams(products);
  assert.deepEqual(ordered.map((x) => x.id), [1, 3, 5, 2, 4]);
  assert.deepEqual(orderNationalTeams(ordered).map((x) => x.id), [1, 3, 5, 2, 4], "idempotent");
  assert.deepEqual(products.map((x) => x.id), [1, 2, 3, 4, 5], "input untouched");
});

test("only albums that exist with a valid photo are imported", () => {
  assert.equal(isImportable({ kind: "exists", albumImages: [], image: "valid" }), true);
  assert.equal(isImportable({ kind: "exists", albumImages: ["a"], image: "broken", brokenDetail: "x", replacement: "a" }), true);
  assert.equal(isImportable({ kind: "exists", albumImages: [], image: "broken", brokenDetail: "x", replacement: null }), false);
  assert.equal(isImportable({ kind: "deleted" }), false);
  assert.equal(isImportable({ kind: "transient", detail: "http_567" }), false);
});
