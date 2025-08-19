# TitipYuk Semarang

A secure item storage service platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Complete Authentication System** - Sign up, login, and protected routes
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 🔒 **Secure Storage** - User authentication and session management with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Fast Performance** - Built on Next.js 14 with TypeScript

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Supabase Auth
- **Database:** Supabase
- **Icons:** Lucide React

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

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Authentication is automatically set up - no additional tables needed for basic auth

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
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── lib/                   # Utility functions
│   ├── supabase.ts        # Supabase client
│   ├── supabase-middleware.ts # Auth middleware
│   └── utils.ts           # Utility functions
└── middleware.ts          # Next.js middleware for route protection
```

## Pages

- **Homepage (/)** - Landing page with features and pricing
- **Sign Up (/signup)** - User registration
- **Login (/login)** - User authentication  
- **Dashboard (/dashboard)** - Protected user dashboard

## Authentication Flow

1. **Sign Up**: Users create an account with email/password
2. **Email Confirmation**: Users may need to confirm their email (depending on Supabase settings)
3. **Login**: Users sign in with their credentials
4. **Protected Routes**: Dashboard and booking pages require authentication
5. **Auto Redirect**: Authenticated users are redirected away from auth pages

## Deployment

The app is ready to be deployed on platforms like Vercel, Netlify, or any platform supporting Next.js.

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
