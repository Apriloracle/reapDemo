import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quagga from '@ericblade/quagga2';
import useIPGeolocation from './IPGeolocation';

interface BarcodeScannerProps {
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const geolocationData = useIPGeolocation();
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 480,
            height: 320,
            facingMode: "environment"
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "code_128_reader",
          ],
        },
        locate: true,
      }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected(async (data) => {
        if (!isScanning) return;

        setIsScanning(false);
        Quagga.stop();

        let gtin = data.codeResult.code;
        console.log("Original GTIN detected:", gtin);

        if (gtin) {
          gtin = gtin.replace(/^0+/, '');
          console.log('Corrected GTIN:', gtin);
        }

const cachedGeo = localStorage.getItem('user-geolocation');
if (cachedGeo) {
  const geoData = JSON.parse(cachedGeo);
  
  // Access the first element of the array, then navigate the structure
  const countryCode = geoData[0]?.geolocation?.userGeo?.countryCode;
  
  if (!countryCode) {
    console.error('Country code not found in geolocation data');
    onClose();
    return;
  }

          try {
            const response = await fetch('https://gtin-barcode-50775725716.asia-southeast1.run.app/lookup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ gtin, countryCode }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log('Endpoint response:', result);
              navigate('/shopping-results', { state: { shoppingComparisonResults: result.shoppingComparisonResults } });
            } else {
              console.error('Endpoint call failed');
            }
          } catch (error) {
            console.error('Error during endpoint call:', error);
          }
        } else {
          console.error('Could not determine country code from cache.');
        }

        onClose();
      });
    }

    return () => {
      Quagga.stop();
    };
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    }}>
      <div ref={scannerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          border: '2px solid white',
          borderRadius: '10px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}></div>
      </div>
      <button onClick={onClose} style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '10px 20px',
        backgroundColor: '#f05e23',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}>
        Close
      </button>
    </div>
  );
};

export default BarcodeScanner;

