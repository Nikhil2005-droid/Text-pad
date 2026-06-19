const DEFAULT_ERROR_ENDPOINT = "/api/client-errors";
const ERROR_QUEUE_KEY = "textpad.errorReports";
const MAX_QUEUED_REPORTS = 20;

function serializeError(error) {
  if (!error) {
    return { message: "Unknown error" };
  }

  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || "",
  };
}

function readQueue() {
  try {
    const value = localStorage.getItem(ERROR_QUEUE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(
      ERROR_QUEUE_KEY,
      JSON.stringify(items.slice(-MAX_QUEUED_REPORTS))
    );
  } catch {
    // Storage can be unavailable in private mode; reporting should never crash.
  }
}

function queueReport(report) {
  writeQueue([...readQueue(), report]);
}

function getEndpoint() {
  return (
    import.meta.env.VITE_ERROR_TRACKING_URL ||
    import.meta.env.VITE_CLIENT_ERROR_URL ||
    DEFAULT_ERROR_ENDPOINT
  );
}

export async function reportError(error, context = {}) {
  const report = {
    error: serializeError(error),
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
    occurredAt: new Date().toISOString(),
  };

  const endpoint = getEndpoint();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error(`Error report failed with ${response.status}`);
    }

    return true;
  } catch (reportingError) {
    queueReport(report);
    if (import.meta.env.DEV) {
      console.error("Unable to send error report", reportingError);
      console.error(error);
    }
    return false;
  }
}

export function installGlobalErrorTracking() {
  window.addEventListener("error", (event) => {
    void reportError(event.error || new Error(event.message), {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason || "Unhandled promise rejection"));

    void reportError(reason, {
      source: "unhandledrejection",
    });
  });
}
