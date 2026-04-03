import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold font-[family-name:var(--font-display)] text-primary mb-4">
          404
        </p>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-2">
          Page not found
        </h1>
        <p className="text-sm text-on-surface-variant mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="gradient-primary text-on-primary px-6 py-3 rounded-full font-medium text-sm inline-block hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
