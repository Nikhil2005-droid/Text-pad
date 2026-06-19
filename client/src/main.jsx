import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AppFeedbackProvider } from "./context/AppFeedbackContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { installGlobalErrorTracking } from "./utils/errorTracking.js";

installGlobalErrorTracking();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppFeedbackProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WorkspaceProvider>
      </AppFeedbackProvider>
    </ErrorBoundary>
  </StrictMode>,
)
