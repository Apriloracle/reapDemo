"use client";
import type { Message } from "@crayonai/react-core";
import { CrayonChat } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { useCrayonShoppingStore } from '../hooks/useCrayonShoppingStore';
import { ShoppingCart, Wallet, Package, TrendingDown, Search } from 'lucide-react';

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
    shoppingContext.addSearchHistory(lastUserMessage.content);
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">Web3 Shopping Agent</h1>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Powered by Firefly
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (!shoppingStore.walletAddress) {
                shoppingStore.connectWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              shoppingStore.walletAddress 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {shoppingStore.walletAddress
              ? `${shoppingStore.walletAddress.slice(0, 6)}...${shoppingStore.walletAddress.slice(-4)}`
              : 'Connect Wallet'}
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-medium">
              {Object.keys(shoppingStore.cart).length} items
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="text-gray-600">
            Wishlist: <strong>{Object.keys(shoppingStore.wishlist).length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-600" />
          <span className="text-gray-600">
            Recent: {shoppingStore.searchHistory[0] || 'None'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Gas: <strong>12 Gwei</strong></span>
        </div>
      </div>

      {/* Crayon Chat Component */}
      <div className="flex-1 overflow-hidden">
        <CrayonChat 
          processMessage={processMessageWithContext}
          initialMessages={[
            {
              role: "assistant",
              content: "👋 Welcome to your Web3 Shopping Agent! I can help you find NFTs, tokens, and products across multiple blockchains. What are you looking for today?"
            }
          ]}
        />
      </div>
    </div>
  );
}
