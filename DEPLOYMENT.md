# Deployment Guide - One Last Note

## Prerequisites

- Debian server with 2GB RAM
- Node.js 18+ installed
- Supabase project set up
- Domain name (optional)

## Step 1: Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Note down your:
   - Project URL
   - Anon/Public key
   - Service Role key (keep secret!)

3. The database schema has been created via migrations. If starting fresh, ensure all migrations are applied in your Supabase project.

## Step 2: Configure Environment Variables

On your server, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 3: Seed the Database

Run the seed script to create 36 users:

```bash
npm run seed
```

**IMPORTANT**: Save the generated credentials! They will be printed to the console.

## Step 4: Build the Application

```bash
npm install
npm run build
```

The standalone build will be created in `.next/standalone/`

## Step 5: Prepare Deployment Files

```bash
mkdir -p deploy
cp -r .next/standalone/* deploy/
cp -r .next/static deploy/.next/static
cp -r public deploy/public
cp .env.local deploy/
```

## Step 6: Upload to Server

```bash
scp -r deploy/* user@your-server:/var/www/one-last-note/
```

## Step 7: Set Up Systemd Service

Create `/etc/systemd/system/one-last-note.service`:

```ini
[Unit]
Description=One Last Note
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/one-last-note
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=one-last-note
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable one-last-note
sudo systemctl start one-last-note
sudo systemctl status one-last-note
```

## Step 8: Configure Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/one-last-note`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/one-last-note /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Set Up SSL with Certbot (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Step 10: Monitor the Application

View logs:
```bash
sudo journalctl -u one-last-note -f
```

Check status:
```bash
sudo systemctl status one-last-note
```

Restart if needed:
```bash
sudo systemctl restart one-last-note
```

## Performance Optimization

### Memory Settings

If you encounter memory issues on a 2GB RAM server:

```bash
# Add to /etc/systemd/system/one-last-note.service
Environment=NODE_OPTIONS="--max-old-space-size=1536"
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart one-last-note
```

### Database Connection Pooling

The connection string is already optimized with `?connection_limit=5` in the Supabase URL.

## Updating the Application

1. On your development machine, make changes and build:
```bash
npm run build
```

2. Deploy the new build:
```bash
scp -r .next/standalone/* user@server:/var/www/one-last-note/
```

3. Restart the service:
```bash
sudo systemctl restart one-last-note
```

## Troubleshooting

### Application won't start
- Check logs: `sudo journalctl -u one-last-note -f`
- Verify environment variables in `.env.local`
- Ensure Node.js version is 18+

### Database connection errors
- Verify Supabase credentials
- Check network connectivity to Supabase
- Ensure RLS policies are correctly configured

### Memory issues
- Monitor with: `free -h`
- Reduce Node.js memory limit if needed
- Consider upgrading server RAM

### Build fails
- Ensure all dependencies are installed
- Check Node.js version compatibility
- Review build output for specific errors

## Security Checklist

- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] Service role key is not exposed to client
- [ ] SSL certificate is installed
- [ ] Firewall is configured (allow 80, 443, 22 only)
- [ ] Server is updated: `sudo apt update && sudo apt upgrade`
- [ ] Non-root user is used for running the app
- [ ] Backups are configured for Supabase database

## Backup Strategy

### Database Backups (Supabase)
Supabase automatically backs up your database daily. For manual backups:

1. Go to your Supabase project dashboard
2. Navigate to Database > Backups
3. Create manual backup before major changes

### Application Files
```bash
tar -czf one-last-note-backup-$(date +%Y%m%d).tar.gz /var/www/one-last-note
```

## Support

For issues:
1. Check application logs
2. Verify Supabase dashboard for database issues
3. Review Nginx logs: `/var/log/nginx/error.log`
4. Check system resources: `htop` or `free -h`
