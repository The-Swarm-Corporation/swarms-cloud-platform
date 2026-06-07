import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
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
