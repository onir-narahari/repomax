import type { Metadata } from 'next'
import LegalPageShell from '@/components/LegalPageShell'

export const metadata: Metadata = {
  title: 'Terms of Service — RepoMax',
  description: 'The terms that govern your use of RepoMax.',
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="July 4, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of tryrepomax.com and the services
        provided by RepoMax (&quot;RepoMax,&quot; &quot;we,&quot; &quot;us&quot;). By using the Service, you
        agree to these Terms. If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">1. What RepoMax does</h2>
        <p>RepoMax analyzes public GitHub repositories and generates a score, feedback, and resume content using automated tools, including AI language models. Results are generated automatically and are provided for informational purposes to help you present your projects — they are not a guarantee of any outcome, including job offers, interviews, or recruiter interest.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">2. Eligibility and accounts</h2>
        <p className="mb-3">You must be at least 13 years old to use the Service. You&apos;re responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately if you suspect unauthorized use of your account.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">3. Acceptable use</h2>
        <p className="mb-3">You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Submit repository URLs you don&apos;t have the right to analyze, or use the Service to access private repositories without authorization</li>
          <li>Use automated tools to scrape, spam, or abuse the Service (including submitting an excessive volume of requests)</li>
          <li>Attempt to reverse-engineer, disrupt, or gain unauthorized access to the Service or its infrastructure</li>
          <li>Use the Service for any unlawful purpose</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">4. Your content and ownership</h2>
        <p className="mb-3">You retain all rights to your GitHub repositories and their content. By submitting a repository URL, you grant us permission to access its public content solely to generate your results.</p>
        <p>The score, feedback, and resume bullets generated for you are yours to use however you&apos;d like — on your resume, portfolio, LinkedIn, or anywhere else.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">5. AI-generated content</h2>
        <p>Results are generated using AI language models and automated analysis. While we aim for accuracy and usefulness, AI-generated content can be incomplete or imperfect. You&apos;re responsible for reviewing and verifying any generated content — including resume bullets — before relying on it, such as before including it on an actual resume or job application.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">6. Disclaimer of warranties</h2>
        <p>The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express or implied. We don&apos;t guarantee the Service will be uninterrupted, error-free, or that results will meet your expectations.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">7. Limitation of liability</h2>
        <p>To the fullest extent permitted by law, RepoMax is not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including any impact on your job search or applications.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">8. Third-party services</h2>
        <p>The Service relies on third-party providers (including GitHub, an AI language model provider, Supabase, and Google for sign-in). Your use of those providers&apos; services through RepoMax may also be subject to their own terms.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">9. Termination</h2>
        <p>We may suspend or terminate access to the Service, including your account, if you violate these Terms. You may stop using the Service or request deletion of your account at any time.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">10. Changes to these terms</h2>
        <p>We may update these Terms from time to time. Continued use of the Service after changes take effect means you accept the updated Terms.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[#F8FAFC]">11. Contact</h2>
        <p>Questions about these Terms? Contact us at <a href="mailto:support@tryrepomax.com" className="text-[#38D9FF] hover:underline">support@tryrepomax.com</a>.</p>
      </section>
    </LegalPageShell>
  )
}
