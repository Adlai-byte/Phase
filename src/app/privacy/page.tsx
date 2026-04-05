import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-primary hover:text-primary-container transition-colors mb-8 inline-block">&larr; Back to Phase</Link>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface mb-8">Privacy Policy</h1>
        <div className="prose prose-sm text-on-surface-variant space-y-4">
          <p>Last updated: April 2026</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">1. Information We Collect</h2>
          <p>We collect information you provide: name, email, phone number, and property details. For tenants, we store contact information and room assignments as provided by boarding house owners.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">2. How We Use Your Data</h2>
          <p>Your data is used to operate the Phase platform: managing properties, processing invoices, sending notifications, and providing analytics to boarding house owners.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">3. Data Sharing</h2>
          <p>We do not sell your data. Tenant information is only visible to their respective boarding house owner. We may share data with email/SMS providers for notification delivery.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">4. Data Security</h2>
          <p>Passwords are hashed with bcrypt. Sessions use signed JWT tokens. All data is stored in encrypted databases.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">5. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting support@phase.app.</p>
          <h2 className="text-lg font-semibold text-on-surface mt-6">6. Contact</h2>
          <p>For privacy inquiries: support@phase.app</p>
        </div>
      </div>
    </div>
  );
}
