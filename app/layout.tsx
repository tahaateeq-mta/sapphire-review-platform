import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Sapphire Review Platform",
  description: "Blockchain-Based Tamper-Resistant Review Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${poppins.variable} ${poppins.className} min-h-screen overflow-x-hidden bg-[#07111F] text-slate-50 antialiased selection:bg-blue-500/30`}
      >
        <AuthProvider>
          <Navbar />

          <main className="min-h-screen w-full overflow-x-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
            {children}
          </main>

          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}