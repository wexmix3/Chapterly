import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export const metadata = {
  title: 'Privacy Policy — Chapterly',
  description: 'Learn how Chapterly collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-500 mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-ink-700 dark:text-ink-300">

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">1. Overview</h2>
            <p>
              Chapterly ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, share, and safeguard information about you when you use our
              reading-tracking platform at getchapterly.com and any associated mobile applications
              (collectively, the "Service").
            </p>
            <p className="mt-2">
              By using the Service, you agree to the collection and use of information as described in
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">2.1 Account and Authentication Data</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Email address (required for account creation)</li>
              <li>Display name and profile handle (chosen by you)</li>
              <li>Avatar / profile photo (optional, uploaded by you)</li>
              <li>Google account identifiers if you sign in with Google</li>
              <li>Account creation date and last login time</li>
            </ul>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">2.2 Reading and Activity Data</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Books you add to your shelves (reading, read, want-to-read)</li>
              <li>Reading sessions: start/end time, pages read, duration</li>
              <li>Reading streaks, daily stats, and personal bests</li>
              <li>Book ratings, reviews, and notes you write</li>
              <li>Quotes you save from books</li>
              <li>Reading challenges and goals you set</li>
              <li>XP, reader level, and achievement data</li>
            </ul>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">2.3 Social Data</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Users you follow and who follow you</li>
              <li>Reading clubs you join or create</li>
              <li>Club posts and comments</li>
              <li>Feed activity shared with followers</li>
            </ul>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">2.4 Payment Data</h3>
            <p>
              If you subscribe to Chapterly Premium, payment processing is handled entirely by Stripe.
              We do not store your full card number, CVV, or bank account details. We retain records of
              your subscription status, billing history, and the last four digits of your payment method
              as provided by Stripe.
            </p>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">2.5 Technical and Usage Data</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP address and general location (country/region)</li>
              <li>Browser type, device type, and operating system</li>
              <li>Pages visited, features used, and interaction events</li>
              <li>Error and crash reports</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Authenticate you and keep your account secure</li>
              <li>Personalise your reading dashboard, feed, and recommendations</li>
              <li>Generate AI-powered reading insights (using Anthropic Claude)</li>
              <li>Send streak reminders, weekly digests, and transactional emails</li>
              <li>Process Premium subscription payments</li>
              <li>Analyse product usage to understand and improve features</li>
              <li>Detect abuse, fraud, and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to third parties. We do not use your reading data for
              advertising targeting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">4. Third-Party Service Providers</h2>
            <p>
              We share limited data with trusted third-party processors who help us operate the Service.
              Each processor is contractually required to handle your data securely and only for the
              purposes we specify.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink-200 dark:border-ink-700">
                    <th className="text-left py-2 pr-4 font-semibold text-ink-800 dark:text-ink-200">Provider</th>
                    <th className="text-left py-2 pr-4 font-semibold text-ink-800 dark:text-ink-200">Purpose</th>
                    <th className="text-left py-2 font-semibold text-ink-800 dark:text-ink-200">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  <tr>
                    <td className="py-2 pr-4 font-medium">Supabase</td>
                    <td className="py-2 pr-4">Database, auth, storage</td>
                    <td className="py-2">All user and reading data</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Anthropic</td>
                    <td className="py-2 pr-4">AI reading insights</td>
                    <td className="py-2">Reading history, book metadata</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Stripe</td>
                    <td className="py-2 pr-4">Payment processing</td>
                    <td className="py-2">Email, billing information</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Resend</td>
                    <td className="py-2 pr-4">Transactional email</td>
                    <td className="py-2">Email address, display name</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">PostHog</td>
                    <td className="py-2 pr-4">Product analytics</td>
                    <td className="py-2">Usage events, anonymised user ID</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Sentry</td>
                    <td className="py-2 pr-4">Error monitoring</td>
                    <td className="py-2">Error context, browser/device info</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Vercel</td>
                    <td className="py-2 pr-4">Hosting, CDN</td>
                    <td className="py-2">IP address, request logs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">5. Your Rights</h2>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">5.1 GDPR (EU/EEA/UK residents)</h3>
            <p>If you are located in the EU, EEA, or UK, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Rectification</strong> — correct inaccurate or incomplete data</li>
              <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction</strong> — request that we limit processing of your data</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
            </ul>

            <h3 className="text-base font-semibold text-ink-800 dark:text-ink-200 mt-4 mb-2">5.2 CCPA (California residents)</h3>
            <p>California residents have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Know what personal information we collect, use, and disclose</li>
              <li>Request deletion of their personal information</li>
              <li>Opt out of the sale of personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising their privacy rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Reading session data,
              stats, and social content are retained for the life of your account to power features
              like streak history, yearly progress charts, and reading wrapped summaries.
            </p>
            <p className="mt-2">
              If you delete your account, we delete all personally identifiable data associated with
              your account within 30 days. Anonymised or aggregated data (e.g., total books read across
              all users) may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">7. Account Deletion</h2>
            <p>
              You can permanently delete your account at any time from{' '}
              <Link href="/settings" className="text-brand-600 hover:text-brand-700">Settings → Account</Link>.
              Account deletion removes your profile, reading data, social connections, and all associated
              content. This action is irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">8. Cookies and Tracking</h2>
            <p>
              We use essential cookies for authentication and session management. We use PostHog for
              product analytics — this uses a first-party cookie to track usage events. We do not use
              third-party advertising cookies.
            </p>
            <p className="mt-2">
              You can opt out of analytics tracking by contacting us at{' '}
              <a href="mailto:hello@getchapterly.com" className="text-brand-600 hover:text-brand-700">
                hello@getchapterly.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">9. Data Security</h2>
            <p>
              We use industry-standard security measures including encrypted connections (TLS), row-level
              security (RLS) on our database, and access controls to protect your data. Despite these
              measures, no system is completely secure. We encourage you to use a strong, unique password
              and to enable two-factor authentication where available.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">10. Children's Privacy</h2>
            <p>
              Chapterly is not directed to children under the age of 13. We do not knowingly collect
              personal data from children under 13. If you believe a child under 13 has provided us
              with their data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900 dark:text-ink-100 mb-3">11. Contact</h2>
            <p>
              For privacy requests, questions, or to exercise your rights, contact us at:{' '}
              <a href="mailto:hello@getchapterly.com" className="text-brand-600 hover:text-brand-700">
                hello@getchapterly.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-ink-100 dark:border-ink-800 px-6 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-400">
          <p>© 2026 Chapterly</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink-700 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-ink-700 transition-colors font-medium">Privacy</Link>
            <span>·</span>
            <Link href="/help" className="hover:text-ink-700 transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
