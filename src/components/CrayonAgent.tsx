"use client";
import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { useCrayonShoppingStore } from '../hooks/useCrayonShoppingStore';
import { ShoppingCart, Wallet, Package, TrendingDown, Search } from 'lucide-react';
import styles from '../styles/agentStyle.module.css'; // Import the CSS module

const processMessage = async ({
  threadId,
  messages,
  abortController,
  shoppingContext
}: {
  threadId: string;
  messages: Message[];
  abortController: AbortController;
  shoppingContext: any;
}) => {
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === 'user') {
    const messageContext = (lastUserMessage as any).context;
    if (messageContext && typeof messageContext === 'string') {
      shoppingContext.addSearchHistory(messageContext);
    }
  }

  const contextEnrichedPayload = {
    threadId,
    messages,
    context: {
      cart: shoppingContext.cart,
      wishlist: shoppingContext.wishlist,
      recentSearches: shoppingContext.searchHistory,
      walletAddress: shoppingContext.walletAddress,
    },
    orchestrationConfig: {
      chains: ["ethereum", "polygon", "base", "arbitrum"],
      enableWeb3: true,
      walletRequired: false,
      features: {
        priceComparison: true,
        multiChainSearch: true,
        gasEstimation: true
      }
    }
  };

  const response = await fetch("/api/crayon/chat", {
    method: "POST",
    body: JSON.stringify(contextEnrichedPayload),
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal: abortController.signal,
  });

  return response;
};

export default function CrayonAgent() {
  const shoppingStore = useCrayonShoppingStore();

  const processMessageWithContext = async (params: any) => {
    return processMessage({
      ...params,
      shoppingContext: shoppingStore
    });
  };

  const formatWalletAddress = (address: string | number | boolean | null | undefined): string => {
    if (typeof address === 'string' && address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return 'Connect Wallet';
  };

  const getRecentSearch = (): string => {
    const history = shoppingStore.searchHistory;
    if (Array.isArray(history) && history.length > 0) {
      const recent = history[0];
      if (typeof recent === 'object' && recent !== null && 'query' in recent) {
        return String(recent.query);
      }
      return String(recent);
    }
    return 'None';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ShoppingCart className={styles.icon} />
          <h1 className={styles.title}>Your Shopping Agent</h1>
          <span className={styles.badge}>P</span>
        </div>
        
        <div className={styles.headerRight}>
          <button
            onClick={() => {
              if (!shoppingStore.walletAddress) {
                shoppingStore.connectWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
              }
            }}
            className={`${styles.walletButton} ${
              shoppingStore.walletAddress ? styles.connected : styles.disconnected
            }`}
          >
            <Wallet className={styles.walletIcon} />
            {formatWalletAddress(shoppingStore.walletAddress)}
          </button>
          
          <div className={styles.cartInfo}>
            <ShoppingCart className={styles.cartIcon} />
            <span className={styles.cartCount}>
              {Object.keys(shoppingStore.cart).length} items
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Package className={`${styles.statIcon} ${styles.blue}`} />
          <span className={styles.statText}>
            Wishlist: <strong className={styles.statValue}>{Object.keys(shoppingStore.wishlist).length}</strong>
          </span>
        </div>
        <div className={styles.statItem}>
          <Search className={`${styles.statIcon} ${styles.purple}`} />
          <span className={styles.statText}>
            Recent: {getRecentSearch()}
          </span>
        </div>
        <div className={styles.statItem}>
          <TrendingDown className={`${styles.statIcon} ${styles.green}`} />
          <span className={styles.statText}>
            Gas: <strong className={styles.statValue}></strong>
          </span>
        </div>
      </div>

      {/* Crayon Chat Component */}
      <div className={styles.chatContainer}>
        <CrayonChat processMessage={processMessageWithContext} />
      </div>
    </div>
  );
}
