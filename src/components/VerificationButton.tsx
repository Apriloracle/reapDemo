'use client';

import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, toUtf8Bytes } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getUniversalLink } from "../lib/self/core";
import { SelfAppBuilder, type SelfApp, SelfQRcodeWrapper } from "../lib/self/qrcode";
import { initWebSocket } from '../lib/self/qrcode/utils/websocket';
import ProofOfHuman from '../../contracts/ProofOfHuman.json';

const contractAddress = "0xE1fBF82d1F898183E0B6130AECfdD2Dcbe347518";


function VerificationButton() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(uuidv4());
  const [proofStep, setProofStep] = useState(0);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Self Workshop",
        scope: "self-test",
        endpoint: "https://selfverify-50775725716.asia-east2.run.app/",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
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

  const handleVerificationSuccess = async (data: any) => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const proofOfHumanContract = new Contract(
          contractAddress,
          ProofOfHuman,
          signer
        );

        const proofPayload = toUtf8Bytes(JSON.stringify(data.proof));
        const userContextData = toUtf8Bytes("mockUserContextData");

        const tx = await proofOfHumanContract.verifySelfProof(proofPayload, userContextData);
        await tx.wait();
        alert("Verification successful!");
      } catch (error) {
        console.error("Verification failed:", error);
        alert("Verification failed. See console for details.");
      }
    }
  };

  const handleVerificationError = (data: any) => {
    console.error("Verification error:", data);
    alert("Verification failed. See console for details.");
  };

  useEffect(() => {
    if (selfApp) {
      const cleanup = initWebSocket(
        "https://selfverify-50775725716.asia-east2.run.app/",
        selfApp,
        'deeplink',
        setProofStep,
        handleVerificationSuccess,
        handleVerificationError
      );
      return cleanup;
    }
  }, [selfApp]);

  return (
    <div className="verification-container">
      {selfApp ? (
        <div>
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
          <div style={{ marginTop: '2rem' }}>
            <SelfQRcodeWrapper 
              selfApp={selfApp} 
              onSuccess={handleVerificationSuccess} 
              onError={handleVerificationError} 
            />
          </div>
        </div>
    ) : (
      <div>Loading...</div>
    )}
    </div>
  );
}

export default VerificationButton;
