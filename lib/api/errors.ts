import { NextResponse } from 'next/server';

/**
 * Map of HTTP status codes to user-safe messages. Used as the fallback when no
 * actionable upstream detail is available, and as the message for 5xx errors
 * (which may carry internal detail we must never echo). For 4xx the upstream
 * detail is preferred - see `SURFACE_DETAIL_STATUSES` below.
 */
const SAFE_MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Bad request.',
  401: 'You are not signed in or your session has expired.',
  402: 'Your Swarms account does not have enough credits to run this.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'The request took too long. Please try again.',
  409: 'The request conflicted with the current state. Please retry.',
  413: 'The request payload is too large.',
  415: 'Unsupported request format.',
  422: 'The request could not be processed as written.',
  429: 'Rate limit exceeded. Slow down and try again shortly.',
  500: 'Something went wrong on our side. Please try again shortly.',
  502: 'Upstream service is unavailable. Please try again shortly.',
  503: 'Service temporarily unavailable. Please try again shortly.',
  504: 'Upstream service timed out. Please try again shortly.',
};

/**
 * Client-error (4xx) statuses whose upstream detail describes the *caller's own
 * request* - a restricted/unknown model, an out-of-range field, a missing task,
 * an exhausted quota - and is therefore safe and genuinely useful to surface so
 * the user can fix it. The Swarms API authors these messages itself (they are
 * not stack traces; those only come from 5xx, which we never surface).
 *
 * 401 is deliberately excluded: its detail can be environment-specific and the
 * generic "you're not signed in" copy is clearer for an end user.
 */
const SURFACE_DETAIL_STATUSES = new Set([
  400, 402, 403, 404, 409, 413, 415, 422, 429,
]);

interface PossiblyHasStatus {
  status?: number;
  code?: string | number;
  message?: string;
}

function pickStatus(error: unknown): number {
  const e = error as PossiblyHasStatus;
  const raw = e?.status;
  if (typeof raw === 'number' && raw >= 400 && raw < 600) return raw;
  // The API client reports a network-level failure reaching the upstream Swarms
  // API as status 0 - surface that as a Bad Gateway, not an ambiguous 500.
  if (raw === 0) return 502;
  return 500;
}

/**
 * Defense-in-depth before an upstream 4xx detail reaches the browser. These
 * messages are authored by the Swarms API, so this only normalises whitespace,
 * caps length so a large body can't flood the UI, and strips the few things
 * that should never appear in a client-facing message anyway (absolute
 * filesystem paths, a Python traceback) just in case. URLs are preserved  - 
 * the API's 4xx copy intentionally links to docs and the upgrade page.
 */
function sanitizeDetail(message: string | undefined): string | undefined {
  if (typeof message !== 'string') return undefined;
  let out = message.trim();
  if (!out) return undefined;
  // The client falls back to this placeholder when it found no real detail;
  // the status-mapped safe message reads better than "API Error: 400".
  if (/^API Error:\s*\d+$/i.test(out)) return undefined;
  out = out
    .replace(/Traceback \(most recent call last\):[\s\S]*/i, '')
    // Windows drive paths and unix paths rooted at common system dirs only, so
    // legitimate URL paths (https://swarms.world/platform/account) are kept.
    .replace(
      /(?:[A-Za-z]:\\[^\s]*|\/(?:home|usr|var|opt|app|root|tmp|Users|private|etc)\/[^\s]*)/g,
      '[path]',
    )
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  if (out.length > 800) out = out.slice(0, 797) + '…';
  return out || undefined;
}

/**
 * Convert any error thrown inside an API route into a sanitised JSON response.
 * The full error is logged server-side under the supplied `context` for
 * debugging. For client errors (4xx) the user sees the upstream detail so they
 * can correct their request; for everything else they see only the
 * status-mapped safe message and an opaque code, if the upstream provided one.
 */
export function jsonErrorFromUnknown(
  context: string,
  error: unknown,
): NextResponse {
  // Log the full error server-side. This is the only place the raw upstream
  // detail should ever live in full.
  console.error(`[${context}]`, error);

  const status = pickStatus(error);
  const e = error as PossiblyHasStatus;
  const code = typeof e?.code === 'string' ? e.code : undefined;

  const safeMessage =
    SAFE_MESSAGE_BY_STATUS[status] ?? SAFE_MESSAGE_BY_STATUS[500];

  // Prefer the upstream detail for client errors so the message is actionable
  // (e.g. "model 'gpt-5.4' requires a premium plan - try gpt-4o, or upgrade")
  // instead of a generic "Bad request." 5xx stays generic.
  let message = safeMessage;
  if (SURFACE_DETAIL_STATUSES.has(status)) {
    const detail = sanitizeDetail(e?.message);
    if (detail) message = detail;
  }

  return NextResponse.json(
    code ? { error: message, code } : { error: message },
    { status },
  );
}
