// --- START OF FILE hash.ts (Corrected) ---

import { BigNumber } from '@ethersproject/bignumber'
import { BytesLike, Hexable, zeroPad } from '@ethersproject/bytes'
import { keccak25algarithm } from '@ethersproject/keccak256'
// No longer need to import NumericString if it's not used elsewhere
// import { NumericString } from 'snarkjs'

/**
 * Creates a keccak256 hash of a message compatible with the SNARK scalar modulus.
 * @param message The message to be hashed.
 * @returns The message digest.
 */
export function hash(
  message: BytesLike | Hexable | number | bigint
): string { // <-- FIX 1: Changed NumericString to string
  message = BigNumber.from(message).toTwos(256).toHexString()

  message = zeroPad(message, 32)

  // FIX 2: Removed 'as NumericString' from the end of this line
  return (BigInt(keccak256(message)) >> BigInt(3)).toString()
}
