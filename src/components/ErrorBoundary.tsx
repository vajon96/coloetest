import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              System Notice
            </p>
            <h1 className="text-xl font-semibold text-slate-900 mb-3">
              Unable to complete this view
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {this.state.message.startsWith('{')
                ? 'A database authorization or connection check prevented this action. Please sign in or return to the homepage.'
                : this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.hash = '';
              }}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Return to ColorVision Test
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
