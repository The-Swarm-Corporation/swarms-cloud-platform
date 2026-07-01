import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import { jsonErrorFromUnknown } from '@/lib/api/errors';
import type { AuditAction, AuditTargetKind } from '@/lib/audit/types';

const NO_STORE = 'private, no-store';

const VALID_ACTIONS: AuditAction[] = [
  'agent.created',
  'agent.updated',
  'agent.deleted',
  'swarm.executed',
  'settings.updated',
  'notification_prefs.updated',
];

export async function POST(request: NextRequest) {
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

    let body: {
      action?: unknown;
      targetKind?: unknown;
      targetId?: unknown;
      targetLabel?: unknown;
      metadata?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const action = body.action as AuditAction | undefined;
    const targetKind = body.targetKind as AuditTargetKind | undefined;
    const targetId = typeof body.targetId === 'string' ? body.targetId : undefined;
    const targetLabel = typeof body.targetLabel === 'string' ? body.targetLabel : undefined;
    const metadata =
      typeof body.metadata === 'object' && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : undefined;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid or disallowed action.' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    if (!targetKind) {
      return NextResponse.json(
        { error: 'targetKind is required.' },
        { status: 400, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    await logAuditEvent({
      action,
      targetKind,
      targetId,
      targetLabel,
      metadata,
      actorUserId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json(
      { success: true },
      { status: 201, headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/audit', error);
  }
}
