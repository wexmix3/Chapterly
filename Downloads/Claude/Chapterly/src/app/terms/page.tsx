import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Terms of Service — Chapterly',
  description: 'Read the Chapterly Terms of Service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper dark:bg-ink-950">
      {/* Header */}
      <header className="border-b border-ink-100 dark:border-ink-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo href="/" size="sm" />
          <Link href="/login" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Sign in →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-2">Terms of Service</h1>
        <p className="text-sm text-ink-500 mb-10">Last updated: March 2026</p>

        <div className="prose prose-ink dark:prose-invert max-w-none space-y-8 text-ink-700 dark:text-ink-300">

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Chapterly ("Service", "we", "our", "us"), you agree to be bound by
              these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              Your continued use of Chapterly after any changes to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">2. Service Description</h2>
            <p>
              Chapterly is a reading-tracking and social reading platform. Features include tracking books
              and reading sessions, setting reading goals, earning streaks and achievements, joining reading
              clubs, sharing reading activity with other users, and accessing AI-powered reading insights
              (some AI features require a Premium subscription).
            </p>
            <p className="mt-2">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time
              with reasonable notice where practicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">3. User Accounts</h2>
            <p>
              To use Chapterly you must create an account using a valid email address or Google OAuth.
              You are responsible for maintaining the security of your account credentials and for all
              activity that occurs under your account. You must be at least 13 years old to use the Service.
            </p>
            <p className="mt-2">
              You may not create accounts for other people without their permission, impersonate others,
              or create multiple accounts to circumvent restrictions. We reserve the right to suspend or
              terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">4. User Content</h2>
            <p>
              You retain ownership of content you create on Chapterly (reviews, quotes, notes, profile
              information). By submitting content, you grant Chapterly a non-exclusive, royalty-free,
              worldwide license to display, reproduce, and distribute that content within the Service for
              the purpose of providing and improving the platform.
            </p>
            <p className="mt-2">
              You are solely responsible for the content you post. You represent that you have the rights
              to share any content you submit, and that doing so does not violate any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">5. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Post content that is abusive, harassing, defamatory, or hateful</li>
              <li>Spam, scrape, or abuse the Service's APIs or infrastructure</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its systems</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated means to access the Service without our prior consent</li>
              <li>Impersonate Chapterly, its employees, or other users</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">6. Intellectual Property</h2>
            <p>
              The Chapterly name, logo, software, design, and all associated intellectual property are
              owned by Chapterly or its licensors. These Terms do not grant you any right to use our
              trademarks, trade names, or other proprietary information without our express written consent.
            </p>
            <p className="mt-2">
              Book metadata (titles, covers, descriptions) is sourced from third-party databases including
              OpenLibrary and Google Books, and remains the property of their respective owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">7. Third-Party Service Providers</h2>
            <p>
              Chapterly relies on the following third-party services to operate. By using Chapterly, you
              acknowledge that your data may be processed by these providers in accordance with their own
              privacy policies:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Supabase</strong> — database, authentication, and storage infrastructure</li>
              <li><strong>Anthropic</strong> — AI-powered reading insights (Claude API)</li>
              <li><strong>Stripe</strong> — payment processing for Premium subscriptions</li>
              <li><strong>Resend</strong> — transactional and notification emails</li>
              <li><strong>PostHog</strong> — product analytics</li>
              <li><strong>Sentry</strong> — error monitoring and crash reporting</li>
              <li><strong>Vercel</strong> — hosting and infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">8. Premium Subscriptions</h2>
            <p>
              Certain AI-powered features require a Chapterly Premium subscription. Premium subscriptions
              are billed on a recurring basis as described on the pricing page. You may cancel your
              subscription at any time; access continues until the end of the current billing period.
              Payments are processed by Stripe and are non-refundable except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
            <p className="mt-2">
              AI-generated reading insights are for informational purposes only and should not be relied
              upon as professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CHAPTERLY AND ITS AFFILIATES, OFFICERS,
              EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES,
              RESULTING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
            </p>
            <p className="mt-2">
              IN NO EVENT WILL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID
              US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) $100 USD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will update the "Last updated"
              date above and, for material changes, notify you via email or in-app notification. Your
              continued use of the Service after changes take effect constitutes your acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">12. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:hello@getchapterly.com" className="text-brand-600 hover:text-brand-700">
                hello@getchapterly.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-ink-100 dark:border-ink-800 px-6 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-400">
          <p>© 2026 Chapterly</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink-700 transition-colors font-medium">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-ink-700 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/help" className="hover:text-ink-700 transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
