'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { UserBook, UserStats, BookSearchResult, ShelfStatus } from '@/types';
import type { User } from '@supabase/supabase-js';

// ─── useAuth ─────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createBrowserSupabaseClient();
      supabase.auth.getSession().then((result) => {
        setUser(result.data.session?.user ?? null);
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => listener.subscription.unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  const getRedirectUrl = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    return `${base}/auth/callback`;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getRedirectUrl() },
      });
      if (err) setError(err.message);
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  }, [getRedirectUrl]);

const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); return false; }
      return true;
    } catch {
      setError('Sign in failed. Please try again.');
      return false;
    }
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ success: boolean; needsVerification: boolean }> => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName, display_name: displayName } },
      });
      if (err) { setError(err.message); return { success: false, needsVerification: false }; }
      const needsVerification = !data.session && !!data.user;
      return { success: true, needsVerification };
    } catch {
      setError('Sign up failed. Please try again.');
      return { success: false, needsVerification: false };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string): Promise<boolean> => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      if (err) { setError(err.message); return false; }
      return true;
    } catch {
      setError('Verification failed. Please try again.');
      return false;
    }
  }, []);

  const resendOtp = useCallback(async (email: string): Promise<void> => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.auth.resend({ type: 'signup', email });
      if (err) setError(err.message);
    } catch {
      setError('Failed to resend code.');
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/login?mode=reset`,
      });
      if (err) { setError(err.message); return false; }
      return true;
    } catch {
      setError('Failed to send reset email.');
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }, []);

  return {
    user, loading, error, setError,
    signInWithGoogle,
    signInWithEmail, signUpWithEmail,
    verifyOtp, resendOtp, resetPassword,
    signOut,
  };
}

const SHELF_PAGE_SIZE = 24;

// ─── useShelf ────────────────────────────────────────────────
export function useShelf(status?: ShelfStatus) {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setOffset(0);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(SHELF_PAGE_SIZE));
    params.set('offset', '0');

    const res = await fetch(`/api/user-books?${params}`);
    const json = await res.json();
    if (json.data) {
      setBooks(json.data);
      setTotal(json.meta?.total ?? json.data.length);
    }
    setLoading(false);
  }, [status]);

  const fetchMore = useCallback(async () => {
    const nextOffset = offset + SHELF_PAGE_SIZE;
    if (nextOffset >= total) return;
    setLoadingMore(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', String(SHELF_PAGE_SIZE));
    params.set('offset', String(nextOffset));

    const res = await fetch(`/api/user-books?${params}`);
    const json = await res.json();
    if (json.data) {
      setBooks(prev => [...prev, ...json.data]);
      setOffset(nextOffset);
    }
    setLoadingMore(false);
  }, [status, offset, total]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const hasMore = books.length < total;

  const addBook = useCallback(
    async (searchResult: BookSearchResult, bookStatus: ShelfStatus) => {
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResult, status: bookStatus }),
      });
      if (res.ok) await fetchBooks();
      return res;
    },
    [fetchBooks]
  );

  const updateBook = useCallback(
    async (id: string, updates: Partial<UserBook>) => {
      const res = await fetch('/api/user-books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) await fetchBooks();
      return res;
    },
    [fetchBooks]
  );

  return { books, loading, loadingMore, total, hasMore, fetchBooks, fetchMore, addBook, updateBook };
}

// ─── useStats ────────────────────────────────────────────────
export function useStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/stats');
    if (res.ok) {
      const json = await res.json();
      setStats(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// ─── useBookSearch ───────────────────────────────────────────
export function useBookSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setError(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setResults(json.data ?? []);
        } else {
          setResults([]);
          setError(json.error ?? 'Search failed. Please try again.');
        }
      } catch {
        setResults([]);
        setError('Network error. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, loading, error };
}

// ─── useNotifications ────────────────────────────────────────
export function useNotifications(pollInterval = 30_000) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1&unread=true');
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.unread_count ?? 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, pollInterval);
    return () => clearInterval(id);
  }, [fetchCount, pollInterval]);

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setUnreadCount(0);
  }, []);

  return { unreadCount, refetch: fetchCount, markAllRead };
}

// ─── useLogSession ───────────────────────────────────────────
export function useLogSession() {
  const [loading, setLoading] = useState(false);

  const logSession = useCallback(
    async (payload: {
      user_book_id: string;
      book_id: string;
      mode: 'pages' | 'minutes';
      value: number;
      pages_start?: number;
      pages_end?: number;
      notes?: string;
    }) => {
      setLoading(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setLoading(false);
      return res;
    },
    []
  );

  return { logSession, loading };
}
