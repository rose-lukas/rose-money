import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface ImageSearchResult {
  /** Direct URL of the full-size image. */
  url: string;
  /** Small preview URL served by Google, used for the picker grid. */
  thumbnailUrl: string;
  /** Page title the image came from, shown as alt text. */
  title: string;
  width: number | null;
  height: number | null;
}

export const IMAGE_RESULTS_PER_PAGE = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Google caps the Custom Search JSON API at 100 results per query. */
const MAX_START_INDEX = 91;

/**
 * Blocks SSRF by refusing any address that is not a public unicast address.
 * Covers loopback, link-local (incl. cloud metadata at 169.254.169.254),
 * private ranges, CGNAT, and IPv6 equivalents.
 */
function isPrivateIPv4(address: string): boolean {
  const [a, b] = address.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a >= 224) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return a === 100 && b >= 64 && b <= 127;
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;

  // IPv4-mapped addresses such as ::ffff:127.0.0.1
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped) return isPrivateIPv4(mapped[1]);

  // fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast
  return /^(f[cd]|fe[89ab]|ff)/.test(normalized);
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return true;
}

/**
 * Validates that a URL is a plain https URL pointing at a public host.
 * Returns the parsed URL, or null when the target must not be fetched.
 */
export async function assertPublicHttpsUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;

  const host = url.hostname.replace(/^\[|\]$/g, "");

  if (isIP(host)) {
    return isPrivateAddress(host) ? null : url;
  }

  try {
    const records = await lookup(host, { all: true });
    if (records.length === 0) return null;
    if (records.some((r) => isPrivateAddress(r.address))) return null;
  } catch {
    return null;
  }

  return url;
}

/**
 * Runs a Google Programmable Search image query.
 * `page` is zero-based; each page returns IMAGE_RESULTS_PER_PAGE images.
 */
export async function searchImages(
  query: string,
  page = 0
): Promise<{ results: ImageSearchResult[]; error?: string }> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    return { results: [], error: "Image search is not configured yet." };
  }

  const trimmed = query.trim();
  if (!trimmed) return { results: [], error: "Type what the item is first." };

  const start = Math.min(page * IMAGE_RESULTS_PER_PAGE + 1, MAX_START_INDEX);

  const endpoint = new URL("https://www.googleapis.com/customsearch/v1");
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("cx", engineId);
  endpoint.searchParams.set("q", trimmed);
  endpoint.searchParams.set("searchType", "image");
  endpoint.searchParams.set("num", String(IMAGE_RESULTS_PER_PAGE));
  endpoint.searchParams.set("start", String(start));
  endpoint.searchParams.set("safe", "active");
  endpoint.searchParams.set("imgSize", "medium");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    return { results: [], error: "Could not reach image search. Try again." };
  }

  if (!response.ok) {
    if (response.status === 429) {
      return { results: [], error: "Daily image search limit reached." };
    }
    return { results: [], error: "Image search failed. Try again." };
  }

  const payload = (await response.json()) as {
    items?: Array<{
      link?: string;
      title?: string;
      image?: { thumbnailLink?: string; width?: number; height?: number };
    }>;
  };

  const results: ImageSearchResult[] = (payload.items ?? [])
    .filter((item) => typeof item.link === "string" && item.link.startsWith("https://"))
    .map((item) => ({
      url: item.link as string,
      thumbnailUrl: item.image?.thumbnailLink ?? (item.link as string),
      title: item.title ?? "",
      width: item.image?.width ?? null,
      height: item.image?.height ?? null,
    }));

  return { results };
}

/**
 * Downloads an image chosen from search results so it can be re-hosted.
 * Rejects non-image content and anything over MAX_IMAGE_BYTES.
 */
export async function downloadImage(
  rawUrl: string
): Promise<{ bytes: Uint8Array; contentType: string } | { error: string }> {
  const url = await assertPublicHttpsUrl(rawUrl);
  if (!url) return { error: "That image address is not allowed." };

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "image/*" },
    });
  } catch {
    return { error: "Could not download that image. Pick another." };
  }

  if (!response.ok) return { error: "Could not download that image. Pick another." };

  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    return { error: "That link is not an image. Pick another." };
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    return { error: "That image is too large. Pick another." };
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: "That image is too large. Pick another." };
  }

  return { bytes: new Uint8Array(buffer), contentType };
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function extensionForContentType(contentType: string): string {
  return EXTENSION_BY_TYPE[contentType] ?? "jpg";
}
