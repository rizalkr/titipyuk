# TitipYuk Semarang

A secure item storage service platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Complete Authentication System** - Sign up, login, and protected routes
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 🔒 **Secure Storage** - User authentication and session management with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Fast Performance** - Built on Next.js 14 with TypeScript
- 🤖 **Chatbot Lunos AI** - Chat streaming + riwayat percakapan tersimpan (khusus konteks TitipYuk)

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Supabase Auth
- **Database:** Supabase
- **Icons:** Lucide React
- **AI:** Lunos (OpenAI compatible)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd titipyuk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup (Local)

Gunakan CLI Supabase untuk lokal:
```bash
npm run db:start        # npx supabase start
npm run db:migrate      # apply semua migration lokal
npm run db:reset        # reset (hati-hati hapus data)
```
Credensial lokal default sudah tercetak saat start (API 54321, DB 54322, Studio 54323).

### Supabase Remote (Online)

1. Buat project di dashboard Supabase.
2. Buat Personal Access Token (Account Settings → Access Tokens).
3. Export token (sementara di shell):
```bash
export SUPABASE_ACCESS_TOKEN="<token>"
export PROJECT_REF="<project-ref>"       # contoh: abcdxyzefghij123
```
4. Link project ke repo ini (menulis project_ref ke `supabase/config.toml`):
```bash
npm run db:link
```
5. Push migration ke remote:
```bash
npm run db:migrate:remote   # alias npx supabase db push
```
6. (Opsional) Regenerasi types langsung dari remote schema:
```bash
npx supabase gen types typescript --project-id $PROJECT_REF --schema public > types/supabase.ts
```
7. Update `.env.local` untuk pakai URL & anon key remote (simulasikan environment production). Restart dev server.

### Environment Variables

Wajib (client + server):
- `NEXT_PUBLIC_SUPABASE_URL` → URL project Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key

Server-only (JANGAN diprefix NEXT_PUBLIC, hanya jika benar-benar diperlukan):
- `SUPABASE_SERVICE_ROLE_KEY` (saat ini tidak wajib karena semua operasi mematuhi RLS; jangan taruh di client)

Chatbot (server side):
- `LUNOS_API_KEY` (rahasia, jangan expose)
- `LUNOS_BASE_URL` (default: https://api.lunos.tech/v1, bisa di-skip)

Catatan audit `.env.local` saat ini:
- Sudah memuat URL & anon key lokal (127.0.0.1). Ganti ke remote saat integrasi online.
- `LUNOS_API_KEY` ada di file lokal (OK untuk dev). Pastikan tidak commit key sensitif ke repo publik.
- Belum ada service role key dan memang belum diperlukan.

### Chatbot / AI

Endpoint:
- `POST /api/chat` (non-stream)
- `POST /api/chat/stream` (streaming token)
- `GET /api/chat/history?conversationId=...` (riwayat 1 percakapan)
- `GET /api/chat/conversations` (daftar percakapan user)

Fitur:
- Streaming dengan indikator mengetik
- Persist `conversationId` di localStorage
- Riwayat & pemilihan percakapan lama
- Logging pesan ke tabel `chat_messages` (migration sudah disiapkan)

## Project Structure

```
titipyuk/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard page
│   ├── login/             # Login page
│   ├── signup/            # Sign up page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── Navigation.tsx     # Navigation component
├── components/ChatWidget.tsx # Floating chatbot widget
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── lib/                   # Utility functions & Supabase clients
│   ├── supabase.ts        # Browser client
│   ├── supabase-middleware.ts # Server-side helper
│   └── utils.ts           # Helpers (format IDR, etc.)
├── supabase/migrations/   # SQL migration files (idempotent)
└── middleware.ts          # Next.js middleware for route protection
```

## Pages

- **Homepage (/)** - Landing page dengan copy lokal Indonesia
- **Sign Up (/signup)** - Registrasi
- **Login (/login)** - Autentikasi
- **Dashboard (/dashboard)** - Protected
- **Booking / Checkout / Confirmation** - Alur pemesanan penitipan

## Authentication Flow

1. Sign Up (server action) membuat user & profile
2. Login (server action) menyetel session cookies (httpOnly) → middleware membaca
3. Protected routes cek session via server-side Supabase client
4. Logout clear cookies

## Deployment

Platform rekomendasi: Vercel.

Langkah ringkas:
1. Set semua env di dashboard deploy (jangan masukkan service role kecuali perlu).
2. Deploy code.
3. Jalankan migrasi remote (jika belum) sebelum user akses (db push).
4. Verifikasi endpoint chat & booking.

## Security Notes

- Jangan pernah expose `SUPABASE_SERVICE_ROLE_KEY` ke browser.
- Pastikan RLS policies tetap aktif (migration sudah handle DO blocks).
- Rotasi `LUNOS_API_KEY` jika pernah terpublikasi.
- Batasi rate / spam chat (TODO: rate limiting future).

## Useful Scripts

```bash
npm run setup              # start local supabase + install deps
npm run db:start
npm run db:migrate
npm run db:migrate:remote
npm run db:generate-types
```

## Contributing

1. Fork repo
2. Branch feature
3. Commit & push
4. PR

## License

MIT
