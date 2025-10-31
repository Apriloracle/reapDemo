import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import React, { useState } from 'react';
import { membershipStore } from '../stores/MembershipStore';

const SERVER_URL = 'http://34.87.20.230:3111'; // replace with your backend IP

function PremiumContentButton() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [premiumContent, setPremiumContent] = useState('');

  const handlePayment = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    setPaymentStatus('pending');
    setPremiumContent('');

    try {
      console.log('Requesting payment quote...');
      const quoteResponse = await fetch(`${SERVER_URL}/premium`);
      if (quoteResponse.status !== 402) throw new Error('Failed to get payment quote from server.');
      const quote = await quoteResponse.json();

      const recipientTokenAccount = new PublicKey(quote.payment.tokenAccount);
      const usdcMint = new PublicKey(quote.payment.mint);
      const amount = quote.payment.amount;

      console.log("Finding user's USDC account...");
      const payerTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
      const payerAccountInfo = await connection.getAccountInfo(payerTokenAccount);
      if (!payerAccountInfo) throw new Error('USDC account not found. Please ensure you have USDC on Devnet.');

      console.log('Building transaction...');
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash });
      tx.add(createTransferInstruction(payerTokenAccount, recipientTokenAccount, publicKey, amount));

      console.log('Sending transaction...');
      const signature = await sendTransaction(tx, connection);
      console.log(`Transaction sent: ${signature}`);
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Verifying payment with server...');
      const verificationResponse = await fetch(`${SERVER_URL}/premium/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });

      const verificationResult = await verificationResponse.json();
      if (!verificationResponse.ok) throw new Error(verificationResult.error || 'Payment verification failed.');

      console.log('Payment successful!', verificationResult.data);
      setPaymentStatus('success');
      setPremiumContent(verificationResult.data);
      membershipStore.store.setCell('membership', 'member', 'isMember', true);
      await membershipStore.persister.save();
    } catch (error: any) {
      console.error('Payment failed', error);
      setPaymentStatus('error');
      alert(`Payment failed: ${error.message}`);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {paymentStatus === 'idle' || paymentStatus === 'error' ? (
        <button
          onClick={handlePayment}
          disabled={!publicKey || paymentStatus === 'pending'}
          style={{
            backgroundColor: '#f05e23',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Join for 0.0001&nbsp;USDC via x402
        </button>
      ) : paymentStatus === 'pending' ? (
        <button
          disabled
          style={{
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 600,
          }}
        >
          Processing Payment...
        </button>
      ) : null}

      {paymentStatus === 'success' && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#e8f5e9',
            border: '1px solid #4caf50',
            borderRadius: '8px',
            color: '#1b5e20',
            textAlign: 'left',
            maxWidth: '320px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontWeight: 700 }}>✅ Access Granted</h3>
          <p style={{ margin: 0 }}>{premiumContent || 'You are now a Deals+ member!'}</p>

          <div style={{ marginTop: '15px', paddingLeft: '10px' }}>
            <ul style={{ margin: 0, paddingLeft: '15px' }}>
              <li>🛍️ 10% off local eco-shops</li>
              <li>☕ Free drink with every café purchase</li>
              <li>💡 Early access to partner merchant launches</li>
            </ul>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div style={{ marginTop: '15px', color: '#f87171' }}>
          <p>Payment failed. Please try again.</p>
        </div>
      )}
    </div>
  );
}

export default PremiumContentButton;
