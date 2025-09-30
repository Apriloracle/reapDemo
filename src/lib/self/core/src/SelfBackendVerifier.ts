import { ethers, JsonRpcProvider } from 'ethers';
import { hashEndpointWithScope } from '../../common/src/utils/scope.ts';
import { discloseIndices } from './utils/constants.ts';
import { formatRevealedDataPacked } from './utils/id.ts';
import { AttestationId, VcAndDiscloseProof, VerificationConfig } from './types/types.ts';
import { Country3LetterCode } from '../../common/src/constants/countries.ts';
import { calculateUserIdentifierHash } from './utils/hash.ts';
import { castToUserIdentifier, UserIdType } from '../../common/src/utils/circuits/uuid.ts';
import {
  ConfigMismatch,
  ConfigMismatchError,
  RegistryContractError,
  VerifierContractError,
} from './errors/index.ts';
import { IConfigStorage } from './store/interface.ts';
import { unpackForbiddenCountriesList } from './utils/utils.ts';
import { BigNumberish } from 'ethers';

const CELO_MAINNET_RPC_URL = 'https://forno.celo.org';
const CELO_TESTNET_RPC_URL = 'https://forno.celo-sepolia.celo-testnet.org';

export class SelfBackendVerifier {
  protected scope: string;
  protected configStorage: IConfigStorage;
  protected provider: JsonRpcProvider;
  protected allowedIds: Map<AttestationId, boolean>;
  protected userIdentifierType: UserIdType;

  constructor(
    scope: string,
    endpoint: string,
    mockPassport: boolean = false,
    allowedIds: Map<AttestationId, boolean>,
    configStorage: IConfigStorage,
    userIdentifierType: UserIdType
  ) {
    const rpcUrl = mockPassport ? CELO_TESTNET_RPC_URL : CELO_MAINNET_RPC_URL;
    const provider = new JsonRpcProvider(rpcUrl);
    this.provider = provider;
    this.scope = hashEndpointWithScope(endpoint, scope);
    this.allowedIds = allowedIds;
    this.configStorage = configStorage;
    this.userIdentifierType = userIdentifierType;
  }

  public async verify(
    attestationId: AttestationId,
    proof: VcAndDiscloseProof,
    pubSignals: BigNumberish[],
    userContextData: string
  ) {
    //check if attestation id is allowed
    const allowedId = this.allowedIds.get(attestationId);
    let issues: Array<{ type: ConfigMismatch; message: string }> = [];
    if (!allowedId) {
      issues.push({
        type: ConfigMismatch.InvalidId,
        message: 'Attestation ID is not allowed, received: ' + attestationId,
      });
    }

    const publicSignals = pubSignals
      .map(String)
      .map((x) => (/[a-f]/g.test(x) && x.length > 0 ? '0x' + x : x));
    //check if user context hash matches
    const userContextHashInCircuit = BigInt(
      publicSignals[discloseIndices[attestationId].userIdentifierIndex]
    );
    const userContextHash = BigInt(
      calculateUserIdentifierHash(Buffer.from(userContextData, 'hex'))
    );

    if (userContextHashInCircuit !== userContextHash) {
      issues.push({
        type: ConfigMismatch.InvalidUserContextHash,
        message:
          'User context hash does not match with the one in the circuit\nCircuit: ' +
          userContextHashInCircuit +
          '\nUser context hash: ' +
          userContextHash,
      });
    }

    //check if scope matches
    const isValidScope = this.scope === publicSignals[discloseIndices[attestationId].scopeIndex];
    if (!isValidScope) {
      issues.push({
        type: ConfigMismatch.InvalidScope,
        message:
          'Scope does not match with the one in the circuit\nCircuit: ' +
          publicSignals[discloseIndices[attestationId].scopeIndex] +
          '\nScope: ' +
          this.scope,
      });
    }

    //check if attestation id matches
    const isValidAttestationId =
      attestationId.toString() === publicSignals[discloseIndices[attestationId].attestationIdIndex];
    if (!isValidAttestationId) {
      issues.push({
        type: ConfigMismatch.InvalidAttestationId,
        message: 'Attestation ID does not match with the one in the circuit',
      });
    }

    const userIdentifier = castToUserIdentifier(
      BigInt('0x' + userContextData.slice(64, 128)),
      this.userIdentifierType
    );
    const userDefinedData = userContextData.slice(128);
    const configId = await this.configStorage.getActionId(userIdentifier, userDefinedData);
    if (!configId) {
      issues.push({
        type: ConfigMismatch.ConfigNotFound,
        message: 'Config Id not found',
      });
    }

    let verificationConfig: VerificationConfig | null;
    try {
      verificationConfig = await this.configStorage.getConfig(configId);
    } catch (error) {
      issues.push({
        type: ConfigMismatch.ConfigNotFound,
        message: `Config not found for ${configId}`,
      });
    } finally {
      if (!verificationConfig) {
        issues.push({
          type: ConfigMismatch.ConfigNotFound,
          message: `Config not found for ${configId}`,
        });
        throw new ConfigMismatchError(issues);
      }
    }

    //check if forbidden countries list matches
    const forbiddenCountriesList: string[] = unpackForbiddenCountriesList(
      [0, 1, 2, 3].map(
        (x) => publicSignals[discloseIndices[attestationId].forbiddenCountriesListPackedIndex + x]
      )
    );
    const forbiddenCountriesListVerificationConfig = verificationConfig.excludedCountries;

    const isForbiddenCountryListValid = forbiddenCountriesListVerificationConfig.every((country) =>
      forbiddenCountriesList.includes(country as Country3LetterCode)
    );
    if (!isForbiddenCountryListValid) {
      issues.push({
        type: ConfigMismatch.InvalidForbiddenCountriesList,
        message:
          'Forbidden countries list in config does not match with the one in the circuit\nCircuit: ' +
          forbiddenCountriesList.join(', ') +
          '\nConfig: ' +
          forbiddenCountriesListVerificationConfig.join(', '),
      });
    }

    const genericDiscloseOutput = formatRevealedDataPacked(attestationId, publicSignals);
    //check if minimum age matches
    const isMinimumAgeValid =
      verificationConfig.minimumAge !== undefined
        ? verificationConfig.minimumAge === Number.parseInt(genericDiscloseOutput.minimumAge, 10) ||
          genericDiscloseOutput.minimumAge === '00'
        : true;
    if (!isMinimumAgeValid) {
      issues.push({
        type: ConfigMismatch.InvalidMinimumAge,
        message:
          'Minimum age in config does not match with the one in the circuit\nCircuit: ' +
          genericDiscloseOutput.minimumAge +
          '\nConfig: ' +
          verificationConfig.minimumAge,
      });
    }

    let circuitTimestampYy: number[];
    let circuitTimestampMm: number[];
    let circuitTimestampDd: number[];
    circuitTimestampYy = [
      2,
      0,
      +publicSignals[discloseIndices[attestationId].currentDateIndex],
      +publicSignals[discloseIndices[attestationId].currentDateIndex + 1],
    ];
    circuitTimestampMm = [
      +publicSignals[discloseIndices[attestationId].currentDateIndex + 2],
      +publicSignals[discloseIndices[attestationId].currentDateIndex + 3],
    ];
    circuitTimestampDd = [
      +publicSignals[discloseIndices[attestationId].currentDateIndex + 4],
      +publicSignals[discloseIndices[attestationId].currentDateIndex + 5],
    ];

    const circuitTimestamp = new Date(
      Number(circuitTimestampYy.join('')),
      Number(circuitTimestampMm.join('')) - 1,
      Number(circuitTimestampDd.join(''))
    );
    const currentTimestamp = new Date();

    //check if timestamp is in the future
    const oneDayAhead = new Date(currentTimestamp.getTime() + 24 * 60 * 60 * 1000);
    if (circuitTimestamp > oneDayAhead) {
      issues.push({
        type: ConfigMismatch.InvalidTimestamp,
        message: 'Circuit timestamp is in the future',
      });
    }

    //check if timestamp is 1 day in the past
    const circuitTimestampEOD = new Date(
      circuitTimestamp.getTime() + 23 * 60 * 60 * 1e3 + 59 * 60 * 1e3 + 59 * 1e3
    );
    const oneDayAgo = new Date(currentTimestamp.getTime() - 24 * 60 * 60 * 1000);
    if (circuitTimestampEOD < oneDayAgo) {
      issues.push({
        type: ConfigMismatch.InvalidTimestamp,
        message: 'Circuit timestamp is too old',
      });
    }

    if (!verificationConfig.ofac && genericDiscloseOutput.ofac[0]) {
      issues.push({
        type: ConfigMismatch.InvalidOfac,
        message: 'Passport number OFAC check is not allowed',
      });
    }

    if (!verificationConfig.ofac && genericDiscloseOutput.ofac[1]) {
      issues.push({
        type: ConfigMismatch.InvalidOfac,
        message: 'Name and DOB OFAC check is not allowed',
      });
    }

    if (!verificationConfig.ofac && genericDiscloseOutput.ofac[2]) {
      issues.push({
        type: ConfigMismatch.InvalidOfac,
        message: 'Name and YOB OFAC check is not allowed',
      });
    }

    if (issues.length > 0) {
      throw new ConfigMismatchError(issues);
    }

    return {
      attestationId,
      isValidDetails: {
        isValid: true,
        isMinimumAgeValid:
          verificationConfig.minimumAge !== undefined
            ? verificationConfig.minimumAge <= Number.parseInt(genericDiscloseOutput.minimumAge, 10)
            : true,
        isOfacValid:
          verificationConfig.ofac !== undefined && verificationConfig.ofac
            ? genericDiscloseOutput.ofac.every((enabled: boolean, index: number) =>
                enabled ? genericDiscloseOutput.ofac[index] : true
              )
            : true,
      },
      forbiddenCountriesList,
      discloseOutput: genericDiscloseOutput,
      userData: {
        userIdentifier,
        userDefinedData,
      },
    };
  }
}
