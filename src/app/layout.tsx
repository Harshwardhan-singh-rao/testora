import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Testora — Remote Assessment & Examination Platform',
  description: 'Cheat-resistant assessment platform for technical recruitment and examinations, featuring timed sessions, integrity telemetry, auto-scoring, and AI rubric evaluation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Testora. Cheat-Resistant Assessment Platform.</p>
            <p className="text-slate-400">Server-Authoritative Timing • Dynamic Watermarking • Integrity Telemetry</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
