'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getUniversalLink } from "../lib/self/core";
import {
  SelfAppBuilder,
  type SelfApp,
} from "../lib/self/qrcode";
import { countries} from "../lib/self/qrcode";
import { v4 as uuidv4 } from 'uuid';

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(uuidv4());

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Self Workshop",
        scope: "self-test",
        endpoint: "https://selfverify-50775725716.asia-east2.run.app/",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "uuid",
        userDefinedData: "Hello World",
        disclosures: {
          minimumAge: 18,
          nationality: true,
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
      <p>Click the button to open the Self app</p>
      
      {selfApp ? (
        <button onClick={() => window.open(universalLink, '_blank')}>
          Open Self App
        </button>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default VerificationPage;

