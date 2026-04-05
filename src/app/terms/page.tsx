import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-primary hover:text-primary-container transition-colors mb-8 inline-block">&larr; Back to Phase</Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-8">Terms of Service</h1>
        <div className="prose prose-sm text-on-surface-variant space-y-4">
          <p>Last updated: April 2026</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">1. Acceptance of Terms</h2>
          <p>By accessing and using Phase, you agree to be bound by these Terms of Service. Phase is a boarding house management platform serving Mati City, Davao Oriental.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">2. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">3. Boarding House Owners</h2>
          <p>Owners must provide accurate property information. All boarding house listings are subject to verification by the Phase administration team.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">4. Data & Privacy</h2>
          <p>We collect and process personal data as described in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Tenant data is stored securely and only accessible to the respective boarding house owner.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">5. Limitation of Liability</h2>
          <p>Phase provides the platform as-is. We are not responsible for disputes between boarding house owners and tenants.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">6. Contact</h2>
          <p>For questions about these terms, contact us at support@phase.app.</p>
        </div>
      </div>
    </div>
  );
}
