import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processGetActiveBatches() — batches submitted in prep but not yet
// closed out via the in-process sign-off.
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('batches')
      .select('id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, activeBatches: (data || []).map((r) => r.id) });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error.' });
  }
}
