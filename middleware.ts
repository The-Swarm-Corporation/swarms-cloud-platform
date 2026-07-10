import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// /models/<id>.md -> serve the model's quick-start docs as raw Markdown, so
// agents/crawlers can fetch them without a browser (mirrors the "Copy Docs"
// button on the model page).
const MODEL_DOCS_MD_RE = /^\/models\/(.+)\.md$/;

export async function middleware(request: NextRequest) {
  const match = MODEL_DOCS_MD_RE.exec(request.nextUrl.pathname);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/models/docs/${match[1]}`;
    return NextResponse.rewrite(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Exclude Next internals, well-known static manifests, and any file
    // with a static-asset extension. Without these exclusions the auth
    // gate would redirect requests for /manifest.webmanifest, /robots.txt,
    // /sitemap.xml etc. to /login, returning HTML where browsers expect
    // JSON / plaintext / XML.
    '/((?!_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|webmanifest|map)$).*)',
  ],
};
