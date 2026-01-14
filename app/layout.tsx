import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { Metadata } from 'next';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'JapaHub - Connect, Share, Succeed',
  description: 'The community platform for bridging cultures and finding resources securely.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen w-full bg-background font-sans antialiased pb-16 md:pb-0'
        )}
      >
        <FirebaseClientProvider>
          <ClientLayout>{children}</ClientLayout>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
