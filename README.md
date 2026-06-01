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
