# User Credentials

## How Credentials Are Generated

When you run `npm run seed`, the script will:

1. Create 36 users total:
   - 5 Admin users
   - 31 Regular users

2. Generate usernames from the first two words of each name:
   - Example: "Mohammad Nur Hadi Maulana" → `mohammad.nur`

3. Generate random 8-character passwords for each user

4. Print all credentials to the console in this format:

```
================================================================================
ONE LAST NOTE - USER CREDENTIALS
================================================================================

[ADMIN] Mohammad Nur Hadi Maulana
  Username: mohammad.nur
  Password: aZ7kLfWd

[ADMIN] Muhammad Afdal
  Username: muhammad.afdal
  Password: hI9jK2lM

[USER]  Aisyah Putri Maharani
  Username: aisyah.putri
  Password: f7Ho7avi

...
```

## Admin Users (5 total)

The following users have ADMIN role:

1. Mohammad Nur Hadi Maulana
2. Muhammad Afdal
3. Ahmad Naufal Satrio
4. Keyshafana Ayodya Putri Dewitya
5. Vivi Nur Hidayah

## Regular Users (31 total)

All other users have USER role.

## Important Notes

1. **Save These Credentials**: The passwords are randomly generated and NOT stored anywhere except in the database (hashed). Once the seed script finishes, the only way to recover passwords is to run the seed again (which will generate NEW passwords).

2. **First-Time Setup**: After seeding, distribute the credentials to each student securely (email, printed sheets, etc.).

3. **Password Changes**: The application does NOT currently have a "change password" feature. Users will use their assigned passwords throughout the project lifetime.

4. **Security**:
   - All passwords are hashed with bcrypt (10 rounds)
   - Plaintext passwords are NEVER stored in the database
   - The seed script output should be saved in a secure location

## Sample Credentials (for testing only)

If you run the seed with the default names, you might get something like:

```
[ADMIN] Mohammad Nur Hadi Maulana
  Username: mohammad.nur
  Password: aB3dE5fG

[ADMIN] Muhammad Afdal
  Username: muhammad.afdal
  Password: hI9jK2lM

[USER]  Aisyah Putri Maharani
  Username: aisyah.putri
  Password: nO7pQ4rS
```

## Resetting Credentials

If you need to reset all credentials:

1. **WARNING**: This will DELETE all existing users and their data

2. Delete all users from Supabase:
   ```sql
   TRUNCATE TABLE users CASCADE;
   ```

3. Run seed again:
   ```bash
   npm run seed
   ```

4. New random passwords will be generated

## Distributing Credentials to Students

### Option 1: Email
Send individual emails with credentials to each student.

### Option 2: Printed Cards
Print credentials on small cards and hand them out.

### Option 3: Secure Document
Create a password-protected spreadsheet with all credentials and share only with class representatives.

### Example Distribution Email Template

```
Subject: One Last Note - Your Login Credentials

Hi [Name],

Here are your login credentials for the One Last Note platform:

Username: [username]
Password: [password]

Please login at: https://yourdomain.com

Keep these credentials safe. You will need them to send and receive messages from your classmates.

Important: You must send messages to ALL 35 classmates before you can read messages sent to you.

Best regards,
Class Admin
```

## Security Best Practices

1. **Don't Share Passwords**: Each student should keep their password private
2. **Use HTTPS**: Always access the site via HTTPS in production
3. **Logout After Use**: Remind students to logout on shared computers
4. **Secure Storage**: Store the master credentials list in a secure, encrypted location
5. **Limited Access**: Only admins should have access to all credentials

## Admin Responsibilities

As an admin, you can:
- View all messages (but NOT see who sent them)
- Filter messages by recipient
- Monitor platform usage

You CANNOT:
- See who sent any message
- Edit or delete messages
- Change the unlock status manually
- Access other users' accounts

## Troubleshooting Login Issues

If a student can't login:

1. Verify they're using the correct username (all lowercase, with dot)
2. Check for typos in the password
3. Confirm the account exists in Supabase dashboard
4. Check if they're using the right URL
5. Clear browser cache and cookies

If all else fails, you may need to reset their password directly in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Table Editor > users
3. Find the user by username
4. Generate new password hash:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('newpassword', 10))"
   ```
5. Update the password field with the hash
6. Send new password to student
