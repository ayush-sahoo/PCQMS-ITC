import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mirrors processLogin(username, password) — validates against app_users.
export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required.' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('app_users')
      .select('username, password')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: 'Server error. Please try again.' });
    }
    if (!data || data.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid username or password.' });
    }

    return NextResponse.json({ success: true, username: data.username });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request.' });
  }
}
