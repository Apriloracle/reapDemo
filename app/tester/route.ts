{
  "x402Version": 1,
  "instructions": {
    "human": "Payment required. You can pay on Base or Celo. After paying, retry this POST request with the 'X-Payment-Proof' header. You MUST include the 'query' field in the JSON body.",
    "machine_readable": {
      "required_headers": ["X-Payment-Proof", "X-Paying-Agent"],
      "required_body_fields": ["query"]
    }
  },
  "sponsorship": {
    "available": false,
    "message": "Low on funds? Retry request with header 'X-Request-Sponsor: true' to apply for a free query.",
    "conditions": "One free query per agent address per day."
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "base",
      "chainId": 8453,
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "maxAmountRequired": "10000",
      "resource": "reap-ai-v1",
      "description": "Get personalized product search results (Base Settlement).",
      "mimeType": "application/json",
      "payTo": "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248",
      "maxTimeoutSeconds": 180,
      "outputSchema": {
        "input": {
          "type": "http",
          "method": "POST",
          "bodyType": "json",
          "bodyFields": {
            "query": {
              "type": "string",
              "required": true,
              "description": "Product name or keyword to search for."
            }
          }
        },
        "output": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "asin": { "type": "string" },
              "name": { "type": "string" },
              "price": { "type": "number" },
              "priceDisplay": { "type": "string" },
              "rating": { "type": "number" },
              "ratingCount": { "type": "number" },
              "source": { "type": "string" },
              "imageUrl": { "type": "string" },
              "link": { "type": "string" },
              "valueScore": { "type": "number" },
              "deal": { "type": "string" }
            }
          }
        }
      },
      "extra": {
        "provider": "REAP",
        "category": "discovery",
        "version": "2.0.0",
        "source": "agent-worker"
      }
    },
    {
      "scheme": "exact",
      "network": "celo",
      "chainId": 42220,
      "asset": "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      "maxAmountRequired": "10000",
      "resource": "reap-ai-v1",
      "description": "Get personalized product search results (Celo Settlement).",
      "mimeType": "application/json",
      "payTo": "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248",
      "maxTimeoutSeconds": 180,
      "outputSchema": {
        "input": {
          "type": "http",
          "method": "POST",
          "bodyType": "json",
          "bodyFields": {
            "query": {
              "type": "string",
              "required": true,
              "description": "Product name or keyword to search for."
            }
          }
        },
        "output": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "asin": { "type": "string" },
              "name": { "type": "string" },
              "price": { "type": "number" },
              "priceDisplay": { "type": "string" },
              "rating": { "type": "number" },
              "ratingCount": { "type": "number" },
              "source": { "type": "string" },
              "imageUrl": { "type": "string" },
              "link": { "type": "string" },
              "valueScore": { "type": "number" },
              "deal": { "type": "string" }
            }
          }
        }
      },
      "extra": {
        "provider": "REAP",
        "category": "discovery",
        "version": "2.0.0",
        "source": "agent-worker"
      }
    }
  ],
  "meta": {
    "name": "Personalized Discovery Search",
    "description": "Real-time, personalized product search",
    "keywords": ["shopping", "deals", "price", "search", "personalized", "discovery"],
    "version": "2.0.0"
  }
}
