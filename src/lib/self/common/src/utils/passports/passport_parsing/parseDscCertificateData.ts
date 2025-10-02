import type { CertificateData } from '../../certificate_parsing/dataStructure.js';
import { parseCertificateSimple } from '../../certificate_parsing/parseCertificateSimple.js';
import { getCSCAFromSKI } from '../../csca.js';
import { brutforceSignatureAlgorithmDsc } from './brutForceDscSignature.js';
import { getCurveOrExponent } from './parsePassportData.js';

export interface DscCertificateMetaData {
  cscaFound: boolean;
  cscaHashAlgorithm: string;
  cscaSignatureAlgorithm: string;
  cscaCurveOrExponent: string;
  cscaSignatureAlgorithmBits: number;
  cscaSaltLength: number;
  csca: string;
  cscaParsed: CertificateData;
  cscaBits: number;
}

export function parseDscCertificateData(
  dscCert: CertificateData,
  skiPem: any = null
): DscCertificateMetaData {
  let csca: string | undefined,
    cscaParsed: CertificateData | undefined,
    cscaHashAlgorithm: string | undefined,
    cscaSignatureAlgorithm: string | undefined,
    cscaCurveOrExponent: string | undefined,
    cscaSignatureAlgorithmBits: number | undefined,
    cscaSaltLength: number | undefined;
  let cscaFound = false;

  if (dscCert.authorityKeyIdentifier) {
    try {
      csca = getCSCAFromSKI(dscCert.authorityKeyIdentifier, skiPem);
      if (csca) {
        cscaParsed = parseCertificateSimple(csca);
        const details = brutforceSignatureAlgorithmDsc(dscCert, cscaParsed);

        if (details) {
          if (cscaParsed.publicKeyDetails) {
            cscaFound = true;
            cscaHashAlgorithm = details.hashAlgorithm;
            cscaSignatureAlgorithm = details.signatureAlgorithm;
            cscaCurveOrExponent = getCurveOrExponent(cscaParsed);
            cscaSignatureAlgorithmBits = parseInt(
              cscaParsed.publicKeyDetails.bits
            );
            cscaSaltLength = details.saltLength;
          }
        }
      }
    } catch (error) {}
  } else {
    console.log('js: dscCert.authorityKeyIdentifier not found');
  }

  // FIX: Add the return statement and provide default values
  // for any potentially undefined variables to match the interface.
  return {
    cscaFound: cscaFound,
    cscaHashAlgorithm: cscaHashAlgorithm || '',
    cscaSignatureAlgorithm: cscaSignatureAlgorithm || '',
    cscaCurveOrExponent: cscaCurveOrExponent || '',
    cscaSignatureAlgorithmBits: cscaSignatureAlgorithmBits || 0,
    cscaSaltLength: cscaSaltLength || 0,
    csca: csca || '',
    // Here we must provide an empty object that conforms to CertificateData
    // or use a type assertion if we know the consumer can handle null/undefined.
    // For safety, we provide a default structure.
    cscaParsed: cscaParsed || ({} as CertificateData),
    cscaBits: cscaSignatureAlgorithmBits || 0,
  };
}
