/** Human (Markdown) and machine (JSON) status reports in reports/. */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPORT_DIR, type MasterCatalog } from "./catalog.ts";
import type { AlbumStatus, AvailabilityFile } from "./state.ts";

export interface RunSummary {
  startedAt: string;
  finishedAt: string;
  outcome: "ok" | "degraded" | "suspended" | "time_budget";
  selected: number;
  checked: number;
  requests: number;
  observations: Record<string, number>;
  newProblems: number;
  confirmed: number;
  repaired: number;
  restored: number;
  hidden: number;
  suspendedHides: number;
  note?: string;
}

const LABELS: Record<AlbumStatus, string> = {
  ok: "Sano",
  repaired: "Miniatura reparada con otra foto del álbum",
  suspect_deleted: "Álbum eliminado en Yupoo (pendiente de confirmar a las 24 h)",
  suspect_no_images: "Álbum sin ninguna foto válida (pendiente de confirmar a las 24 h)",
  unavailable: "No disponible (confirmado en 2 revisiones)",
  error: "Error temporal (se reintentará; sigue visible)",
  unchecked: "Sin revisar",
};

export function writeReports(master: MasterCatalog, availability: AvailabilityFile, run: RunSummary): void {
  mkdirSync(REPORT_DIR, { recursive: true });

  const zero = () => Object.fromEntries(Object.keys(LABELS).map((k) => [k, 0])) as Record<AlbumStatus, number>;
  const byStatus = zero();
  const visibleByStatus = zero();
  const affected: Array<{
    id: number;
    albumId: string;
    nombre: string;
    status: AlbumStatus;
    visible: boolean;
    since?: string;
    detail?: string;
  }> = [];
  for (const p of master.products) {
    const s = availability.albums[p.albumId];
    const status: AlbumStatus = s?.status ?? "unchecked";
    const visible = !s?.hidden;
    byStatus[status]++;
    if (visible) visibleByStatus[status]++;
    if (status !== "ok" && status !== "unchecked") {
      affected.push({
        id: p.id,
        albumId: p.albumId,
        nombre: p.nombre,
        status,
        visible,
        since: s?.pendingSince ?? s?.repair?.at ?? s?.lastError?.at,
        detail: s?.pendingKind ?? s?.repair?.reason ?? s?.lastError?.detail,
      });
    }
  }
  const visible = master.products.filter((p) => !availability.albums[p.albumId]?.hidden).length;
  const status = {
    generatedAt: run.finishedAt,
    totalProducts: master.products.length,
    visibleProducts: visible,
    byStatus,
    visibleByStatus,
    lastRun: run,
    affected,
  };
  writeFileSync(resolve(REPORT_DIR, "catalog-status.json"), JSON.stringify(status, null, 2) + "\n", "utf8");

  const lines = [
    "# Estado del catálogo",
    "",
    `Actualizado: ${run.finishedAt} · Productos: ${master.products.length} · ` +
      `En tienda: ${visible} · Retirados: ${master.products.length - visible}`,
    "",
    "| Estado | Productos | En tienda |",
    "|---|---:|---:|",
    ...(Object.keys(LABELS) as AlbumStatus[]).map((k) => `| ${LABELS[k]} | ${byStatus[k]} | ${visibleByStatus[k]} |`),
    "",
    "## Última ejecución",
    "",
    `Resultado: **${run.outcome}** · Revisados: ${run.checked}/${run.selected} · Peticiones: ${run.requests} · ` +
      `Problemas nuevos: ${run.newProblems} · Confirmados: ${run.confirmed} · Reparados: ${run.repaired} · ` +
      `Restaurados: ${run.restored} · Retirados: ${run.hidden} · Retiradas suspendidas: ${run.suspendedHides}`,
    run.note ? `\n> ${run.note}` : "",
    "",
    "## Productos afectados",
    "",
    "| ID | Álbum | Producto | Estado | En tienda | Desde | Detalle |",
    "|---:|---|---|---|---|---|---|",
    ...affected
      .sort((a, b) => a.status.localeCompare(b.status) || a.id - b.id)
      .map(
        (a) =>
          `| ${a.id} | ${a.albumId} | ${a.nombre.replace(/\|/g, "/")} | ${LABELS[a.status]} | ` +
          `${a.visible ? "Sí" : "No"} | ${a.since ?? ""} | ${a.detail ?? ""} |`,
      ),
    "",
  ];
  writeFileSync(resolve(REPORT_DIR, "catalog-status.md"), lines.join("\n"), "utf8");
  appendFileSync(resolve(REPORT_DIR, "runs.jsonl"), JSON.stringify(run) + "\n", "utf8");
}
