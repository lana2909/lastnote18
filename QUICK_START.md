# Quick Start Guide - One Last Note

## 1. Clone/Download the Project

You already have the project files.

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. The database schema has been created via Supabase MCP tools
3. Note your credentials:
   - Project URL
   - Anon Key
   - Service Role Key

## 4. Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run_openssl_rand_base64_32
```

Generate secret:
```bash
openssl rand -base64 32
```

## 5. Seed the Database

```bash
npm run seed
```

**IMPORTANT**: Save the credentials that are printed to console!

## 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 7. Test the Application

1. Login with any generated credentials
2. Test sending a message to a classmate
3. Try accessing My Messages (should be locked until 35 messages sent)
4. Test admin panel with admin credentials

## 8. Build for Production

```bash
npm run build
```

## Project Structure

```
one-last-note/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth config
│   │   └── messages/send/route.ts       # Send message API
│   ├── admin/page.tsx                   # Admin panel
│   ├── dashboard/page.tsx               # Main dashboard
│   ├── login/page.tsx                   # Login page
│   ├── my-messages/page.tsx             # View messages
│   ├── send/[recipientId]/page.tsx      # Send message form
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Home (redirects)
├── components/
│   ├── admin/AdminClient.tsx
│   ├── dashboard/DashboardClient.tsx
│   ├── messages/MyMessagesClient.tsx
│   ├── send/SendMessageForm.tsx
│   └── providers/SessionProvider.tsx
├── lib/
│   └── supabase.ts                      # Supabase client
├── scripts/
│   └── seed.ts                          # Database seeding
├── types/
│   └── next-auth.d.ts                   # NextAuth types
├── .env.local                           # Environment variables
├── next.config.js                       # Next.js config
├── tailwind.config.ts                   # Tailwind config
└── package.json                         # Dependencies
```

## Key Features

### For All Users
- Beautiful galaxy-themed UI
- Send anonymous messages to classmates
- Progress tracking (x/35 messages)
- Unlock inbox after completing all messages
- View received messages (when unlocked)

### For Admins
- Everything regular users have
- Admin panel access
- View all messages in system
- Filter messages by recipient
- Platform statistics

### Message Fields
Each message includes:
1. Kesan (Impression)
2. Pesan (Message)
3. Larangan (Things to avoid - 3+)
4. Sifat (Traits to maintain - 3+)
5. Kesimpulan (Summary in one sentence)
6. Hal Terpendam (Hidden feelings)
7. Momen Berkesan (Most memorable moment)

## Common Tasks

### View All Users in Database
```sql
SELECT name, username, role, is_unlocked
FROM users
ORDER BY name;
```

### Check Message Count
```sql
SELECT u.name, COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m.recipient_id
GROUP BY u.id, u.name
ORDER BY message_count DESC;
```

### Check Progress for a User
```sql
SELECT COUNT(*) as sent_count
FROM submission_tracker
WHERE user_id = 'user-id-here';
```

### Unlock a User Manually (Admin Only)
```sql
UPDATE users
SET is_unlocked = true
WHERE username = 'username.here';
```

## Default Users Created by Seed

**5 Admins:**
1. Mohammad Nur Hadi Maulana
2. Muhammad Afdal
3. Ahmad Naufal Satrio
4. Keyshafana Ayodya Putri Dewitya
5. Vivi Nur Hidayah

**31 Regular Users:**
- Aisyah Putri Maharani
- Alya Zahra Kamila
- Ananda Rizky Pratama
- ... and 28 more

(Run seed script to see full list with credentials)

## Troubleshooting

### Can't login
- Check username (lowercase with dot)
- Verify password
- Clear browser cache
- Check console for errors

### Build fails
- Delete `.next` folder
- Run `npm install` again
- Check Node.js version (need 18+)
- Verify all environment variables

### Database errors
- Verify Supabase credentials
- Check database migrations are applied
- Test connection in Supabase dashboard
- Review RLS policies

### Messages not appearing
- Check if user is unlocked
- Verify message was saved in database
- Check browser console for errors
- Review RLS policies in Supabase

## Next Steps

1. ✅ Run seed script and save credentials
2. ✅ Test locally with development server
3. ✅ Distribute credentials to all 36 students
4. ✅ Deploy to production server
5. ✅ Monitor usage and messages
6. ✅ Celebrate when everyone completes their messages!

## Support

For detailed deployment instructions, see `DEPLOYMENT.md`
For credential management, see `CREDENTIALS.md`
For technical details, see `README.md`

## Important Reminders

- ⚠️ Save seed script output (contains all passwords)
- ⚠️ Use HTTPS in production
- ⚠️ Keep service role key secret
- ⚠️ Monitor server resources (2GB RAM limit)
- ⚠️ Backup database before major changes
- ⚠️ Test thoroughly before going live

## Timeline Suggestion

- **Day 1**: Set up and test
- **Day 2-3**: Distribute credentials to students
- **Week 1**: Students send messages
- **Week 2**: Everyone completes and reads messages
- **Forever**: Memories preserved in the digital galaxy
