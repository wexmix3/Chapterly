'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <p className="text-sm font-medium text-ink-700">Something went wrong</p>
          <p className="text-xs text-ink-400 max-w-xs">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-xs text-brand-600 hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
