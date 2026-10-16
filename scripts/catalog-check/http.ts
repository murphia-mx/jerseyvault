/**
 * Polite HTTP client for Yupoo: one request at a time, a minimum spacing
 * between requests, timeouts, and retries with exponential backoff on
 * responses that mean "not now" (429, 5xx, Yupoo's 567) or network errors.
 */

export interface HttpResult {
  status: number;
  contentType: string;
  body: Uint8Array;
  /** Body was larger than maxBodyBytes and was not downloaded (`body` is empty). */
  oversized?: boolean;
}

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export interface HttpClientOptions {
  minIntervalMs: number;
  jitterMs: number;
  timeoutMs: number;
  retries: number;
  backoffMs: number;
  maxBodyBytes: number;
  fetchFn?: FetchFn;
  sleep?: (ms: number) => Promise<void>;
}

export const DEFAULT_HTTP_OPTIONS: HttpClientOptions = {
  minIntervalMs: 1200,
  jitterMs: 400,
  timeoutMs: 20_000,
  retries: 3,
  backoffMs: 5_000,
  maxBodyBytes: 8 * 1024 * 1024,
};

export const USER_AGENT = "JerseyVaultCatalogCheck/1.0 (+https://github.com/xRaken10/jerseyvault)";

/** Thrown when a request still fails after every retry. Never means "deleted". */
export class TransientError extends Error {}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 567 || status >= 500;
}

export class HttpClient {
  private readonly opts: HttpClientOptions;
  private readonly fetchFn: FetchFn;
  private readonly sleep: (ms: number) => Promise<void>;
  private nextSlot = 0;
  requestCount = 0;

  constructor(opts: Partial<HttpClientOptions> = {}) {
    this.opts = { ...DEFAULT_HTTP_OPTIONS, ...opts };
    this.fetchFn = this.opts.fetchFn ?? ((url, init) => fetch(url, init));
    this.sleep = this.opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  /** GET with retries. Non-retryable statuses (200, 404, …) are returned, not thrown. */
  async get(url: string, headers: Record<string, string> = {}): Promise<HttpResult> {
    let lastProblem = "";
    for (let attempt = 0; attempt <= this.opts.retries; attempt++) {
      if (attempt > 0) await this.sleep(this.opts.backoffMs * 3 ** (attempt - 1));
      await this.waitForSlot();
      try {
        const result = await this.once(url, headers);
        if (!isRetryableStatus(result.status)) return result;
        lastProblem = `http_${result.status}`;
        const retryAfter = Number(result.retryAfter);
        if (retryAfter > 0) await this.sleep(Math.min(retryAfter, 120) * 1000);
      } catch (error) {
        lastProblem = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }
    }
    throw new TransientError(lastProblem);
  }

  private async waitForSlot(): Promise<void> {
    const now = Date.now();
    const wait = this.nextSlot - now;
    if (wait > 0) await this.sleep(wait);
    this.nextSlot = Math.max(now, this.nextSlot) + this.opts.minIntervalMs + Math.random() * this.opts.jitterMs;
  }

  private async once(url: string, headers: Record<string, string>): Promise<HttpResult & { retryAfter: string | null }> {
    this.requestCount++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    try {
      const res = await this.fetchFn(url, {
        headers: { "User-Agent": USER_AGENT, ...headers },
        redirect: "follow",
        signal: controller.signal,
      });
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > this.opts.maxBodyBytes) {
        await res.body?.cancel();
        return {
          status: res.status,
          contentType: res.headers.get("content-type") ?? "",
          body: new Uint8Array(),
          oversized: true,
          retryAfter: null,
        };
      }
      const body = new Uint8Array(await res.arrayBuffer());
      return {
        status: res.status,
        contentType: res.headers.get("content-type") ?? "",
        body,
        retryAfter: res.headers.get("retry-after"),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
