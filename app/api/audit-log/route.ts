import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveApiKey } from '@/lib/api/server-api-key';
import { createClient } from '@/lib/supabase/server';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const NO_STORE = 'private, no-store';

export async function GET(request: NextRequest) {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401, headers: { 'Cache-Control': NO_STORE } },
    );
  }

  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)),
    );
    const search = (searchParams.get('search') ?? '').trim();
    const action = searchParams.get('action');
    const targetKind = searchParams.get('target_kind');
    const actorUserId = searchParams.get('actor_user_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Resolve org_id from authenticated user (or fallback to a dummy for env-key dev)
    let orgId: string | null = null;
    const hasSupabaseEnv = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    if (hasSupabaseEnv) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      orgId = user?.id ?? null;
    }

    if (!orgId) {
      // Dev fallback: no Supabase auth, no org-scoped filtering.
      return NextResponse.json(
        { events: [], total: 0, page, limit },
        { headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin client unavailable' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    // Build query
    let query = admin
      .from('audit_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (action) {
      query = query.eq('action', action);
    }
    if (targetKind) {
      query = query.eq('target_kind', targetKind);
    }
    if (actorUserId) {
      query = query.eq('actor_user_id', actorUserId);
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      // End of the chosen day
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      query = query.lte('created_at', d.toISOString());
    }
    if (search) {
      // Full-text search on action + target_label + metadata
      query = query.textSearch(
        'idx_audit_events_search',
        search.split(/\s+/).join(' & '),
        { type: 'websearch' },
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[audit-log] query error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    return NextResponse.json(
      {
        events: (data ?? []).map((row: any) => ({
          ...row,
          metadata: row.metadata ?? {},
        })),
        total: count ?? 0,
        page,
        limit,
      },
      { headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/audit-log', error);
  }
}
