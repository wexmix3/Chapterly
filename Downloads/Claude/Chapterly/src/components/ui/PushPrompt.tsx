'use client';

/**
 * PushPrompt
 * Shows a toggle to subscribe / unsubscribe from web push notifications.
 * Displayed in Settings → Notifications.
 *
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY env var.
 * If the browser doesn't support push or permission is denied, shows a
 * graceful fallback message.
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check } from 'lucide-react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported' | 'loading';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPrompt() {
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    const perm = Notification.permission as PermissionState;
    setPermission(perm);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const subscribe = async () => {
    setToggling(true);
    setError(null);
    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== 'granted') {
        setToggling(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const keyRes = await fetch('/api/push/subscribe');
      const keyJson = keyRes.ok ? await keyRes.json() : {};
      const publicKey = keyJson.publicKey ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setError('Push notifications are not configured yet.');
        setToggling(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys?.p256dh ?? '', auth: subJson.keys?.auth ?? '' },
        }),
      });

      setSubscribed(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to enable notifications. Please try again.');
      console.error('[push] subscribe error:', err);
    } finally {
      setToggling(false);
    }
  };

  const unsubscribe = async () => {
    setToggling(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
    } catch (err) {
      setError('Failed to disable notifications.');
      console.error('[push] unsubscribe error:', err);
    } finally {
      setToggling(false);
    }
  };

  if (permission === 'loading') return null;

  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-3 py-3 border-t border-ink-100">
        <BellOff className="w-4 h-4 text-ink-300 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-500">Push Notifications</p>
          <p className="text-xs text-ink-400">Not supported in this browser.</p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 py-3 border-t border-ink-100">
        <BellOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-700">Push Notifications</p>
          <p className="text-xs text-ink-400">
            Notifications blocked. Enable them in your browser settings, then reload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-3 border-t border-ink-100">
      <Bell className={`w-4 h-4 flex-shrink-0 ${subscribed ? 'text-brand-500' : 'text-ink-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800">Push Notifications</p>
        <p className="text-xs text-ink-500">
          {subscribed
            ? 'Enabled — get notified for new followers, streaks, and club messages.'
            : 'Get browser notifications for new followers, reading streaks, and book clubs.'}
        </p>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={toggling}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
          subscribed
            ? 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        }`}
      >
        {toggling ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : saved ? (
          <><Check className="w-3.5 h-3.5" /> Saved</>
        ) : subscribed ? (
          <><BellOff className="w-3.5 h-3.5" /> Turn off</>
        ) : (
          <><Bell className="w-3.5 h-3.5" /> Enable</>
        )}
      </button>
    </div>
  );
}
