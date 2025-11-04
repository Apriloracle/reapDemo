'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "../lib/self/core";
import {
  SelfAppBuilder,
  type SelfApp,
  SelfQRcode,
} from "../lib/self/qrcode";
import { v4 as uuidv4 } from 'uuid';

function VerificationButton() {
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

  return (
    <div className="verification-container">
      {selfApp ? (
        <button 
          onClick={() => window.open(universalLink, '_blank')}
          style={{
            backgroundColor: '#f05e23',
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Verify you are human
        </button>
      ) : (
        <div>Loading...</div>
      )}
      {selfApp && (
        <div style={{ marginTop: '1rem' }}>
          <SelfQRcode selfApp={selfApp} />
        </div>
      )}
    </div>
  );
}

export default VerificationButton;

