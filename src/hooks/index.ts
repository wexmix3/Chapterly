'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { UserBook, UserStats, BookSearchResult, ShelfStatus } from '@/types';
import type { User } from '@supabase/supabase-js';

// ─── useAuth ─────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

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

  const signInWithGoogle = useCallback(async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
    } catch {
      setAuthError('Google sign-in failed. Please try email/password below.');
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<string> => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      return '';
    } catch {
      return 'Sign in failed. Please try again.';
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<string> => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) return error.message;
      return '';
    } catch {
      return 'Sign up failed. Please try again.';
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }, []);

  return { user, loading, authError, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut };
}

// ─── useShelf ────────────────────────────────────────────────
export function useShelf(status?: ShelfStatus) {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('limit', '50');

    const res = await fetch(`/api/user-books?${params}`);
    const json = await res.json();
    if (json.data) {
      setBooks(json.data);
      setTotal(json.meta?.total ?? json.data.length);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

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

  return { books, loading, total, fetchBooks, addBook, updateBook };
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

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data ?? []);
      }
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, loading };
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
