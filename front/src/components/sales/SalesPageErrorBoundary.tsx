import { Component, type ErrorInfo, type ReactNode } from 'react';

type SalesPageErrorBoundaryProps = {
  screenName: string;
  children: ReactNode;
  onRetry: () => void;
  retryMessage?: string;
};

type SalesPageErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class SalesPageErrorBoundary extends Component<SalesPageErrorBoundaryProps, SalesPageErrorBoundaryState> {
  state: SalesPageErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sales page render error:', error, errorInfo.componentStack);
  }

  private resetBoundary = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <h2 className="text-lg font-semibold">{this.props.screenName} failed to render.</h2>
          <p className="mt-2 text-sm text-rose-700">{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={this.resetBoundary}
            className="mt-4 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            {this.props.retryMessage ?? 'Retry'}
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
