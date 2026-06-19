import { Component } from "react";
import StatusState from "./StatusState.jsx";
import { reportError } from "../utils/errorTracking.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    void reportError(error, {
      source: "react.error-boundary",
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <StatusState
          tone="error"
          kicker="Application Error"
          title="Text Pad hit a rough edge."
          description="Your browser has reported the crash. Refresh the app and your saved workspace data will still be there."
          actionLabel="Reload App"
          onAction={() => window.location.reload()}
          secondaryActionLabel="Go Home"
          onSecondaryAction={() => {
            window.location.href = "/";
          }}
          className="mx-auto my-8 w-full max-w-4xl"
        />
      );
    }

    return this.props.children;
  }
}
