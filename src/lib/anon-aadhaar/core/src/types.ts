// --- START OF FILE types.ts (Corrected) ---

import {
  NumberArgument,
  StringArrayArgument,
  StringArgument,
} from '@pcd/pcd-types'
// V-- FIX: Removed Groth16Proof from this import
import {} from 'snarkjs'

export type BigNumberish = string | bigint

// FIX: Define the interface for Groth16Proof here. This is the best place for it.
export interface Groth16Proof {
  pi_a: [string, string, string]
  pi_b: [[string, string], [string, string], [string, string]]
  pi_c: [string, string, string]
  protocol: string
  curve: string
}

export const AnonAadhaarTypeName = 'anon-aadhaar'

export enum ArtifactsOrigin {
  'server',
  'local',
  'chunked',
}

/**
 * @dev all the arguments needed to initialize the Core package.
 * You can find these URLs in ./constants.ts
 */
export interface InitArgs {
  wasmURL: string
  zkeyURL: string
  vkeyURL: string
  artifactsOrigin: ArtifactsOrigin
}

/**
 * @dev claim that you have a document signed by pubKey.
 */
export type AnonAadhaarClaim = {
  pubKey: string[]
  signalHash: string
  ageAbove18: boolean | null
  gender: string | null
  pincode: string | null
  state: string | null
}

/**
 * @dev proof of a correct claim
 */
export type AnonAadhaarProof = {
  // This will now correctly refer to the interface defined above
  groth16Proof: Groth16Proof
  pubkeyHash: string
  timestamp: string
  nullifierSeed: string
  nullifier: string
  signalHash: string
  ageAbove18: string
  gender: string
  pincode: string
  state: string
}

/**
 * @dev Arguments needed to compute the witness.
 */
export type AnonAadhaarArgs = {
  qrDataPadded: StringArrayArgument // private
  qrDataPaddedLength: NumberArgument // private
  delimiterIndices: StringArrayArgument
  signature: StringArrayArgument // private
  pubKey: StringArrayArgument // public
  nullifierSeed: StringArgument // private
  signalHash: StringArgument // public
  revealAgeAbove18: NumberArgument
  revealGender: NumberArgument
  revealPinCode: NumberArgument
  revealState: NumberArgument
}

export type PackedGroth16Proof = [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish
]

export enum ProverState {
  Initializing = 'initializing',
  FetchingWasm = 'fetching-wasm',
  FetchingZkey = 'fetching-zkey',
  Proving = 'proving',
  Completed = 'completed',
  Error = 'error',
}

export type FieldsToReveal = {
  revealAgeAbove18: boolean
  revealGender: boolean
  revealPinCode: boolean
  revealState: boolean
}

export const fieldsLabel: { key: keyof FieldsToReveal; label: string }[] = [
  { key: 'revealAgeAbove18', label: 'Age Above 18' },
  { key: 'revealGender', label: 'Gender' },
  { key: 'revealPinCode', label: 'PIN Code' },
  { key: 'revealState', label: 'State' },
]

export type FieldKey =
  | 'revealAgeAbove18'
  | 'revealGender'
  | 'revealPinCode'
  | 'revealState'

export type FieldsToRevealArray = FieldKey[]
