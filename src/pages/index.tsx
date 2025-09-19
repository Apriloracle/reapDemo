'use client';

import dynamic from 'next/dynamic'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

const TelegramMiniApp = dynamic(
  () => import('@/components/TelegramMiniApp'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 bg-gray-100">
      <WebSocketProvider>
        <TelegramMiniApp />
      </WebSocketProvider>
    </main>
  )
}
