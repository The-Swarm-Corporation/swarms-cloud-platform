import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';

const NO_STORE = 'private, no-store';
const MAX_NAME_LENGTH = 100;

function maskKey(key: string | null): string {
  if (!key) return '';
  return `${key.slice(0, 5)}.....${key.slice(-5)}`;
}

function generateApiKey(): string {
  // Matches the swarms.world key format: "sk-" + 64 hex chars.
  return `sk-${crypto.randomBytes(32).toString('hex')}`;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You are not signed in or your session has expired.' },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    // `is_deleted` is nullable with default false; filter "not true" so both
    // false and legacy NULL rows are kept (see lib/api/server-api-key.ts).
    const { data, error } = await admin
      .from('swarms_cloud_api_keys')
      .select('id, name, key, created_at')
      .eq('user_id', user.id)
      .not('is_deleted', 'is', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const keys = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      key: maskKey(row.key),
      created_at: row.created_at,
    }));

    return NextResponse.json(
      { keys },
      { headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/api-keys:GET', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You are not signed in or your session has expired.' },
        { status: 401, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    let body: { name?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { error: 'Key name is required.' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Key name must be ${MAX_NAME_LENGTH} characters or fewer.` },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const key = generateApiKey();
    const { data, error } = await admin
      .from('swarms_cloud_api_keys')
      .insert({ name, key, user_id: user.id })
      .select('id, name, created_at')
      .single();

    if (error) throw error;

    logAuditEvent({
      action: 'api_key.created',
      targetKind: 'api_key',
      targetId: data.id,
      targetLabel: name,
      actorUserId: user.id,
    });

    // The full key is returned exactly once, at creation time. Every
    // subsequent read returns the masked form.
    return NextResponse.json(
      { id: data.id, name: data.name, key, created_at: data.created_at },
      { status: 201, headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/api-keys:POST', error);
  }
}
