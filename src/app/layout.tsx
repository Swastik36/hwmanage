import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { HomeworkProvider } from '@/context/HomeworkContext';
import { UIProvider } from '@/context/UIContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Homework Manager - Stay Organized & Track Deadlines',
  description: 'A premium, modern dashboard to organize, prioritize, and track your homework assignments and school subjects.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-50">
        <HomeworkProvider>
          <UIProvider>
            <Header />
            {children}
          </UIProvider>
        </HomeworkProvider>
      </body>
    </html>
  );
}
