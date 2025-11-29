"use client";
import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { useCrayonShoppingStore } from '../hooks/useCrayonShoppingStore';
import { ShoppingCart, Wallet, Package, TrendingDown, Search } from 'lucide-react';
import styles from '../styles/agentStyle.module.css';

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
        </div>
        
        <div className={styles.headerRight}>
          
          <div className={styles.cartInfo}>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
        
        </div>
        <div className={styles.statItem}>
        </div>
      </div>

         {/* Crayon Chat Component - Ensure it fills remaining space */}
      <div className={styles.chatContainer}>
        <CrayonChat 
          processMessage={processMessageWithContext}
        />
      </div>
    </div>
  );
}
