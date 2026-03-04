# One Last Note

A beautiful anonymous message platform for classmates to share their final words before graduation.

## Features

- Anonymous message system (no sender tracking)
- Unlock mechanism: send to all 35 classmates to read your messages
- Beautiful galaxy-themed UI with glassmorphism
- Admin panel for monitoring
- JWT authentication with NextAuth
- Supabase database with Row Level Security
- Production-ready standalone build

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- NextAuth (Credentials Provider)
- Bcrypt for password hashing

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

Generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 2. Database Setup

The database migrations have already been applied via Supabase MCP tools.

If you need to seed the database with 36 students:

```bash
npm run seed
```

This will create 36 users:
- 5 Admins
- 31 Regular Users

The script will output all credentials to the console.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

The standalone build will be in `.next/standalone/`

## User Roles

### Admin Users (5 total)
1. Mohammad Nur Hadi Maulana
2. Muhammad Afdal
3. Ahmad Naufal Satrio
4. Keyshafana Ayodya Putri Dewitya
5. Vivi Nur Hidayah

Admins can:
- View all messages
- Filter messages by recipient
- Access admin panel

### Regular Users (31 total)
Users must:
- Send messages to all 35 classmates
- Unlock their inbox after sending to everyone

## Security Features

- No sender information stored in database
- Passwords hashed with bcrypt
- JWT session strategy
- Row Level Security (RLS) on all tables
- Duplicate message prevention
- Admin cannot see sender identity

## Database Structure

### users
- id (uuid)
- name (text)
- username (text, unique)
- password (text, hashed)
- role (enum: ADMIN, USER)
- is_unlocked (boolean)
- created_at (timestamptz)

### messages
- id (uuid)
- recipient_id (uuid)
- kesan (text)
- pesan (text)
- larangan (text)
- sifat (text)
- kesimpulan (text)
- hal_terpendam (text)
- momen_berkesan (text)
- created_at (timestamptz)

### submission_tracker
- id (uuid)
- user_id (uuid)
- recipient_id (uuid)
- created_at (timestamptz)
- UNIQUE(user_id, recipient_id)

## Routes

- `/` - Home (redirects to login or dashboard)
- `/login` - Authentication page
- `/dashboard` - Main dashboard with classmate list
- `/send/[recipientId]` - Send message form
- `/my-messages` - View received messages (unlocked users only)
- `/admin` - Admin panel (admins only)

## Deployment

### Requirements
- Debian server with 2GB RAM
- Node.js 18+
- Environment variables configured

### Deployment Steps

1. Build the project:
```bash
npm run build
```

2. Copy the standalone folder:
```bash
cp -r .next/standalone ./deploy
cp -r .next/static ./deploy/.next/static
cp -r public ./deploy/public
```

3. Run the server:
```bash
cd deploy
node server.js
```

The app will run on port 3000 by default.

## Performance Optimizations

- Output: standalone for minimal deployment size
- Image optimization disabled
- Lightweight star animations
- No heavy 3D libraries
- Efficient database queries
- Connection pooling

## License

Private project for class use only.
