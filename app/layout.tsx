import './globals.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Analytics } from "@vercel/analytics/react";

const montserrat = Montserrat({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sapphire Review Platform',
  description: 'Blockchain-Based Tamper-Resistant Review Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        suppressHydrationWarning 
        className={`${montserrat.className} bg-[#07111F] text-slate-50 min-h-screen flex flex-col antialiased selection:bg-blue-500/30`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}