import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS = path.join(__dirname, '../../playwright-screenshots');

function shot(name: string) {
  return path.join(SCREENSHOTS, `${name}.png`);
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
});

// ── Landing page ──────────────────────────────────────────────────────────────

test('landing page loads and shows sign-up CTA', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: shot('01-landing'), fullPage: true });

  // Nav should have "Start free" button
  const startFree = page.locator('nav a', { hasText: /start free/i });
  await expect(startFree).toBeVisible();
  console.log('✅ "Start free" button visible in nav');

  // Hero CTA
  const heroCTA = page.locator('a', { hasText: /start reading free/i });
  await expect(heroCTA).toBeVisible();
  console.log('✅ Hero CTA visible');

  // Sign-in link present
  const signIn = page.locator('nav a', { hasText: /sign in/i });
  await expect(signIn).toBeVisible();
  console.log('✅ Sign in link visible');
});

// ── Login / Signup page ───────────────────────────────────────────────────────

test('login page defaults to Sign In tab', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: shot('02-login-default') });

  // Should see the tab toggle
  // Tab toggle — "Sign In" appears twice (tab + submit button), target tab by role within rounded bg pill
  const signInTab = page.getByRole('button', { name: 'Sign In' }).first();
  const createTab = page.getByRole('button', { name: 'Create Account' });
  await expect(signInTab).toBeVisible();
  await expect(createTab).toBeVisible();
  console.log('✅ Both Sign In and Create Account tabs visible');

  // Google button should be present
  const googleBtn = page.locator('button', { hasText: /continue with google/i });
  await expect(googleBtn).toBeVisible();
  console.log('✅ Google OAuth button visible');
});

test('?mode=signup pre-selects Create Account tab', async ({ page }) => {
  await page.goto('/login?mode=signup');
  await page.screenshot({ path: shot('03-signup-preselected') });

  // Create Account tab should be active (has shadow/different styling)
  // The form should show Display name field (only in signup mode)
  const displayNameInput = page.locator('input[placeholder="Display name"]');
  await expect(displayNameInput).toBeVisible();
  console.log('✅ Create Account tab pre-selected — Display name field visible');
});

test('signup form validation works', async ({ page }) => {
  await page.goto('/login?mode=signup');

  // Fill mismatched passwords
  await page.fill('input[placeholder="Email address"]', 'test@example.com');
  await page.fill('input[placeholder="Password (min. 6 characters)"]', 'Test123!');
  await page.fill('input[placeholder="Confirm password"]', 'different');
  await page.click('button[type="submit"]');

  await page.screenshot({ path: shot('04-signup-validation-error') });

  const error = page.locator('text=/passwords do not match/i');
  await expect(error).toBeVisible();
  console.log('✅ Password mismatch error shown');
});

test('nav "Start free" links to signup mode', async ({ page }) => {
  await page.goto('/');

  const startFree = page.locator('nav a', { hasText: /start free/i });
  const href = await startFree.getAttribute('href');
  expect(href).toContain('mode=signup');
  console.log(`✅ "Start free" href = ${href}`);

  await startFree.click();
  await page.waitForURL(/\/login/);
  await page.screenshot({ path: shot('05-after-start-free-click') });

  // Should land on signup tab
  const displayNameInput = page.locator('input[placeholder="Display name"]');
  await expect(displayNameInput).toBeVisible();
  console.log('✅ Clicking "Start free" lands on Create Account tab');
});

// ── Demo page ─────────────────────────────────────────────────────────────────

test('demo page loads without auth', async ({ page }) => {
  await page.goto('/demo');
  await page.screenshot({ path: shot('06-demo'), fullPage: true });

  // Should not redirect to login
  expect(page.url()).toContain('/demo');
  console.log('✅ Demo page accessible without auth');
});

// ── Protected routes redirect ─────────────────────────────────────────────────

test('dashboard redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL(/\/login|\/$/);
  await page.screenshot({ path: shot('07-dashboard-redirect') });
  console.log(`✅ /dashboard redirected to: ${page.url()}`);
});

// ── Sign-up flow starts (stops before actual account creation) ────────────────

test('full signup CTA flow navigates correctly', async ({ page }) => {
  await page.goto('/');

  // Click the bottom "Create your free account" CTA
  const bottomCTA = page.locator('a', { hasText: /create your free account/i });
  await expect(bottomCTA).toBeVisible();
  await bottomCTA.click();

  await page.waitForURL(/\/login/);
  await page.screenshot({ path: shot('08-bottom-cta-flow') });

  const displayNameInput = page.locator('input[placeholder="Display name"]');
  await expect(displayNameInput).toBeVisible();
  console.log('✅ Bottom "Create your free account" CTA leads to signup tab');
});
