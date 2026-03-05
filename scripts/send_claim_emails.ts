
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SENDER_EMAIL = process.env.SENDER_EMAIL || SMTP_USER;

if (!SMTP_USER || !SMTP_PASS) {
  console.error('Error: SMTP credentials missing in .env');
  console.log('Please add SMTP_USER and SMTP_PASS to your .env file.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function sendEmails() {
  console.log('Starting Email Blast...');

  const claimsPath = path.resolve(__dirname, '../claims_data.json');
  if (!fs.existsSync(claimsPath)) {
    console.error('claims_data.json not found. Run setup_claims.ts first.');
    return;
  }

  const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'));
  console.log(`Found ${claims.length} recipients.`);

  let sentCount = 0;
  let errorCount = 0;

  for (const claim of claims) {
    const { name, email, link } = claim;

    console.log(`Sending to ${name} (${email})...`);

    try {
      await transporter.sendMail({
        from: `"One Last Note" <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Claim Your Account - One Last Note',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Halo, ${name}!</h2>
            <p>Akun Anda untuk website <strong>One Last Note</strong> sudah siap.</p>
            <p>Silakan klik tombol di bawah ini untuk mengambil Username dan Password Anda secara aman.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ambil Akun Saya
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>PENTING:</strong> Link ini hanya bisa digunakan <strong>SATU KALI</strong>. 
              Segera simpan username dan password Anda setelah terbuka.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Jika tombol tidak berfungsi, salin link berikut ke browser Anda:<br>
              ${link}
            </p>
          </div>
        `,
      });

      console.log('  Sent successfully!');
      sentCount++;
      
      // Add delay to avoid rate limits (e.g. 1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`  Failed to send to ${email}:`, error.message);
      errorCount++;
    }
  }

  console.log('\nEmail Blast Completed!');
  console.log(`Sent: ${sentCount}`);
  console.log(`Errors: ${errorCount}`);
}

sendEmails().catch(console.error);
