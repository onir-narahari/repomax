// Sends the daily digest through Resend.
//
// Sending is a single POST to Resend's REST API, so this goes through fetch
// rather than pulling in the `resend` SDK — one less dependency in the
// serverless bundle, and nothing here needs the SDK's extra surface.
// RESEND_API_KEY and RESEND_EMAIL_DOMAIN are injected by the Vercel
// marketplace integration.
//
// The From address has to be on a domain we own and have verified, which is
// why it is jobs@tryrepomax.com rather than the project's Gmail — no
// provider can send as a gmail.com address. Reply-To points back at the
// Gmail inbox so replies still land somewhere a human reads.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'tryrepomax@gmail.com'

// Resend's shared onboarding domain is the fallback for local/preview use
// before DNS verification completes. It only delivers to the Resend account
// owner's own address, so it is useful for seeing a real rendered email and
// nothing else.
const SHARED_TEST_FROM = 'RepoMax <onboarding@resend.dev>'

function fromAddress(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM
  const domain = process.env.RESEND_EMAIL_DOMAIN
  return domain ? `RepoMax <jobs@${domain}>` : SHARED_TEST_FROM
}

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
  // Surfaced to Gmail/Apple Mail as a native "Unsubscribe" button next to
  // the sender name. Materially better for deliverability than a footer link
  // alone, and it keeps recipients from reaching for "spam" as their
  // unsubscribe mechanism.
  unsubscribeUrl?: string
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'EmailSendError'
  }
}

export async function sendEmail({ to, subject, html, text, unsubscribeUrl }: SendEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new EmailSendError('RESEND_API_KEY is not set', 500)

  const headers: Record<string, string> = {}
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`
    // Tells the client the URL is safe to hit unattended, which is what
    // makes the one-click button appear rather than a "visit this link"
    // prompt. Our unsubscribe route accepts both GET and POST for this.
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      reply_to: REPLY_TO,
      subject,
      html,
      text,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new EmailSendError(`Resend rejected the send (${res.status}): ${detail}`, res.status)
  }

  const body = (await res.json()) as { id?: string }
  return body.id ?? ''
}
