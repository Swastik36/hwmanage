import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Homework Manager - Stay Organized & Track Deadlines',
  description: 'A premium, modern dashboard to organize, prioritize, and track your homework assignments and school subjects.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-50">
        <Header />
        {children}
      </body>
    </html>
  );
}
