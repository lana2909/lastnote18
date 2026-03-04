
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import SessionProvider from '@/components/providers/SessionProvider';
import { ClassThemeProvider } from '@/components/providers/ClassThemeProvider';
import { Toaster } from '@/components/ui/toaster';

// Configure fonts with fallback and adjust loading
// If fetch fails during build on restricted networks, we can use a system font stack
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: false // Disable fallback adjustment to prevent some build errors
});

const orbitron = Orbitron({ 
  subsets: ['latin'], 
  variable: '--font-orbitron',
  display: 'swap',
  adjustFontFallback: false
});

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
      <body className={`${inter.variable} ${orbitron.variable} font-sans`}>
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
