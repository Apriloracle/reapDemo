"use client";
import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { useCrayonShoppingStore } from '../hooks/useCrayonShoppingStore';

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
    shoppingContext.addSearchHistory(lastUserMessage.context);
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

  return (
    <div style={{ height: 'calc(100vh - 60px)', paddingBottom: '60px' }}>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Web3 Shopping Agent</h1>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="text-gray-600">
            Cart: <strong>{Object.keys(shoppingStore.cart).length}</strong>
          </div>
          <div className="text-gray-600">
            Wishlist: <strong>{Object.keys(shoppingStore.wishlist).length}</strong>
          </div>
          <button
            onClick={() => {
              if (!shoppingStore.walletAddress) {
                shoppingStore.connectWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
              }
            }}
            className={`px-3 py-1 rounded text-xs font-medium ${
              shoppingStore.walletAddress 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {typeof shoppingStore.walletAddress === 'string'
              ? `${shoppingStore.walletAddress.slice(0, 6)}...${shoppingStore.walletAddress.slice(-4)}`
              : 'Connect Wallet'}
          </button>
        </div>
      </div>

      <CrayonChat 
        processMessage={processMessageWithContext}
      />
    </div>
  );
}
