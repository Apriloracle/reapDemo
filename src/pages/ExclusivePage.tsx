import React, { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import PremiumContentButton from '../components/PremiumContentButton';
import VerificationButton from '../components/VerificationButton';
import { membershipStore } from '../stores/MembershipStore';
import styles from '../styles/ExclusivePage.module.css';

const GiftIcon = () => (
  <svg className={styles.benefitIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

const CoffeeIcon = () => (
  <svg className={styles.benefitIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className={styles.benefitIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7c0-2.2-1.8-4-4-4S10 4.8 10 7c0 2 .3 3.2 1.5 4.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

const ExclusivePage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    membershipStore.initialize().then(() => {
      setIsMember(membershipStore.getMembership());
    });
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div style={{textAlign: 'center'}}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {isMember ? (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>
                Welcome, Deals+ Member!
              </h1>
              <p className={styles.subtitle}>
                You have successfully unlocked exclusive content.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.iconWrapper}>
                <div className={styles.iconBackground}>
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h2 className={styles.cardTitle}>
                Access Granted
              </h2>

              <p className={styles.cardSubtitle}>
                Enjoy your exclusive member benefits
              </p>

              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIconWrapper}>
                    <GiftIcon />
                  </div>
                  <div className={styles.benefitTextWrapper}>
                    <h3 className={styles.benefitTitle}>
                      10% off local eco-shops
                    </h3>
                    <p className={styles.benefitDescription}>
                      Support sustainable businesses while saving
                    </p>
                  </div>
                </div>

                <div className={styles.benefitItem}>
                  <div className={styles.benefitIconWrapper}>
                    <CoffeeIcon />
                  </div>
                  <div className={styles.benefitTextWrapper}>
                    <h3 className={styles.benefitTitle}>
                      Free drink with every café purchase
                    </h3>
                    <p className={styles.benefitDescription}>
                      Enjoy complimentary beverages at partner locations
                    </p>
                  </div>
                </div>

                <div className={styles.benefitItem}>
                  <div className={styles.benefitIconWrapper}>
                    <LightbulbIcon />
                  </div>
                  <div className={styles.benefitTextWrapper}>
                    <h3 className={styles.benefitTitle}>
                      Early access to partner launches
                    </h3>
                    <p className={styles.benefitDescription}>
                      Be the first to discover new merchant offerings
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.statusWrapper}>
                  <div className={styles.statusDot}></div>
                  <span className={styles.statusText}>
                    Membership Active
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{textAlign: 'center'}}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Earn Reap Rewards</h1>
            <VerificationButton />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '2rem' }}>Deals+ Membership</h1>
            <p style={{ maxWidth: '320px', opacity: 0.85, margin: '1rem auto' }}>
              Join the Deals+ program to access members-only offers and premium merchant rewards – powered by x402
              payments.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#f05e23',
                  }}
                >
                  1.
                </span>
                <WalletMultiButton />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#f97316',
                  }}
                >
                  2.
                </span>
                <PremiumContentButton />
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '15px' }}>
              Secure payments handled via your connected wallet.
            </p>
          </div>
        )}
        <div className={styles.poweredBy}>
          <p>
            Powered by x402 payments
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExclusivePage;

