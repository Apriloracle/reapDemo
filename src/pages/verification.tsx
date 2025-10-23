'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "../lib/self/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "../lib/self/qrcode";
import { ethers } from "ethers";

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState('0x31ab637bd325b4bf5018b39dd155681d03348189');

  useEffect(() => {
    try {
  const app = new SelfAppBuilder({
  version: 2,
  appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
  scope: "self-playground",  // ✅ Use the standard scope from docs
  endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || "https://selfverify-50775725716.asia-east2.run.app/",
  logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
  userId: userId,  // You're using: '0x31ab637bd325b4bf5018b39dd155681d03348189'
  endpointType: "https",
  userIdType: "hex",  // ✅ Correct since userId is hex address
  userDefinedData: "Hello World",
  disclosures: {
    minimumAge: 18,
    excludedCountries: [],
    ofac: true,
  }
}).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful!");
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>
      
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={() => {
            console.error("Error: Failed to verify identity");
          }}
        />
      ) : (
        <div>Loading QR Code...</div>
      )}
    </div>
  );
}

export default VerificationPage;



