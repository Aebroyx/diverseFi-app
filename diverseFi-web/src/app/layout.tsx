import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '../components/Providers';
import { ThemeProvider } from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/providers/QueryProvider';
import { cn } from '@/lib/utils';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'DiverseFi',
  description: 'Financial dashboard application',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    title: 'DiverseFi',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          // Apply theme before paint to avoid "flash to light".
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const stored = localStorage.getItem('theme');
    const theme = stored === 'dark' || stored === 'light'
      ? stored
      : 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (_) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <Providers>
            <ThemeProvider>
              {children}
              {/* <ThemeToggle /> */}
              <Toaster
                position="top-center"
                containerStyle={{
                  top: 20,
                  left: 0,
                  right: 0,
                }}
                toastOptions={{
                  // Default options for all toasts
                  duration: 3000,
                  style: {
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    minWidth: '300px',
                    textAlign: 'center',
                  },
                  // success: {
                  //   iconTheme: {
                  //     primary: 'var(--primary)',
                  //     secondary: 'var(--background)',
                  //   },
                  // },
                }}
              />
            </ThemeProvider>
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}