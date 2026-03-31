export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Suspense } from 'react';
import PremiumClient from './PremiumClient';

export const metadata = {
  title: 'Chapterly Premium',
  description: 'Upgrade to Chapterly Premium and unlock AI-powered reading insights.',
};

export default async function PremiumPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('is_premium, premium_expires_at, stripe_customer_id')
    .eq('id', session.user.id)
    .maybeSingle();

  return (
    <Suspense>
      <PremiumClient
        isPremium={profile?.is_premium ?? false}
        expiresAt={profile?.premium_expires_at ?? null}
        hasCustomer={!!profile?.stripe_customer_id}
      />
    </Suspense>
  );
}
