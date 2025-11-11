// app/x402/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const x402spec = {
    "x402Version": 1,
    "type": "http",
    "resource": "https://reap.deals/x402",
    "lastUpdated": new Date().toISOString(),
    "accepts": [
      {
        "scheme": "exact",
        "network": "base",
        "maxAmountRequired": "2500000",
        "resource": "https://reap.deals/x402",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "description": "General e-commerce service information",
        "payTo": "0x31ab637bd325b4bf5018b39dd155681d03348189",
        "mimeType": "application/json",
        "maxTimeoutSeconds": 60
      },
      {
        "scheme": "exact",
        "network": "base",
        "maxAmountRequired": "2500000",
        "resource": "https://reap.deals/api/search",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "description": "Product search across 60M+ products",
        "payTo": "0x31ab637bd325b4bf5018b39dd155681d03348189",
        "mimeType": "application/json",
        "maxTimeoutSeconds": 60,
        "outputSchema": {
          "input": {
            "type": "http",
            "method": "POST",
            "bodyType": "json",
            "bodyFields": {
              "query": {
                "type": "string",
                "required": true,
                "description": "The product search query"
              }
            }
          }
        }
      },
      {
        "scheme": "exact",
        "network": "solana",
        "maxAmountRequired": "2500000",
        "resource": "https://reap.deals/api/search",
        "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
        "description": "Product search across 60M+ products (Solana)",
        "payTo": "FPeUBp4FBEweSdfUuRPBfa6kuRTd6DjvkLXZS3MKp27h", 
        "facilitator": "https://reap.deals/verify",
        "mimeType": "application/json",
        "maxTimeoutSeconds": 60,
        "outputSchema": {
          "input": {
            "type": "http",
            "method": "POST",
            "bodyType": "json",
            "bodyFields": {
              "query": {
                "type": "string",
                "required": true,
                "description": "The product search query"
              }
            }
          }
        }
      }
    ],
    "metadata": {
      "name": "Product Search - 60M Products",
      "description": "Real-time shopping search with deal aggregation for AI agents.",
      "keywords": ["shopping", "deals", "price-comparison"],
      "version": "1.0.0"
    }
  };

  return NextResponse.json(x402spec, {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      // Add more custom headers if needed
    },
  });
}
