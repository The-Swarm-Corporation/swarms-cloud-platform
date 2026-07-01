import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import type { AuditAction } from '@/lib/audit/types';

const NO_STORE = 'private, no-store';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You are not signed in.' },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const search = searchParams.get('search') ?? '';
    const category = searchParams.get('category') ?? '';
    const actor = searchParams.get('actor') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';

    let query = admin
      .from('audit_events')
      .select('id, actor_user_id, actor_kind, action, target_kind, target_id, target_label, metadata, ip_address, user_agent, created_at', { count: 'exact' })
      .eq('org_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,target_label.ilike.%${search}%`
      );
    }

    if (category) {
      const categoryActions = getCategoryActions(category);
      if (categoryActions.length > 0) {
        query = query.in('action', categoryActions);
      }
    }

    if (actor && actor !== 'all') {
      if (actor === 'system') {
        query = query.eq('actor_kind', 'system');
      } else if (actor === 'self') {
        query = query.eq('actor_user_id', user.id);
      } else {
        query = query.eq('actor_user_id', actor);
      }
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const actorIds = [...new Set((data ?? []).map((e: Record<string, unknown>) => e.actor_user_id as string).filter(Boolean))];

    let userMap = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: usersData } = await admin
        .from('auth.users')
        .select('id, email')
        .in('id', actorIds);
      userMap = new Map((usersData ?? []).map((u: { id: string; email: string }) => [u.id, u.email]));
    }

    const eventsWithEmail = (data ?? []).map((event: Record<string, unknown>) => ({
      ...event,
      actor_email: event.actor_user_id ? (userMap.get(event.actor_user_id as string) ?? null) : null,
    }));

    return NextResponse.json(
      { events: eventsWithEmail, count: count ?? 0 },
      { headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/audit/events', error);
  }
}

function getCategoryActions(category: string): AuditAction[] {
  const categoryMap: Record<string, AuditAction[]> = {
    Members: [
      'member.invited',
      'member.invite_resent',
      'member.invite_revoked',
      'member.joined',
      'member.role_changed',
      'member.removed',
    ],
    'API keys': ['api_key.created', 'api_key.rotated', 'api_key.deleted'],
    Agents: ['agent.created', 'agent.updated', 'agent.deleted'],
    Swarms: ['swarm.executed'],
    Billing: [
      'credits.topped_up',
      'subscription.changed',
      'payment_method.added',
      'payment_method.removed',
      'invoice.failed',
    ],
    Security: [
      'auth.signed_in',
      'auth.signed_out',
      'auth.password_changed',
      'auth.new_device',
      'auth.suspicious_activity',
    ],
    Settings: [
      'settings.updated',
      'notification_prefs.updated',
      'webhook.added',
      'webhook.removed',
    ],
    Organization: [
      'organization.created',
      'organization.renamed',
      'organization.transferred',
      'organization.deleted',
    ],
  };
  return categoryMap[category] ?? [];
}
