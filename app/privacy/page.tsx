import type { Metadata } from 'next'
import LegalPageShell from '@/components/LegalPageShell'

export const metadata: Metadata = {
  title: 'Privacy Policy — RepoMax',
  description: 'How RepoMax collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="July 4, 2026">
      <p>
        RepoMax (&quot;RepoMax,&quot; &quot;we,&quot; &quot;us&quot;) provides a tool that analyzes public
        GitHub repositories to generate a score, feedback, and resume content. This policy explains what
        information we collect when you use tryrepomax.com (the &quot;Service&quot;), how we use it, and the
        choices you have.
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">1. Information we collect</h2>
        <p className="mb-3"><strong className="text-[#F8FAFC]">Repository URLs you submit.</strong> When you paste a GitHub URL, we read the public contents of that repository (README, file structure, and code) to generate your results. We only access public repositories — we never request access to private repos.</p>
        <p className="mb-3"><strong className="text-[#F8FAFC]">Account information.</strong> If you create an account, we collect your email address and, if you sign in with Google, basic profile information (name, email, profile photo) provided by Google. Passwords are hashed and stored by our authentication provider — we never see or store plaintext passwords.</p>
        <p className="mb-3"><strong className="text-[#F8FAFC]">Saved scores.</strong> If you save a repo score to your account, we store the repo URL, score, and generated content so you can access it later.</p>
        <p><strong className="text-[#F8FAFC]">Usage data.</strong> We automatically collect analytics data — pages visited, buttons clicked, browser and device type, and approximate location derived from IP address — to understand how the Service is used and to fix problems.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">2. How we use your information</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To generate your Repo Score, feedback, and resume bullets</li>
          <li>To create and maintain your account, if you choose to sign up</li>
          <li>To save and let you revisit your past repo scores</li>
          <li>To understand usage patterns and improve the Service</li>
          <li>To detect abuse and enforce our Terms of Service</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">3. Third-party services</h2>
        <p className="mb-3">We rely on the following third parties to operate the Service. Each processes a limited slice of data necessary for its function:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong className="text-[#F8FAFC]">GitHub API</strong> — to read public repository content</li>
          <li><strong className="text-[#F8FAFC]">An AI language model provider</strong> — to generate your score, feedback, and resume bullets from repository content</li>
          <li><strong className="text-[#F8FAFC]">Supabase</strong> — authentication and storage of account data and saved scores</li>
          <li><strong className="text-[#F8FAFC]">PostHog</strong> — product analytics</li>
          <li><strong className="text-[#F8FAFC]">Vercel</strong> — hosting and infrastructure</li>
        </ul>
        <p className="mt-3">We do not sell your personal information to anyone.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">4. Cookies and tracking</h2>
        <p>We use cookies and similar technologies for authentication (keeping you signed in) and analytics (understanding how the Service is used). You can disable cookies in your browser, though some features — like staying signed in — may stop working.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">5. Data retention</h2>
        <p>We retain account data and saved scores for as long as your account is active. If you delete your account, we delete your saved data within a reasonable time, except where we&apos;re required to retain it by law. Repository content submitted anonymously (without an account) is processed to generate your results and is not tied to your identity.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">6. Your choices</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>You can use the core scoring feature without creating an account</li>
          <li>You can request deletion of your account and associated data at any time by contacting us</li>
          <li>You can opt out of non-essential analytics tracking via your browser&apos;s privacy settings</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">7. Children&apos;s privacy</h2>
        <p>The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">8. Security</h2>
        <p>We use industry-standard measures to protect your information, including encryption in transit. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">9. Changes to this policy</h2>
        <p>We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll update the date at the top of this page.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">10. Contact</h2>
        <p>Questions about this policy? Contact us at <a href="mailto:support@tryrepomax.com" className="text-[#38D9FF] hover:underline">support@tryrepomax.com</a>.</p>
      </section>
    </LegalPageShell>
  )
}
