"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-error">!</span>
        </div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-on-surface-variant mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="gradient-primary text-on-primary px-6 py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
