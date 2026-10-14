"use client";

/**
 * Root error boundary.
 *
 * Only rendered when the *root* layout itself throws, so it cannot rely on the
 * layout's fonts, stylesheets, or providers being present. It therefore renders
 * a self-contained document with inline tokens rather than importing
 * `globals.css` (which the broken layout may have failed to load).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          background: "#111111",
          color: "#f2f0e8",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "520px" }}>
          <p
            style={{
              display: "inline-block",
              margin: 0,
              padding: "4px 12px",
              border: "1px solid #ff8a7a",
              color: "#ff8a7a",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            CRITICAL_ERROR // SYSTEM_FAULT
          </p>

          <h1
            style={{
              margin: "24px 0 0",
              fontSize: "80px",
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            500
          </h1>

          <p style={{ margin: "24px 0 0", fontSize: "14px", color: "#a8a599" }}>
            The application shell failed to render. Reloading usually resolves
            it.
          </p>

          {error.digest ? (
            <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#a8a599" }}>
              ref: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "32px",
              cursor: "pointer",
              border: "none",
              background: "#c7f464",
              color: "#111111",
              padding: "10px 24px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}