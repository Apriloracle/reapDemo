'use client';

// 1. Import the 'Head' component
import Head from 'next/head';

import dynamic from 'next/dynamic';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

const TelegramMiniApp = dynamic(
  () => import('@/components/TelegramMiniApp'),
  { ssr: false }
);

export default function Home() {
  return (
    // 2. Wrap your existing JSX in a fragment (<> ... </>)
    <>
      {/* 3. Add the Head component with all your metadata */}
      <Head>
        <title>Reap Deals</title>
        <meta name="description" content="Real-time shopping search with deal aggregation for AI agents." />
        
        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content="Reap" />
        <meta property="og:description" content="Real-time shopping and product search with deal aggregation for AI agents." />
        <meta property="og:image" content="https://www.reap.deals/og.png" />
        <meta property="og:url" content="https://www.reap.deals" />
        
        {/* Favicon Link */}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 4. Your existing page code remains completely unchanged. */}
      <main className="flex min-h-screen flex-col items-center justify-center p-0 bg-gray-100">
        <WebSocketProvider>
          <TelegramMiniApp />
        </WebSocketProvider>
      </main>
    </>
  );
}

