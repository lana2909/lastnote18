
import React from 'react';

export const metadata = {
  title: 'Claim Your Account - One Last Note',
  description: 'Securely claim your account credentials',
};

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      {/* Background Stars (using global CSS classes if available, or just ignore for simplicity) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
      </div>
      
      <main className="relative z-10 w-full max-w-md">
        {children}
      </main>
      
      <footer className="mt-8 text-center text-muted-foreground text-sm relative z-10">
        <p>© {new Date().getFullYear()} One Last Note. All rights reserved.</p>
      </footer>
    </div>
  );
}
