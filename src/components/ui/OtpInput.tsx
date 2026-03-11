'use client';

import { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from 'react';

interface Props {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function OtpInput({ length = 6, onComplete, error, disabled }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [shaking, setShaking] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (error) {
      setShaking(true);
      setDigits(Array(length).fill(''));
      setTimeout(() => {
        setShaking(false);
        inputs.current[0]?.focus();
      }, 600);
    }
  }, [error, length]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 100);
  }, []);

  const focus = (i: number) => inputs.current[i]?.focus();

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < length - 1) focus(i + 1);
    if (next.every((d) => d)) onComplete(next.join(''));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        setDigits(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = '';
        setDigits(next);
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = Array(length).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const focusIdx = Math.min(text.length, length - 1);
    focus(focusIdx);
    if (text.length === length) onComplete(text);
  };

  return (
    <div className={`flex gap-2 justify-center ${shaking ? 'animate-shake' : ''}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 outline-none transition-all disabled:opacity-50
            ${error
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-ink-200 bg-white text-ink-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
            }
          `}
        />
      ))}
    </div>
  );
}
