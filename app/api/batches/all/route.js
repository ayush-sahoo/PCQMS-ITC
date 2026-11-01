import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Returns every batch with prep + in-process payloads for the dashboard.
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('batches')
      .select('id, status, batch_date, created_at, closed_at, prep_data, inprocess_data')
      .order('batch_date', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ success: false, error: error.message });

    const batches = (data || []).map((r) => ({
      id: r.id,
      status: r.status,
      batchDate: r.batch_date,
      createdAt: r.created_at,
      closedAt: r.closed_at,
      prep: r.prep_data || {},
      inProcess: r.inprocess_data || {},
    }));

    return NextResponse.json({ success: true, batches });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error.' });
  }
}
