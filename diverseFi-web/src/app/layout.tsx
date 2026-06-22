import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '../components/Providers';
import { ThemeProvider } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import { Toaster } from 'react-hot-toast';
import QueryProvider from "@/providers/QueryProvider";

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
  description: 'DiverseFi Dashboard Application',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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