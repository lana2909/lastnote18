
import './globals.css';
import type { Metadata } from 'next';
// import { Inter, Orbitron } from 'next/font/google'; // Disabled to prevent build timeout
import SessionProvider from '@/components/providers/SessionProvider';
import { ClassThemeProvider } from '@/components/providers/ClassThemeProvider';
import { Toaster } from '@/components/ui/toaster';

// Fallback fonts
// const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', adjustFontFallback: false });
// const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron', display: 'swap', adjustFontFallback: false });

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
      {/* Removed font variables to fix build */}
      <body className={`font-sans antialiased`}>
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
