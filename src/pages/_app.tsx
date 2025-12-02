'use client';

import '../lib/mcp-initializer';
import '../lib/dynamic-mcp-initializer'; // Initialize the dynamic MCP server
import { mcpToolManager } from '../lib/McpToolManager'; // Initialize the tool manager
import '@/styles/globals.css'
import '@/styles/Wallet.css'
import type { AppProps } from 'next/app'
import { Web3Provider } from '@/components/Web3Provider'
import { SubdocumentProvider } from '@/contexts/SubdocumentContext'
import AppRouter from '@/components/AppRouter';
import React from 'react';
import dynamic from 'next/dynamic';

const WalletContextProvider = dynamic(
  () => import('../components/WalletContextProvider').then((mod) => mod.WalletContextProvider),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletContextProvider>
      <Web3Provider>
        <SubdocumentProvider>
          <AppRouter>
            <Component {...pageProps} />
          </AppRouter>
        </SubdocumentProvider>
      </Web3Provider>
    </WalletContextProvider>
  )
}

export default MyApp


