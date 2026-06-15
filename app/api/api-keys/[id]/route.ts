import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonErrorFromUnknown } from '@/lib/api/errors';

const NO_STORE = 'private, no-store';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const hasSupabaseEnv = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    if (!hasSupabaseEnv) {
      return NextResponse.json(
        { error: 'Supabase is not configured on this instance.' },
        { status: 503, headers: { 'Cache-Control': NO_STORE } },
      );
    }

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

    // Scope the lookup to the requesting user so one user can never revoke
    // another user's key by guessing ids.
    const { data: existing, error: lookupError } = await admin
      .from('swarms_cloud_api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .not('is_deleted', 'is', true)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) {
      return NextResponse.json(
        { error: 'API key not found.' },
        { status: 404, headers: { 'Cache-Control': NO_STORE } },
      );
    }

    const { error: updateError } = await admin
      .from('swarms_cloud_api_keys')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': NO_STORE } },
    );
  } catch (error) {
    return jsonErrorFromUnknown('api/api-keys:DELETE', error);
  }
}
