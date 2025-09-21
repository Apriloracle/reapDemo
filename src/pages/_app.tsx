'use client';

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Web3Provider } from '@/components/Web3Provider'
import { SubdocumentProvider } from '@/contexts/SubdocumentContext'
import AppRouter from '@/components/AppRouter';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <SubdocumentProvider>
        <AppRouter>
          <Component {...pageProps} />
        </AppRouter>
      </SubdocumentProvider>
    </Web3Provider>
  )
}

export default MyApp
