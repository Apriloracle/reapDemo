import { NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "../../lib/self/core";

// IMPORTANT: These parameters MUST match your client-side SelfAppBuilder configuration exactly
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://selfverify-50775725716.asia-east2.run.app/",
  false,
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: true,
  }),
  // Add the scope parameter to match the frontend configuration
  (process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop") as any
);


export async function POST(req: Request) {
  try {
    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = await req.json();

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 200 }
      );
    }

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    // Check if verification was successful
    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

    if (!isValid || !isMinimumAgeValid || !isOfacValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) reason = "Minimum age verification failed (must be 18+)";
      if (!isOfacValid) reason = "OFAC verification failed";
      
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason,
          error_code: "VERIFICATION_FAILED",
          details: result.isValidDetails,
        },
        { status: 200 }
      );
    }

    // Verification successful
    return NextResponse.json({
      status: "success",
      result: true,
      data: {
        userIdentifier: result.userData.userIdentifier,
        nationality: result.discloseOutput.nationality,
        credentialSubject: result.discloseOutput,
      },
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
        error_code: "UNKNOWN_ERROR"
      },
      { status: 200 }
    );
  }
}

