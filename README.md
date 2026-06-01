# RepoStory

Turn a GitHub repo into resume bullets, a LinkedIn post, and an X post.

## Local development

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Powers story generation |
| `GITHUB_TOKEN` | No | GitHub PAT for higher API rate limits |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token for rate limiting |

Rate limiting is disabled locally when Upstash vars are unset.

## Deploy on Vercel

### Option A — One command (automated)

**One-time setup:**

```bash
gh auth login          # GitHub (already done if gh works)
npx vercel login       # Vercel
cp .env.example .env.local   # add OPENAI_API_KEY, etc.
```

**Deploy:**

```bash
npm run deploy
```

This script will:

1. Run `npm run build` locally (fail fast)
2. Create/push the GitHub repo (`onir-narahari/repostory` by default)
3. Link the Vercel project
4. Sync env vars from `.env.local` to Vercel
5. Run a production deploy

Override repo name: `REPO_NAME=my-app npm run deploy`

### Option B — Fully automatic on every push

1. Run `npm run deploy` once (or push to GitHub manually)
2. In [Vercel](https://vercel.com/new), import the GitHub repo
3. Add env vars in Vercel (or they’re synced if you used Option A)
4. Every `git push origin main` deploys automatically — no script needed

### Option C — Manual

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set **Root Directory** to `.` (repo root).
4. Framework preset: **Next.js** (auto-detected).
5. Add environment variables from `.env.example` in Project Settings → Environment Variables.
6. Deploy.

Build command: `npm run build`  
Output: Next.js default (no custom config needed)

### Recommended production env

- `OPENAI_API_KEY` — required
- `GITHUB_TOKEN` — recommended to avoid GitHub rate limits
- `UPSTASH_REDIS_REST_*` — recommended to limit abuse (5 requests / 60s per IP)
