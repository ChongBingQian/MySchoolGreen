# MySchoolGreen (Cloudflare Pages + Workers)

A React + TypeScript app deployed with:
- Cloudflare Pages for the frontend SPA
- Cloudflare Workers for API endpoints

## Getting Started

```bash
npm install
npm run dev
```

The development server runs with Vite.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production assets to `dist` |
| `npm run start` | Preview the production build locally |
| `npm run deploy:pages` | Build and deploy frontend to Cloudflare Pages |
| `npm run deploy:worker` | Deploy Worker API using `wrangler.worker.toml` |
| `npm run deploy:cloudflare` | Deploy Pages then Worker |
| `npm run deploy` | Alias of `npm run deploy:cloudflare` |
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Auto-fix linting errors |
| `npm run format` | Format code with Prettier |

## Cloudflare Deployment

1. Authenticate Wrangler:

```bash
npx wrangler login
```

2. Deploy frontend (Pages):

```bash
npm run deploy:pages
```

3. Deploy backend API (Worker):

```bash
npm run deploy:worker
```

4. Deploy both in sequence:

```bash
npm run deploy
```

## Worker Endpoints

- `GET /api/health`
- `GET /api/time`

Worker entrypoint: `src/worker/index.ts`

## Notes

- Client data/auth currently use local browser storage through a Cloudflare-compatible client shim in `src/client/lib/cloudflare/`.
- Existing `src/server/` code is kept for reference.
