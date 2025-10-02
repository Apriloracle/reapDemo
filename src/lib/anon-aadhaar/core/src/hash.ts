// --- START OF FILE hash.ts (Corrected) ---

import { BigNumber } from '@ethersproject/bignumber'
import { BytesLike, Hexable, zeroPad } from '@ethersproject/bytes'
import { keccak256 } from '@ethersproject/keccak256' // <-- FIX: Corrected the typo here

/**
 * Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
 * @param message The message to be hashed.
 * @returns The message digest.
 */
export function hash(
  message: BytesLike | Hexable | number | bigint
): string {
  message = BigNumber.from(message).toTwos(256).toHexString()

  message = zeroPad(message, 32)

  // FIX: And corrected the typo here as well
  return (BigInt(keccak256(message)) >> BigInt(3)).toString()
}
