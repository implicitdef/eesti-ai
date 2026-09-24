import type { VocabPair } from "./types";

const API_BASE = "https://api.baserow.io";
// Baserow caps both page size and batch size at 200.
const PAGE_SIZE = 200;
const BATCH_SIZE = 200;

export interface BaserowCredentials {
  token: string;
  tableId: string;
}

export interface BaserowVocabRow {
  id: number;
  estonian: string;
  english: string;
}

interface RawRow {
  id: number;
  Estonian?: string | null;
  English?: string | null;
}

async function request<T>(
  creds: BaserowCredentials,
  url: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Token ${creds.token}`,
      ...(init.body !== undefined && { "Content-Type": "application/json" }),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as T;
}

async function toError(response: Response): Promise<Error> {
  if (response.status === 401) {
    return new Error(
      "Baserow rejected the database token (invalid, or missing permissions on this table).",
    );
  }
  if (response.status === 404) {
    return new Error("Baserow table not found — check the table ID.");
  }
  let detail = "";
  try {
    const body = (await response.json()) as {
      error?: string;
      detail?: unknown;
    };
    detail =
      typeof body.detail === "string"
        ? body.detail
        : JSON.stringify(body.detail ?? body.error ?? "");
  } catch {
    // body wasn't JSON; fall back to the status line below
  }
  return new Error(
    `Baserow request failed (${response.status})${detail ? `: ${detail}` : ""}`,
  );
}

function rowsUrl(creds: BaserowCredentials, suffix = "") {
  return `${API_BASE}/api/database/rows/table/${encodeURIComponent(creds.tableId)}/${suffix}?user_field_names=true`;
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/** Reads the whole table, page by page. `onProgress` gets the row count so far. */
export async function fetchAllRows(
  creds: BaserowCredentials,
  onProgress?: (rowCount: number) => void,
): Promise<BaserowVocabRow[]> {
  const rows: BaserowVocabRow[] = [];
  let url: string | null = `${rowsUrl(creds)}&size=${PAGE_SIZE}`;
  while (url) {
    const page: { next: string | null; results: RawRow[] } = await request(
      creds,
      url,
    );
    for (const row of page.results) {
      rows.push({
        id: row.id,
        estonian: row.Estonian ?? "",
        english: row.English ?? "",
      });
    }
    onProgress?.(rows.length);
    // Guard against the API advertising an http:// next link behind its proxy.
    url = page.next?.replace(/^http:\/\//, "https://") ?? null;
  }
  return rows;
}

/** Creates one row per pair; only Estonian and English are sent. */
export async function createRows(
  creds: BaserowCredentials,
  pairs: VocabPair[],
): Promise<void> {
  for (const batch of chunks(pairs, BATCH_SIZE)) {
    await request(creds, rowsUrl(creds, "batch/"), {
      method: "POST",
      body: {
        items: batch.map((pair) => ({
          Estonian: pair.estonian,
          English: pair.english,
        })),
      },
    });
  }
}

/** Updates only the English field of the given rows. */
export async function updateEnglish(
  creds: BaserowCredentials,
  updates: { id: number; english: string }[],
): Promise<void> {
  for (const batch of chunks(updates, BATCH_SIZE)) {
    await request(creds, rowsUrl(creds, "batch/"), {
      method: "PATCH",
      body: {
        items: batch.map((update) => ({
          id: update.id,
          English: update.english,
        })),
      },
    });
  }
}
