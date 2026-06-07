import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { HomeworkProvider } from '@/context/HomeworkContext';
import { UIProvider } from '@/context/UIContext';
import { ThemeProvider } from 'next-themes';
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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-page text-primary-text">
        <HomeworkProvider>
          <UIProvider>
            <ThemeProvider attribute="class" defaultTheme="dark">
              <Header />
              {children}
            </ThemeProvider>
          </UIProvider>
        </HomeworkProvider>
      </body>
    </html>
  );
}
