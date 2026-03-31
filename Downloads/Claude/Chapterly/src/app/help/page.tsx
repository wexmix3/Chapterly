import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { ChevronDown, Mail } from 'lucide-react';

export const metadata = {
  title: 'Help & FAQ — Chapterly',
  description: 'Answers to common questions about using Chapterly.',
};

const FAQS = [
  {
    q: 'How do I track my reading?',
    a: 'Add a book to your shelf by searching in the dashboard or clicking "Add Book". Once a book is on your "Currently Reading" shelf, tap it to log a reading session — you can log by pages read or by time spent reading.',
  },
  {
    q: 'What is a reading streak?',
    a: 'A reading streak is the number of consecutive days on which you have logged at least one reading session. If you log every day, your streak grows. Missing a day resets your streak to zero (unless you have a streak freeze available).',
  },
  {
    q: 'How do streak freezes work?',
    a: 'A streak freeze protects your streak for one day when you cannot read. You earn a streak freeze by reaching certain streak milestones. When you have a freeze available and you miss a day, you can apply it from the dashboard to keep your streak intact. Each freeze can only be used once.',
  },
  {
    q: 'Can I import my books from Goodreads?',
    a: 'Yes. Go to your shelf page and click "Import from Goodreads". Export your library from Goodreads (Library → Export Library), then upload the CSV file. Chapterly will import your read, currently-reading, and want-to-read books automatically.',
  },
  {
    q: 'How do reading goals work?',
    a: 'During onboarding (or in Settings → Challenge), you set a yearly book goal. Your progress is tracked on the dashboard and progress page. The goal resets at the start of each calendar year. You can change your goal at any time in the challenge settings.',
  },
  {
    q: 'What are daily quests?',
    a: 'Daily quests are small tasks you can complete each day to earn XP: logging a reading session, adding a book to your shelf, or writing a review. Completing quests builds your reader level and appears on your profile. Quests reset every midnight.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Account, then scroll to the "Danger Zone" section and click "Delete Account". This permanently removes all your data including your reading history, reviews, and profile. This action cannot be undone.',
  },
];

export default function HelpPage() {
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
        <h1 className="text-3xl font-bold text-ink-900 dark:text-ink-50 mb-2">Help & FAQ</h1>
        <p className="text-ink-500 dark:text-ink-400 mb-10">Answers to the most common questions about Chapterly.</p>

        {/* FAQ */}
        <section className="space-y-3 mb-14">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                <span className="font-semibold text-sm text-ink-800 dark:text-ink-100 pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-sm text-ink-600 dark:text-ink-400 leading-relaxed border-t border-ink-100 dark:border-ink-800 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </section>

        {/* Contact */}
        <section className="bg-brand-50 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-brand-600" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-2">Still have questions?</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-5">
            We read every email and typically respond within 24 hours.
          </p>
          <a
            href="mailto:hello@getchapterly.com"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            hello@getchapterly.com
          </a>
        </section>
      </main>

      <footer className="border-t border-ink-100 dark:border-ink-800 px-6 py-8 mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-400">
          <p>© 2026 Chapterly</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-ink-700 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-ink-700 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/help" className="hover:text-ink-700 transition-colors font-medium">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
