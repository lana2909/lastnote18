
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import { ClassThemeProvider } from '@/components/providers/ClassThemeProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata: Metadata = {
  title: 'One Last Note',
  description: 'A space for our final words',
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} ${inter.className}`}>
        <SessionProvider>
          <ClassThemeProvider>
            {children}
            <Toaster />
          </ClassThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
