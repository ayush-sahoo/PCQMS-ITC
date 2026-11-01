import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processGetAllBatchIds() — every batch id in the system.
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('batches').select('id');
    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, allBatches: (data || []).map((r) => r.id) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error.' });
  }
}
