# Catalog availability check

Keeps products that Yupoo no longer has out of the store, without deleting anything.

| File | Role |
|---|---|
| `data/catalog.master.json` | Every product, with its stable Yupoo `albumId`. Never trimmed by the checker. |
| `data/availability.json` | Per-album status, image repairs, history and errors. |
| Public catalog (`package.json` → `catalogCheck.publicCatalog`) | Generated: master minus hidden albums, with repairs applied. Do not edit by hand. |
| `reports/catalog-status.md` | Current counts and every affected product. `runs.jsonl` logs every run. |

## Rules

- **Deleted album** (404 + "该相册已不存在" / "this album is not exist") or **no valid photo left**
  (every photo returns Yupoo's "图片暂时无法展示" placeholder, detected by its bytes even with HTTP 200):
  the product leaves the store at once, and a second check ≥24h later confirms it.
- **Broken thumbnail, other valid photos**: the thumbnail is replaced and the product stays.
- **Timeouts, 429, 5xx, Yupoo's 567, unknown pages**: retried, logged, and **never** hide anything.
- Hidden products are re-checked (24h, then weekly) and come back by themselves if the album is healthy.
- Safety guard — no product is taken out and the GitHub run fails (you get an email) when:
  more than 3% of the visible albums (min. 40) would go in one run, more than 25% of the checked
  albums newly look broken, more than 30% of requests fail, or the public catalog would drop >10% at once.

## National teams (Selecciones)

`import-national-teams.ts` adds the supplier's national-team jerseys (categories ⚽🌍 National Teams,
2026 FIFA World Cup and Brazil team column) to the master catalog as liga `Selecciones`:

- same jersey rules as the original scraper (no jackets, polos, training wear, kids, women, goalkeeper);
- the country comes from the album title (`countries.ts`); titles naming no known country are skipped,
  never guessed; season (`temporada`) and size range (`tallas`) only when the title states them;
- each album is checked like the monitor does (album exists, valid photo) before it is added;
- existing products are never modified, new ones get the next ids, duplicates are skipped by album id,
  and the run can be repeated safely. Report: `reports/import-selecciones.md`.

## Commands

```bash
npm run test:catalog                                   # tests + type-check
npm run catalog:check -- --batch 50                    # check 50 albums (--dry-run saves nothing)
npm run catalog:check -- --status suspect_no_images    # re-check albums with a given status
npm run catalog:check -- --batch 0                     # no requests: apply pending changes only
npm run catalog:build                                  # regenerate the public catalog
npm run catalog:import-selecciones                     # import new national-team jerseys (--dry-run to preview)
```

Scheduled: `.github/workflows/catalog-check.yml` (05:17 and 17:17 UTC, 250 albums each).
To approve a run suspended by the guard: Actions → Catalog check → Run workflow → `allow_mass_changes`.

## Rollback

- Undo one automated run: `git revert <commit>` and push.
- Restore point before this system was deployed: tag `pre-deploy-2026-10-16`
  (original catalog: `git show pre-deploy-2026-10-16:src/data/catalog.json`).
- Show every product again: `git checkout pre-deploy-2026-10-16 -- src/data/catalog.json`, or set
  `hidden: false` in `data/availability.json` and run `npm run catalog:build`.
- Pause automation: Actions → Catalog check → ⋯ → Disable workflow.
- After a new scrape: `node scripts/catalog-check/init-master.ts <file>` (refuses to overwrite an
  existing master; move it away first). States are keyed by album id, so they carry over.
