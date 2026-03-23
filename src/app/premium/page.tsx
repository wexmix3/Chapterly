export const dynamic = 'force-dynamic';

// HIDDEN: Premium is disabled — product is fully free for now. Re-enable when monetizing.
import { redirect } from 'next/navigation';

export default async function PremiumPage() {
  redirect('/dashboard');
}
