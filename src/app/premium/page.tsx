export const dynamic = 'force-dynamic';

// HIDDEN: Premium page is temporarily disabled while Chapterly is fully free.
// Re-enable by removing the redirect below and restoring the PremiumClient render.
import { redirect } from 'next/navigation';

export default async function PremiumPage() {
  // Redirect to dashboard — premium is not publicly available right now
  redirect('/dashboard');
}

// ── Original implementation (kept for re-launch) ──────────────────────────────
// import { createServerSupabaseClient } from '@/lib/supabase-server';
// import PremiumClient from './PremiumClient';
//
// export default async function PremiumPage() {
//   const supabase = createServerSupabaseClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) redirect('/login');
//
//   const { data: profile } = await supabase
//     .from('users')
//     .select('is_premium, premium_expires_at, stripe_customer_id')
//     .eq('id', user.id)
//     .maybeSingle();
//
//   return (
//     <PremiumClient
//       isPremium={profile?.is_premium ?? false}
//       expiresAt={profile?.premium_expires_at ?? null}
//       hasCustomer={!!profile?.stripe_customer_id}
//     />
//   );
// }
