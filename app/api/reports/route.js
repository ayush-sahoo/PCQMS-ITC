import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processGetReportsForDateRange(start, end).
// Returns { data: { [batchId]: { prep, inProcess } } } for batches whose
// batch_date falls within the inclusive range.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (!start || !end) {
      return NextResponse.json({ success: false, error: 'Missing date range.' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('batches')
      .select('id, prep_data, inprocess_data')
      .gte('batch_date', start)
      .lte('batch_date', end)
      .order('id', { ascending: true });
    if (error) return NextResponse.json({ success: false, error: error.message });

    const result = {};
    (data || []).forEach((row) => {
      result[row.id] = {
        prep: row.prep_data || {},
        inProcess: row.inprocess_data || {},
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error.' });
  }
}
