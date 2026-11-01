import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processInProcessSubmit({ batchId, data, user }).
// Attaches in-process data to an existing active batch and closes it.
export async function POST(request) {
  try {
    const { batchId, data, user } = await request.json();
    if (!batchId || !data) {
      return NextResponse.json({ success: false, error: 'Missing in-process data.' });
    }

    const supabase = getSupabase();

    const { data: existing, error: lookupErr } = await supabase
      .from('batches')
      .select('id, status')
      .eq('id', batchId)
      .maybeSingle();
    if (lookupErr) return NextResponse.json({ success: false, error: lookupErr.message });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Batch not found.' });
    }

    const { error: updateErr } = await supabase
      .from('batches')
      .update({
        inprocess_data: data,
        status: 'closed',
        closed_by: user || null,
        closed_at: new Date().toISOString(),
      })
      .eq('id', batchId);
    if (updateErr) return NextResponse.json({ success: false, error: updateErr.message });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request.' });
  }
}
