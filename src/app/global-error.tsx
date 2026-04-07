"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif", background: "#f7f9fc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#181c1e", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#3f484d", marginBottom: "2rem" }}>
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                background: "linear-gradient(135deg, #004d64, #006684)",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
