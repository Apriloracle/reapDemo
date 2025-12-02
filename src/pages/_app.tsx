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
import React, { useState, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

function MyApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Default styles that can be overridden by your app
  require('@solana/wallet-adapter-react-ui/styles.css');
  
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = "https://solrpc-50775725716.asia-southeast1.run.app";

  const wallets = useMemo(
      () => [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
      ],
      [network]
  );

  return (
    <>
      {isClient ? (
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
      ) : (
        <Web3Provider>
          <SubdocumentProvider>
            <AppRouter>
              <Component {...pageProps} />
            </AppRouter>
          </SubdocumentProvider>
        </Web3Provider>
      )}
    </>
  )
}

export default MyApp

