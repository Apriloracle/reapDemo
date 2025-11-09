// === MCP "server" ===
export const tools = {
  getLocalRewards: () => {
    return JSON.parse(localStorage.getItem("rewards") || "[]");
  },
  addReward: (params) => {
    const rewards = JSON.parse(localStorage.getItem("rewards") || "[]");
    rewards.push(params);
    localStorage.setItem("rewards", JSON.stringify(rewards));
    return { ok: true };
  },
  listTools: () => {
    return Object.keys(tools);
  },
};

export function registerTool(name, func) {
  tools[name] = func;
}

// === MCP "client" ===
export async function invoke(tool, params) {
  if (!tools[tool]) throw new Error("Unknown tool: " + tool);
  return tools[tool](params);
}
