import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@strapi/design-system';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that wraps the editor content area.
 * Catches render errors in children and displays a fallback UI with a retry button.
 * Logs errors with [TiptapEditor] prefix for debugging.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TiptapEditor] Editor crashed:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box padding={4} background="danger100" hasRadius>
          <Typography variant="omega" textColor="danger700">
            The editor encountered an error and could not render.
          </Typography>
          <Box marginTop={2}>
            <Button variant="secondary" size="S" onClick={this.handleRetry}>
              Retry
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
