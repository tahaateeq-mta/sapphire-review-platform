import './globals.css';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/components/providers/AuthProvider';
<<<<<<< HEAD
import { Analytics } from "@vercel/analytics/react";

=======
// 1. Import the Analytics component
import { Analytics } from "@vercel/analytics/react";

// Load Montserrat font with swap display for better performance
>>>>>>> e1faa74 (Merge branch 'main' and finalize layout with Analytics)
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
<<<<<<< HEAD
=======
      {/* suppressHydrationWarning prevents issues with browser extensions like Grammarly */}
>>>>>>> e1faa74 (Merge branch 'main' and finalize layout with Analytics)
      <body 
        suppressHydrationWarning 
        className={`${montserrat.className} bg-[#07111F] text-slate-50 min-h-screen flex flex-col antialiased selection:bg-blue-500/30`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
<<<<<<< HEAD
          {/* 2. Place Analytics here, inside the body but outside the main content */}
=======
>>>>>>> e1faa74 (Merge branch 'main' and finalize layout with Analytics)
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
