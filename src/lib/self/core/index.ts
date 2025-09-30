import { SelfBackendVerifier } from './src/SelfBackendVerifier.ts';
import { countryCodes } from '../common/src/constants/constants.ts';
import { getUniversalLink } from '../common/src/utils/appType.ts';
import { countries } from '../common/src/constants/countries.ts';
import type { AttestationId, VerificationResult, VerificationConfig } from './src/types/types.ts';
import type { IConfigStorage } from './src/store/interface.ts';
import { DefaultConfigStore } from './src/store/DefaultConfigStore.ts';
import { AllIds } from './src/utils/constants.ts';
import { InMemoryConfigStore } from './src/store/InMemoryConfigStore.ts';
import {
  ConfigMismatchError,
  ConfigMismatch,
  RegistryContractError,
  VerifierContractError,
  ProofError,
} from './src/errors/index.ts';

export {
  SelfBackendVerifier,
  countryCodes,
  getUniversalLink,
  countries,
  AttestationId,
  IConfigStorage,
  DefaultConfigStore,
  InMemoryConfigStore,
  AllIds,
  VerificationResult,
  VerificationConfig,
  ConfigMismatchError,
  ConfigMismatch,
  RegistryContractError,
  VerifierContractError,
  ProofError,
};
