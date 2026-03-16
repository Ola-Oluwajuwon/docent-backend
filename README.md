# Docent Backend

REST API backend for **Docent**, an AI tutor mobile app. Built with NestJS (Express), it handles file uploads, document parsing, lesson generation via Claude, and user progress tracking.

## Tech Stack

- **NestJS** (Express) — REST API
- **Supabase** — PostgreSQL database
- **Clerk** — JWT authentication
- **Cloudflare R2** — File storage (S3-compatible)
- **BullMQ + Redis** — File parsing queue
- **Anthropic Claude** — Lesson outline and script generation

## Prerequisites

- Node.js 18+
- Redis (for file parsing queue)
- Supabase project
- Clerk application
- Cloudflare R2 bucket
- Anthropic API key

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `ALLOWED_ORIGIN` | CORS origin (e.g. Expo app URL) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL for assets |
| `REDIS_URL` | Redis connection URL |
| `ANTHROPIC_API_KEY` | Anthropic API key |

### Database

Run the initial migration against your Supabase project:

```bash
# Using Supabase CLI (if linked)
supabase db push

# Or run manually in Supabase SQL Editor
# See supabase/migrations/001_initial.sql
```

## Running the App

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The app can start without Redis, Supabase, or R2 configured — you'll see warnings and those features will fail at request time. For full functionality, configure all services.

## API Endpoints

All endpoints except health checks require `Authorization: Bearer <clerk_jwt>`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/files/upload` | Upload PDF, DOCX, or TXT (max 20MB) |
| `GET` | `/files/:materialId/status` | Poll material processing status |
| `POST` | `/lessons/generate` | Generate lesson outline from parsed material |
| `GET` | `/lessons` | List lessons for current user |
| `GET` | `/lessons/:id` | Get single lesson with full outline |

## Project Structure

```
src/
├── config/           # Supabase, R2 services
├── common/           # Guards, decorators, filters, interceptors
├── modules/
│   ├── users/        # User upsert (findOrCreate, findByClerkId)
│   ├── files/        # Upload, parsing queue, status polling
│   └── lessons/      # Lesson generation, Claude integration
├── app.module.ts
└── main.ts
supabase/
└── migrations/      # SQL migrations
```

## Flow

1. **Upload** — User uploads a file → stored in R2 → `materials` row created → parsing job enqueued
2. **Parsing** — BullMQ worker extracts text (PDF/DOCX/TXT) → uploads to `parsed/{materialId}.txt` → updates status to `ready`
3. **Lesson** — Client calls `/lessons/generate` with `materialId` → Claude generates outline → stored in `lessons` table
4. **Progress** — `progress` table tracks per-lesson completion (for future use)

## License

UNLICENSED
