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
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

function MyApp({ Component, pageProps }: AppProps) {
  // Default styles that can be overridden by your app
  require('@solana/wallet-adapter-react-ui/styles.css');
  
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC_URL!;

  const wallets = useMemo(
      () => [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
      ],
      [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Web3Provider>
            <SubdocumentProvider>
              <AppRouter>
                <Component {...pageProps} />
              </AppRouter>
            </SubdocumentProvider>
          </Web3Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp

