import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processBatchSubmit({ batchId, data, user, date }).
// Rejects duplicate batch ids; stores prep data and marks the batch active.
export async function POST(request) {
  try {
    const { batchId, data, user, date } = await request.json();
    if (!batchId || !data) {
      return NextResponse.json({ success: false, error: 'Missing batch data.' });
    }

    const supabase = getSupabase();

    const { data: existing, error: lookupErr } = await supabase
      .from('batches')
      .select('id')
      .eq('id', batchId)
      .maybeSingle();
    if (lookupErr) return NextResponse.json({ success: false, error: lookupErr.message });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Duplicate Batch ID. This batch already exists.' });
    }

    const info = data['General Info'] || {};
    const { error: insertErr } = await supabase.from('batches').insert({
      id: batchId,
      factory_code: info.factoryCode || null,
      shift: info.shift || null,
      mix_number: info.mixNumber != null ? String(info.mixNumber) : null,
      batch_date: date || null,
      status: 'active',
      prep_data: data,
      created_by: user || null,
    });
    if (insertErr) return NextResponse.json({ success: false, error: insertErr.message });

    return NextResponse.json({ success: true, batchId });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request.' });
  }
}
