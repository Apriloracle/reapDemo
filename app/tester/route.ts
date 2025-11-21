const MANIFEST = {
  x402Version: 1,

  // 1. INSTRUCTIONS (fully preserved)
  instructions: {
    human: "Payment required. You can pay on Base or Celo. After paying, retry this POST request with the 'X-Payment-Proof' header. You MUST include the 'query' field in the JSON body.",
    machine_readable: {
      required_headers: ["X-Payment-Proof", "X-Paying-Agent"],
      required_body_fields: ["query"]
    }
  },

  // 2. SPONSORSHIP (fully preserved)
  sponsorship: {
    available: true,
    message: "Low on funds? Retry request with header 'X-Request-Sponsor: true' to apply for a free query.",
    conditions: "One free query per agent address per day."
  },

  // 3. ACCEPTS (REWRITTEN to match template — but all your content intact)
  accepts: [
    {
      scheme: "exact",
      network: "base",
      chainId: 8453,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      maxAmountRequired: "10000",
      resource: "reap-ai-v1",
      description: "Get personalized product search results (Base Settlement).",
      mimeType: "application/json",
      payTo: "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248",

      // NEW (required by template)
      maxTimeoutSeconds: 180,

      // schema unchanged
      outputSchema: getSchemaDefinition(),

      // NEW (required by template)
      extra: {
        provider: "REAP",
        category: "discovery",
        version: "2.0.0",
        source: "agent-worker"
      }
    },
    {
      scheme: "exact",
      network: "celo",
      chainId: 42220,
      asset: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      maxAmountRequired: "10000",
      resource: "reap-ai-v1",
      description: "Get personalized product search results (Celo Settlement).",
      mimeType: "application/json",
      payTo: "0xC1a9a0f9B0e4BC40AF353D108227d40B52Eb1248",

      // NEW
      maxTimeoutSeconds: 180,

      outputSchema: getSchemaDefinition(),

      // NEW
      extra: {
        provider: "REAP",
        category: "discovery",
        version: "2.0.0",
        source: "agent-worker"
      }
    }
  ],

  // META unchanged
  meta: {
    name: "Personalized Discovery Search",
    description: "Real-time, personalized product search",
    keywords: ["shopping", "deals", "price", "search", "personalized", "discovery"],
    version: "2.0.0"
  }
};

