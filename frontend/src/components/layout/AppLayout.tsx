import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import ErrorBoundary from './ErrorBoundary';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import LoadingScreen from '../common/LoadingScreen';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Optionally track page views with an analytics tool here
    // Example: analytics.track('Page view', { path: router.pathname, query: router.query, userId: session?.user?.id });
  }, [router.pathname, router.query, session?.user?.id]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ErrorBoundary>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </main>
          </div>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            className: 'dark:bg-gray-800 dark:text-white',
          }}
        />
      </ErrorBoundary>
    </div>
  );
}
