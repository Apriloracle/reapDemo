import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, celo, celoAlfajores, base, polygon } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, sepolia, celo, celoAlfajores, base, polygon,],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
  },
})
