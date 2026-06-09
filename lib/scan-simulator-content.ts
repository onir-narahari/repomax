export type ReadmeLine = {
  id: string
  text: string
  type: 'heading' | 'subheading' | 'body' | 'code' | 'blank' | 'tagline' | 'link-row' | 'demo-block' | 'divider'
}

export type HighlightEvent = {
  atSecond: number
  side: 'before' | 'after'
  lineIds: string[]
  sentiment: 'drop' | 'keep'
  label: string
}

export const BEFORE_LINES: ReadmeLine[] = [
  { id: 'b-title',  text: '# auth-app',          type: 'heading' },
  { id: 'b-blank1', text: '',                     type: 'blank' },
  { id: 'b-tech-h', text: '## Technologies',      type: 'subheading' },
  { id: 'b-tech-1', text: '- React',              type: 'body' },
  { id: 'b-tech-2', text: '- Node.js',            type: 'body' },
  { id: 'b-tech-3', text: '- Express',            type: 'body' },
  { id: 'b-tech-4', text: '- MongoDB',            type: 'body' },
  { id: 'b-tech-5', text: '- JWT',                type: 'body' },
  { id: 'b-blank2', text: '',                     type: 'blank' },
  { id: 'b-feat-h', text: '## Features',          type: 'subheading' },
  { id: 'b-feat-1', text: '- Register and login', type: 'body' },
  { id: 'b-feat-2', text: '- Protected routes',   type: 'body' },
  { id: 'b-feat-3', text: '- Dashboard',          type: 'body' },
  { id: 'b-blank3', text: '',                     type: 'blank' },
  { id: 'b-run-h',  text: '## How to run',        type: 'subheading' },
  { id: 'b-run-1',  text: 'npm install',          type: 'code' },
  { id: 'b-run-2',  text: 'npm run dev',          type: 'code' },
  { id: 'b-blank4', text: '',                     type: 'blank' },
  { id: 'b-lic-h',  text: '## License',           type: 'subheading' },
  { id: 'b-lic-1',  text: 'MIT',                  type: 'body' },
]

export const AFTER_LINES: ReadmeLine[] = [
  { id: 'a-title',    text: '# Auth Starter',                                        type: 'heading' },
  { id: 'a-tagline',  text: '> Drop-in JWT auth for React + Node — login, refresh',  type: 'tagline' },
  { id: 'a-tagline2', text: '> tokens, protected routes. Fork and go.',              type: 'tagline' },
  { id: 'a-blank1',   text: '',                                                       type: 'blank' },
  { id: 'a-links',    text: '[Live Demo] · [Docs] · [Report Bug]',                  type: 'link-row' },
  { id: 'a-blank2',   text: '',                                                       type: 'blank' },
  { id: 'a-demo',     text: '▶  demo.gif — login flow',                              type: 'demo-block' },
  { id: 'a-blank3',   text: '',                                                       type: 'blank' },
  { id: 'a-why-h',    text: '## Why this exists',                                   type: 'subheading' },
  { id: 'a-why-1',    text: 'Most auth tutorials skip refresh tokens and proper',    type: 'body' },
  { id: 'a-why-2',    text: 'error states. This ships both, ready to fork ...',      type: 'body' },
  { id: 'a-blank4',   text: '',                                                       type: 'blank' },
  { id: 'a-qs-h',     text: '## Quick start',                                       type: 'subheading' },
  { id: 'a-qs-1',     text: 'git clone github.com/you/auth-starter',                type: 'code' },
  { id: 'a-qs-2',     text: 'cd auth-starter && cp .env.example .env',              type: 'code' },
  { id: 'a-qs-3',     text: '# add MONGO_URI + JWT_SECRET',                         type: 'code' },
  { id: 'a-qs-4',     text: 'npm install && npm run dev',                           type: 'code' },
  { id: 'a-qs-5',     text: '→ localhost:3000',                                     type: 'code' },
  { id: 'a-blank5',   text: '',                                                       type: 'blank' },
  { id: 'a-stack-h',  text: '## Stack',                                             type: 'subheading' },
  { id: 'a-stack-1',  text: 'React 18 · Express · MongoDB Atlas · JWT + bcrypt',    type: 'body' },
  { id: 'a-stack-2',  text: 'Vite · Railway deploy ...',                            type: 'body' },
]

export const HIGHLIGHT_EVENTS: HighlightEvent[] = [
  {
    atSecond: 27,
    side: 'before',
    lineIds: ['b-title'],
    sentiment: 'drop',
    label: 'No description — recruiter has no idea what this does',
  },
  {
    atSecond: 25,
    side: 'after',
    lineIds: ['a-title', 'a-tagline', 'a-tagline2'],
    sentiment: 'keep',
    label: 'One line tells the recruiter exactly what this solves',
  },
  {
    atSecond: 22,
    side: 'before',
    lineIds: ['b-tech-h', 'b-tech-1', 'b-tech-2', 'b-tech-3', 'b-tech-4', 'b-tech-5'],
    sentiment: 'drop',
    label: "Leads with stack — recruiter still doesn't know what the app does",
  },
  {
    atSecond: 18,
    side: 'after',
    lineIds: ['a-demo'],
    sentiment: 'keep',
    label: 'Visual proof it works — recruiter stops scrolling',
  },
  {
    atSecond: 15,
    side: 'before',
    lineIds: ['b-run-h', 'b-run-1', 'b-run-2'],
    sentiment: 'drop',
    label: 'No .env setup — anyone who tries to run it gives up',
  },
  {
    atSecond: 12,
    side: 'after',
    lineIds: ['a-qs-h', 'a-qs-1', 'a-qs-2', 'a-qs-3', 'a-qs-4', 'a-qs-5'],
    sentiment: 'keep',
    label: 'Copy-paste to running in 60 seconds — recruiter respects this',
  },
  {
    atSecond: 8,
    side: 'before',
    lineIds: ['b-feat-h', 'b-feat-1', 'b-feat-2', 'b-feat-3', 'b-lic-h', 'b-lic-1'],
    sentiment: 'drop',
    label: 'Recruiter closed the tab at 8s',
  },
  {
    atSecond: 5,
    side: 'after',
    lineIds: ['a-why-h', 'a-why-1', 'a-why-2', 'a-stack-h', 'a-stack-1', 'a-stack-2'],
    sentiment: 'keep',
    label: 'Context not just names — recruiter forwards this to the team',
  },
]
