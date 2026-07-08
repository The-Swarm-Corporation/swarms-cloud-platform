import {
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/auth',
  '/terms',
  '/privacy',
  '/learn-more',
  // Model catalog pages are public for SEO: they are statically generated,
  // listed in the sitemap, and must be crawlable without a session.
  '/models',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isPublic = isPublicPath(pathname);

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isApi && !isPublic) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      if (pathname !== '/') {
        loginUrl.searchParams.set('next', `${pathname}${search}`);
      }
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Auth check failed; let the request through.
  }

  return response;
}
