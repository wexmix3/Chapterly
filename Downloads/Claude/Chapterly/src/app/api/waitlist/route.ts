export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Store in Supabase (ignore duplicate emails)
  const { error } = await supabase
    .from('waitlist')
    .insert({ email })
    .select()
    .maybeSingle();

  if (error && !error.message.includes('duplicate')) {
    console.error('Waitlist insert error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }

  // Notify admin via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Chapterly <noreply@chapterly.app>',
        to: 'maxmwexley@gmail.com',
        subject: `New waitlist signup: ${email}`,
        text: `${email} joined the Chapterly waitlist.`,
      }),
    }).catch(() => {}); // fire-and-forget, don't block the response
  }

  return NextResponse.json({ ok: true });
}
