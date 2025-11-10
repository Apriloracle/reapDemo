// app/x402/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const x402spec = {
    "x402Version": 1,
    "accepts": [
      {
        "scheme": "exact",
        "network": "base",
        "maxAmountRequired": "0.001",
        "resource": "https://reap.deals/x402",
        "asset": "USDC",
        "description": "Product search across 60M+ products",
        "payTo": "0x31ab637bd325b4bf5018b39dd155681d03348189",
        "mimeType": "application/json",
        "maxTimeoutSeconds": 60
      }
    ],
    "meta": {
      "name": "Product Search - 60M Products",
      "description": "Real-time shopping search with deal aggregation for AI agents.",
      "keywords": ["shopping", "deals", "price-comparison"],
      "version": "1.0.0"
    }
  };

  return new NextResponse(
    JSON.stringify(x402spec),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
        // Add more custom headers if needed
      },
    }
  );
}

