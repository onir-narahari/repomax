// Rendering for the daily 8am CT job digest email.
//
// Deliberately pure: these functions take already-fetched match rows and
// return strings. No DB reads, no network, no env access — so the whole
// email surface is unit-testable without provisioning a mail provider or
// sending anything. The worker route (app/api/jobs/cron/match-user) does the
// I/O and hands the results in here.

export interface DigestJob {
  title: string
  company: string
  location: string | null
  // The matching engine's per-match explanation ("uses the same Postgres +
  // pgvector stack as your `semantic-search` repo"). Written by GPT, so it
  // is untrusted text as far as HTML rendering is concerned — escaped below.
  reason: string
  url: string
  repoName: string
  // null for the matching engine's fallback tier, where GPT never scored the
  // candidate. We render no score at all in that case rather than inventing
  // one — same rule the product applies everywhere else (CLAUDE.md: no
  // fabricated metrics).
  confidence: number | null
}

export interface DigestInput {
  jobs: DigestJob[]
  unsubscribeUrl: string
  appUrl: string
}

const BLACK = '#0B0B0F'
const MUTED = '#5B6478'
const HAIRLINE = '#E4E7EE'
const ACCENT = '#F9A8D4'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Subject line leads with the companies rather than a generic "your daily
// matches" — a recruiter-aware product should make the inbox preview itself
// specific enough to be worth opening.
export function buildSubject(jobs: DigestJob[]): string {
  const companies = Array.from(new Set(jobs.map((j) => j.company)))
  const count = jobs.length
  const noun = count === 1 ? 'match' : 'matches'

  if (companies.length === 0) return 'No matches today'
  if (companies.length <= 3) return `${count} ${noun} today: ${companies.join(', ')}`

  const shown = companies.slice(0, 2).join(', ')
  return `${count} ${noun} today: ${shown} + ${companies.length - 2} more`
}

function locationLine(job: DigestJob): string {
  return job.location ? `${job.company} · ${job.location}` : job.company
}

export function renderDigestText({ jobs, unsubscribeUrl, appUrl }: DigestInput): string {
  const blocks = jobs.map((job, i) => {
    const score = job.confidence !== null ? ` (${Math.round(job.confidence)}% match)` : ''
    return [
      `${i + 1}. ${job.title}${score}`,
      `   ${locationLine(job)}`,
      `   Matched to your ${job.repoName} repo — ${job.reason}`,
      `   Apply: ${job.url}`,
    ].join('\n')
  })

  return [
    `${jobs.length === 1 ? 'One job' : `${jobs.length} jobs`} lined up against your repos this morning.`,
    '',
    blocks.join('\n\n'),
    '',
    `See all your matches: ${appUrl}/profile`,
    `Stop these emails: ${unsubscribeUrl}`,
  ].join('\n')
}

function renderJobCard(job: DigestJob, isLast: boolean): string {
  const borderBottom = isLast ? 'none' : `1px solid ${HAIRLINE}`
  const score =
    job.confidence !== null
      ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:${ACCENT};color:${BLACK};font-size:12px;font-weight:600;vertical-align:middle;">${Math.round(
          job.confidence
        )}% match</span>`
      : ''

  return `
    <tr>
      <td style="padding:22px 0;border-bottom:${borderBottom};">
        <div style="font-size:17px;font-weight:700;color:${BLACK};line-height:1.35;">
          ${escapeHtml(job.title)}${score}
        </div>
        <div style="font-size:14px;color:${MUTED};margin-top:4px;">
          ${escapeHtml(locationLine(job))}
        </div>
        <div style="font-size:14px;color:${BLACK};margin-top:12px;line-height:1.5;">
          <strong style="font-weight:600;">Matched to ${escapeHtml(job.repoName)}</strong> — ${escapeHtml(job.reason)}
        </div>
        <a href="${escapeHtml(job.url)}"
           style="display:inline-block;margin-top:14px;padding:9px 16px;background:${BLACK};color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
          View role
        </a>
      </td>
    </tr>`
}

export function renderDigestHtml({ jobs, unsubscribeUrl, appUrl }: DigestInput): string {
  const cards = jobs.map((job, i) => renderJobCard(job, i === jobs.length - 1)).join('')
  const lede =
    jobs.length === 1
      ? 'One job lined up against your repos this morning.'
      : `${jobs.length} jobs lined up against your repos this morning.`

  // Table-based layout with fully inline styles: Outlook and Gmail strip
  // <style> blocks and ignore most modern CSS, so this is the one place in
  // the codebase that deliberately does not follow the app's Tailwind
  // conventions.
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your RepoMax matches</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#FFFFFF;border-radius:14px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <tr>
            <td style="padding-bottom:8px;">
              <span style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">RepoMax</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:20px;font-weight:700;color:${BLACK};line-height:1.35;padding-bottom:4px;">
              ${escapeHtml(lede)}
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;color:${MUTED};padding-bottom:8px;">
              Each one is tied to a specific project you've already built.
            </td>
          </tr>
          ${cards}
          <tr>
            <td style="padding-top:24px;font-size:13px;color:${MUTED};line-height:1.6;">
              <a href="${escapeHtml(appUrl)}/profile" style="color:${BLACK};font-weight:600;text-decoration:underline;">See all your matches</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Stop these emails</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
