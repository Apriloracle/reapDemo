import { sdk } from '@farcaster/miniapp-sdk';
import React, { useEffect, useState, useRef, useContext, useMemo } from 'react'
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi'
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';
import { createYjsPersister } from 'tinybase/persisters/persister-yjs';
import { Doc } from 'yjs';
import WebApp from '@twa-dev/sdk'
import { LocalWallet } from "@thirdweb-dev/wallets";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import * as didPeer from '@aviarytech/did-peer';
import PeerSync from './PeerSync';
import SurveyQuestion from './SurveyQuestion';
import BalanceCard from './BalanceCard';
import InitialDataFetcher from './InitialDataFetcher';
import FriendsComponent from './FriendsComponent';
import Cashout from './Cashout';
import DealsComponent from './DealsComponent';
import MerchantDealsComponent from './MerchantDealsComponent';
import CartPage from '../pages/CartPage';
import WatchAdsComponent from './WatchAdsComponent';
import SurveyList from './SurveyList';
import ProfileComponent from './ProfileComponent';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { SubdocumentProvider } from '../contexts/SubdocumentContext';
import TapComponent from './TapComponent';
import BrainInitializer from './BrainInitializer';
import RecommendationNode from './RecommendationNode';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { getRandomWebSocketURL } from '../utils/websocketUtils';
import HybridClusteringEngine from './HybridClusteringEngine';
import styles from '../styles/ProductCard.module.css';
import { WebSocketProvider, useWebSocket } from '../contexts/WebSocketContext';
import { merchantProductsStore } from '../stores/MerchantProductsStore';
import { categoryStore } from '../stores/CategoryStore';
import SwiperComponent from './SwiperComponent'; // Import the new component
import ButtonSwipe from './ButtonSwipe'; 
import SimilarProductsPage from '../pages/SimilarProductsPage'; // Import the new page
import DiscoveryPage from '../pages/DiscoveryPage'; // Import the new page
import ProductDetailPage from '../pages/ProductDetailPage'; // Import the new page
import categoryIndex from '../data/index.json'; // Assumes index.json is in src/data
import LiqeSearchComponent from './LiqeSearchComponent';
import { SearchProvider } from '../contexts/SearchContext';
import CategoryFilter from './CategoryFilter';
import { hypervectorProfileStore } from '../stores/HypervectorProfileStore';
import { vectorCacheService } from '../services/VectorCacheService';


// const DAILY_TAP_LIMIT = 9000;
const RESET_MINUTES = 60;
const TELEGRAM_BOT_URL = 'https://t.me/Reapmini_bot';
const SHARE_URL = 'https://t.me/share/url?url=https://t.me/Reapmini_bot&text=%F0%9F%92%B0Reap%20Mini%3A%20Tap%2C%20Earn%2C%20Grow%20-%20Where%20Every%20Tap%20Leads%20to%20Crypto%20Rewards!%0A%F0%9F%8E%81Let%27s%20start%20earning%20now!';

const DEFAULT_APRIL_PRICE = 0; // Updated default price to 0

// Move MainPage component outside of TelegramMiniApp
interface MainPageProps {
  totalBalanceUsd: number;
  aprilBalance: {
    value: string;
    displayValue: string;
    display: string;
  };
  localWalletAddress: string | null;
  address: string | undefined;
  showSurvey: boolean;
  handleSurveyResponse: (question: string, response: string) => void;
  setShowSurvey: (show: boolean) => void;
  ydoc: Y.Doc | null;
}

const MainPage: React.FC<MainPageProps> = ({
  totalBalanceUsd,
  aprilBalance,
  localWalletAddress,
  address,
  showSurvey,
  handleSurveyResponse,
  setShowSurvey,
  ydoc
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [merchantProducts, setMerchantProducts] = useState<Record<string, any>>({});
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any>>({});
  const [filteredProducts, setFilteredProducts] = useState<Record<string, any>>({});
  const { provider } = useWebSocket();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  const clusteringEngine = useRef<any>(null);
  const [wsProvider, setWsProvider] = useState<WebsocketProvider | null>(null);

   // State for current deal index - Now managed inside MainPage
  const [currentDealIndex, setCurrentDealIndex] = useState(0);

  // Create a memoized map for quick category ID lookup
  const categoryMap = useMemo(() => {
    return categoryIndex.reduce((acc, category) => {
      acc[category.categoryName] = category.categoryId;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  // Initialize WebSocket provider and clustering engine
  useEffect(() => {
    if (provider?.awareness && ydoc) {
      clusteringEngine.current = new HybridClusteringEngine(provider.awareness, ydoc);
    }
  }, [provider, ydoc]);

  // Initialize stores and fetch products
  useEffect(() => {
    const initializeAndFetch = async () => {
      setIsLoading(true);
      try {
        // Initialize stores first
        await merchantProductsStore.initialize();
        await categoryStore.initialize();

        // Then, try to get random products from the store
        const randomProducts = await categoryStore.getRandomProducts(54);
        if (randomProducts.length > 0) {
          const formattedProducts = randomProducts.filter((p: any) => p.price > 0).map((p: any) => ({
            ...p,
            name: p.name || p.title,
            imageUrl: p.imageUrl || p.imgUrl,
          }));

          const productsByCategory: { [key: string]: any[] } = {};
          const recommendations: any[] = [];
          for (const product of formattedProducts) {
            const categoryId = product.categoryId || 'unknown';
            if (!productsByCategory[categoryId]) {
              productsByCategory[categoryId] = [];
              recommendations.push({ categoryId, merchantName: product.category || 'Unknown' });
            }
            productsByCategory[categoryId].push(product);
          }
          setCategoryProducts(productsByCategory);
          setRecommendations(recommendations);
          setFilteredProducts(productsByCategory);
          return; // Exit after loading from cache
        }

        // If no random products, fall back to fetching test products
        const categoryId = 167; // Assuming 'Amazon' has categoryId 1 from index.json
        const merchantName = "Amazon"; // Hardcode merchant name for display

        const response = await fetch(`https://productsandsimilarproductsendpoint-50775725716.asia-southeast1.run.app/products?categoryId=${categoryId}&page=1&limit=250`);
        if (!response.ok) {
          throw new Error(`Failed to fetch products for ${merchantName}`);
        }
        const responseData = await response.json();

        if (!responseData || !Array.isArray(responseData.data)) {
          console.error(`Expected an object with a 'data' array for ${merchantName}, but received:`, responseData);
          return;
        }

        const formattedProducts = responseData.data.filter((p: any) => p.price > 0).map((p: any) => ({
          ...p,
          name: p.title,
          imageUrl: p.imgUrl,
        }));

        await categoryStore.addProducts(categoryId.toString(), formattedProducts);
        const newProductsFromStore = await categoryStore.getDisplayProducts(categoryId.toString());

        setCategoryProducts({ [categoryId.toString()]: newProductsFromStore });
        setRecommendations([{ categoryId: categoryId.toString(), merchantName: "" }]);
        setFilteredProducts({ [categoryId.toString()]: newProductsFromStore });

      } catch (error) {
        console.error('Error initializing stores or fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndFetch();
  }, []); // Empty dependency array to run once on mount

  // Add this new state for tracking image loading
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Add this function to handle image loading
  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };

  // Update handleProductInteraction
  const handleProductInteraction = async (product: any, merchantName: string, interactionType: 'click' | 'view') => {
    try {
      // Validate product has ASIN
      if (!product || !product.asin) {
        console.warn('Invalid product data:', product);
        return;
      }

      // Initialize clustering engine if needed
      if (!clusteringEngine.current) {
        if (wsProvider?.awareness && ydoc) {
          clusteringEngine.current = new HybridClusteringEngine(wsProvider.awareness, ydoc);
        } else {
          console.warn('WebSocket provider, awareness, or ydoc not available');
          return;
        }
      }

      // Format interaction data for clustering
      const interaction = {
        ASIN: product.asin,
        InteractionLevel: interactionType === 'click' ? 1 : 0.5,
        InteractionCount: 1,
        timestamp: Date.now(),
        merchantName,
        category: product.category || 'unknown',
        price: product.price || 0
      };

      // Process through clustering engine
      await clusteringEngine.current.processInteraction(interaction);

      // New: Fetch the real product vector and add it to the 10k profile
      if (interactionType === 'click') {
        const realProductVector = await vectorCacheService.getVector(product.asin);
        if (realProductVector) {
          await hypervectorProfileStore.addRealProductVector(realProductVector);
        }
      }

    } catch (error) {
      console.error('Error handling product interaction:', error);
    }
  };

  const handleFilterChange = (categories: number[]) => {
    setSelectedCategories(categories);
    // Update the hypervector profile with the new filter selection
    // We'll create a "composite" key to represent the filter state
    const filterKey = `filter_selection:[${categories.sort().join(',')}]`;
    console.log(`Updating profile with filter key: ${filterKey}`);
    hypervectorProfileStore.addInteraction('filter_select', filterKey);
  };

  return (
    <SearchProvider store={categoryStore.store}>
      <BalanceCard
        totalBalance={totalBalanceUsd}
        availableApril={aprilBalance}
        localWalletAddress={localWalletAddress}
      />

      <div 
        style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => navigate('/discovery')}
      >
        <div style={{ pointerEvents: 'none' }}>
          <CategoryFilter onFilterChange={() => {}} />
        </div>
        <div style={{ pointerEvents: 'none' }}>
          <LiqeSearchComponent
            onSearch={() => {}}
          />
        </div>
      </div>
      
      {!localWalletAddress && !address && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ConnectKitButton theme="retro" customTheme={{
            "--ck-connectbutton-background": "black",
            "--ck-connectbutton-color": "#f05e23",
          }} />
        </div>
      )}


 {/* New Icon Placeholders Section */}
 


{/* Products Display Section */}
      <div style={{ marginTop: '1.5rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            Loading products...
          </div>
        ) : (
          recommendations.map((deal) => (
            <div key={deal.categoryId} style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '0.5rem' 
              }}>
                {filteredProducts[deal.categoryId]?.map((product: any, index: number) => (
                  <div 
                    key={index}
                    onClick={() => navigate(`/similar/${product.asin}`)} // Navigate to similar products page
                    onMouseEnter={() => handleProductInteraction(product, deal.merchantName, 'view')}
                    className={styles.productCard}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/similar/${product.asin}`); // Navigate to similar products page
                      }
                    }}
                  >
                    <div className={styles.imageContainer}>
                      {product.imageUrl && (
                        <>
                          {!loadedImages[product.imageUrl] && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#666'
                            }}>
                              Loading...
                            </div>
                          )}
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            onLoad={() => handleImageLoad(product.imageUrl)}
                            className={styles.productImage}
                            style={{
                              opacity: loadedImages[product.imageUrl] ? 1 : 0,
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className={styles.productTitle}>
                      {product.name}
                    </div>
                    {product.price && (
                      <div style={{ 
                        color: '#f05e23',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}>
                        <span style={{ fontSize: '0.85em', marginRight: '0.3em' }}>$</span>{product.price}
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showSurvey && (
        <SurveyQuestion
          onResponse={handleSurveyResponse}
          onClose={() => setShowSurvey(false)}
        />
      )}
    </SearchProvider>
  );
};

const TelegramMiniApp: React.FC = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const [webApp, setWebApp] = useState<any>(null);
  const { address } = useAccount()

  const [score, setScore] = useState<number>(0);
  const [dailyTaps, setDailyTaps] = useState<number>(0);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shares, setShares] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [localWallet, setLocalWallet] = useState<LocalWallet | null>(null);
  const [localWalletAddress, setLocalWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showSurvey, setShowSurvey] = useState<boolean>(false);
  const [aprilBalance, setAprilBalance] = useState<{ 
    value: string; 
    displayValue: string;
    display: string;
  }>({ 
    value: '0', 
    displayValue: '0',
    display: '0'
  });
  const [aprilUsdPrice, setAprilUsdPrice] = useState<number | null>(null);
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<number>(0);

  const [celoAprilBalance, setCeloAprilBalance] = useState<string>('0');
  const [polygonAprilBalance, setPolygonAprilBalance] = useState<string>('0');

  const clickStore = React.useMemo(() => createStore(), []);
  const shareStore = React.useMemo(() => createStore(), []);
  const dailyStore = React.useMemo(() => createStore(), []);
  const clickPersister = React.useMemo(() => createLocalPersister(clickStore, 'celon-click-stats'), [clickStore]);
  const sharePersister = React.useMemo(() => createLocalPersister(shareStore, 'celon-share-stats'), [shareStore]);
  const dailyPersister = React.useMemo(() => createLocalPersister(dailyStore, 'celon-daily-stats'), [dailyStore]);
  const aprilBalanceStore = React.useMemo(() => createStore(), []);
  const aprilBalancePersister = React.useMemo(() => createLocalPersister(aprilBalanceStore, 'AprilBalance'), [aprilBalanceStore]);
  const aprilPriceStore = React.useMemo(() => createStore(), []);
  const aprilPricePersister = React.useMemo(() => createLocalPersister(aprilPriceStore, 'AprilUsdPrice'), [aprilPriceStore]);

  const [peerDID, setPeerDID] = useState<string | null>(null);

  // Add a new state variable to store the login method
  const [loginMethod, setLoginMethod] = useState<'telegram' | 'peerDID' | null>(null);
  const [isPeerSyncReady, setIsPeerSyncReady] = useState<boolean>(false);

  // Add RecommendationNode instance
  const [recommendationNode, setRecommendationNode] = useState<RecommendationNode | null>(null);

  // Add state for websocket provider
  const [wsProvider, setWsProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    const initializeRecommendationNode = async () => {
      const ydoc = new Y.Doc();
      const provider = new WebsocketProvider(getRandomWebSocketURL(), '', ydoc);
      setWsProvider(provider);
      
      const node = new RecommendationNode(ydoc, provider);
      setRecommendationNode(node);
    };

    initializeRecommendationNode();
  }, []);

  // Modify loadRecommendations to use the awareness protocol
  const loadRecommendations = async () => {
    if (!recommendationNode || !wsProvider) return;
    
    try {
      const dealsStore = createStore();
      const dealsPersister = createLocalPersister(dealsStore, 'kindred-deals');
      await dealsPersister.load();

      const dealsTable = dealsStore.getTable('deals');
      if (dealsTable) {
        Object.values(dealsTable).forEach(deal => {
          recommendationNode.broadcastInteraction(
            String(deal.dealId),
            1  // default interaction level
          );
        });
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (isPeerSyncReady) {
        // Retrieve the stored peer:did
        const peerDID = await getPeerDID();

        if (peerDID) {
          // Create a new Yjs document
          const yDoc = new Doc();

          // Create a new TinyBase store for the peer:did
          const peerDIDStore = createStore();
          peerDIDStore.setTable('peerDID', { 'current': { did: peerDID } });

          // Create a YjsPersister
          const yjsPersister = createYjsPersister(peerDIDStore, yDoc, 'userSubnet');

          // Save the peer:did to the Yjs document
          await yjsPersister.save();

          console.log('Peer:DID saved to Yjs document:', peerDID);
        } else {
          console.error('No Peer:DID found');
        }

        // Generate simple Peer:DID
        await generateAndStorePeerDID();

        // ... other initialization code ...
      }
    };

    initializeApp();
  }, [isPeerSyncReady]);

  const generateAndStorePeerDID = async () => {
    try {
      // Check if a Peer:DID already exists in TinyBase
      const existingPeerDID = await getPeerDID();
      if (existingPeerDID) {
        setPeerDID(existingPeerDID);
        return;
      }

      // Generate a new key pair
      const keyPair = await Ed25519VerificationKey2020.generate();
      const publicKeyMultibase = keyPair.publicKeyMultibase;

      // Create the authentication key object
      const authenticationKey = {
        id: 'key-1',
        type: 'Ed25519VerificationKey2020',
        publicKeyMultibase: publicKeyMultibase,
        controller: 'did:peer:0' // Add this line
      };

      // Create the Peer:DID (numalgo0)
      const newPeerDID = await didPeer.create(0, [authenticationKey]);

      console.log('Generated unique Peer:DID:', newPeerDID);

      // Store the Peer:DID in TinyBase
      const peerDIDStore = createStore();
      const peerDIDPersister = createLocalPersister(peerDIDStore, 'peer-did');
      peerDIDStore.setTable('peerDID', { 'current': { did: newPeerDID } });

      // Add coordinate functionality and update the coordinate for the new peer:did.
      const updateCoordinates = addCoordinateToStore(peerDIDStore, 'peerDID');
      await updateCoordinates();

      await peerDIDPersister.save();

      setPeerDID(newPeerDID);
    } catch (error) {
      console.error('Error generating unique Peer:DID:', error);
    }
  };

  const getPeerDID = async (): Promise<string | null> => {
    const peerDIDStore = createStore();
    const peerDIDPersister = createLocalPersister(peerDIDStore, 'peer-did');
    await peerDIDPersister.load();
    const storedDID = peerDIDStore.getCell('peerDID', 'current', 'did');
    return typeof storedDID === 'string' ? storedDID : null;
  };

  // Add this new useEffect hook for handling daily tap data
  useEffect(() => {
    const loadDailyTapData = async () => {
      try {
        await dailyPersister.load();
        const loadedDailyTaps = dailyStore.getCell('dailyStats', 'clicks', 'count') as number;
        const lastReset = new Date(dailyStore.getCell('dailyStats', 'clicks', 'lastReset') as string || new Date().toISOString());
        
        if (shouldResetDailyTaps(lastReset)) {
          resetDailyTaps();
        } else {
          setDailyTaps(loadedDailyTaps);
          setIsDailyLimitReached(loadedDailyTaps >= 9000);
        }
        
        console.log('Loaded daily taps:', loadedDailyTaps);
      } catch (error) {
        console.error('Error loading daily tap data:', error);
      }
    };

    loadDailyTapData();

    // Set up an interval to check for daily tap reset
    const intervalId = setInterval(() => {
      const lastReset = new Date(dailyStore.getCell('dailyStats', 'clicks', 'lastReset') as string);
      if (shouldResetDailyTaps(lastReset)) {
        resetDailyTaps();
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [dailyPersister, dailyStore]);

  // Add this useEffect hook to set up a listener for daily tap updates
  useEffect(() => {
    const dailyTapListenerId = dailyStore.addCellListener(
      'dailyStats',
      'clicks',
      'count',
      (_, __, ___, ____, newValue) => {
        const newDailyTaps = newValue as number;
        setDailyTaps(newDailyTaps);
        setIsDailyLimitReached(newDailyTaps >= 9000);
        console.log('Daily taps updated:', newDailyTaps);
        dailyPersister.save().catch(console.error);
      }
    );

    return () => {
      dailyStore.delListener(dailyTapListenerId);
    };
  }, [dailyStore, dailyPersister]);

  // Update the handleTransfer function to skip API call
  const handleTransfer = async () => {
    if (isDailyLimitReached) {
      setError("Tap limit reached. Please try again in a few minutes.");
      return;
    }

    try {
      const walletAddress = localWalletAddress || address;
      if (!walletAddress) {
        throw new Error("No wallet connected");
      }

      // Comment out the API call
      /*
      const response = await fetch('https://us-central1-fourth-buffer-421320.cloudfunctions.net/handleTapProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to process the tap');
      }

      const result = await response.json();

      if (result.success) {
      */
      
      // Keep the rest of the functionality
      const currentScore = clickStore.getCell('stats', 'clicks', 'count') as number;
      const newScore = currentScore + 1;
      clickStore.setCell('stats', 'clicks', 'count', newScore);
      
      const currentDailyTaps = dailyStore.getCell('dailyStats', 'clicks', 'count') as number;
      const newDailyTaps = currentDailyTaps + 1;
      dailyStore.setCell('dailyStats', 'clicks', 'count', newDailyTaps);

      setError(null);
      console.log('Tap processed successfully');

      // Randomly show a survey question (1% chance)
      if (Math.random() < 0.01) {
        setShowSurvey(true);
      }
      /*
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
      */

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error processing tap:', err);
    }
  };

  // Modify the existing useEffect hook to remove daily tap loading
  useEffect(() => {
    const initWebApp = async () => {
      try {
        setWebApp(WebApp);
        WebApp.ready();
        WebApp.expand();

        const searchParams = new URLSearchParams(WebApp.initData);
        const userDataStr = searchParams.get('user');
        
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserId(userData.id.toString());
          console.log('User ID:', userData.id);
          // Automatically log in the user
          handleLogin(userData.id.toString(), 'telegram');
        } else {
          console.log('User data not found in initData, falling back to Peer:DID');
          // Check for existing Peer:DID first
          let peerDID = await getPeerDID();
          
          if (!peerDID) {
            // If no Peer:DID exists, generate one
            await generateAndStorePeerDID();
            // Get the newly generated Peer:DID
            peerDID = await getPeerDID();
          }

          if (peerDID) {
            console.log('Using Peer:DID for login:', peerDID);
            handleLogin(peerDID, 'peerDID');
          } else {
            console.error('Failed to generate or retrieve Peer:DID');
            setError("Unable to initialize user data. Please try reloading the app.");
          }
        }
      } catch (error) {
        console.error('Failed to initialize WebApp:', error);
      }
    };

    initWebApp();
    loadPersistedData();

    clickStore.setTables({
      stats: { clicks: { count: 0 } }
    });
    shareStore.setTables({
      stats: { shares: { count: 0 } }
    });
    dailyStore.setTables({
      dailyStats: { clicks: { count: 0, lastReset: new Date().toISOString() } }
    });
    aprilBalanceStore.setTables({
      balance: { april: { value: '0', displayValue: '0' } }
    });

    const scoreListenerId = clickStore.addCellListener(
      'stats',
      'clicks',
      'count',
      (_, __, ___, ____, newValue) => {
        setScore(newValue as number);
        console.log('Score updated:', newValue);
        clickPersister.save().catch(console.error);
      }
    );

    const shareListenerId = shareStore.addCellListener(
      'stats',
      'shares',
      'count',
      (_, __, ___, ____, newValue) => {
        setShares(newValue as number);
        console.log('Shares updated:', newValue);
        sharePersister.save().catch(console.error);
      }
    );

    // Load persisted APRIL balance
    aprilBalancePersister.load().then(() => {
      const loadedValue = aprilBalanceStore.getCell('balance', 'april', 'value') as string;
      const loadedDisplayValue = aprilBalanceStore.getCell('balance', 'april', 'displayValue') as string;
      setAprilBalance({ value: loadedValue || '0', displayValue: loadedDisplayValue || '0', display: loadedDisplayValue || '0' });
    }).catch(console.error);

    // Set up APRIL balance listener
    const aprilBalanceListenerId = aprilBalanceStore.addCellListener(
      'balance',
      'april',
      'value',
      (_, __, ___, ____, newValue) => {
        const newDisplayValue = aprilBalanceStore.getCell('balance', 'april', 'displayValue') as string;
        setAprilBalance({ value: newValue as string, displayValue: newDisplayValue, display: newDisplayValue });
        console.log('APRIL balance updated:', newValue);
        aprilBalancePersister.save().catch(console.error);
      }
    );

    // Fetch APRIL balance
    const fetchAprilBalance = async () => {
      const walletAddress = localWalletAddress || address;
      if (walletAddress) {
        try {
          const response = await fetch(`https://us-central1-fourth-buffer-421320.cloudfunctions.net/getAprilBalances?address=${walletAddress}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch APRIL balance');
          }

          const data = await response.json();
          
          // Extract display values from both chains
          const chain42220Value = parseFloat(data.chain42220.result.displayValue);
          const chain137Value = parseFloat(data.chain137.result.displayValue);
          
          // Add the values together
          const totalDisplayValue = chain42220Value + chain137Value;
          
          // Log the total balance
          console.log('Total APRIL balance:', totalDisplayValue.toString());

          // Update the state with the total balance
          setAprilBalance({ 
            value: (chain42220Value + chain137Value).toString(),
            displayValue: totalDisplayValue.toFixed(18),
            display: totalDisplayValue.toFixed(18)
          });

          // Update the store with the total balance
          aprilBalanceStore.setCell('balance', 'april', 'value', (chain42220Value + chain137Value).toString());
          aprilBalanceStore.setCell('balance', 'april', 'displayValue', totalDisplayValue.toFixed(18));

          // Update the Celo and Polygon balances
          setCeloAprilBalance(chain42220Value.toFixed(18));
          setPolygonAprilBalance(chain137Value.toFixed(18));
        } catch (error) {
          console.error('Error fetching APRIL balance:', error);
        }
      }
    };

    fetchAprilBalance();
    // Set up an interval to fetch APRIL balance periodically (e.g., every 60 seconds)
    const intervalId = setInterval(fetchAprilBalance, 60000);

    const fetchAprilPrice = async () => {
      try {
        const response = await fetch('https://us-central1-fourth-buffer-421320.cloudfunctions.net/getAprilPrice', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch APRIL price');
        }
    
        const rawData = await response.text(); // Get the response as text
        console.log('Raw API response:', rawData); // Log the raw response

        // Try to parse the response as JSON, if it fails, assume it's a plain number
        let data;
        try {
          data = JSON.parse(rawData);
        } catch (e) {
          // If parsing fails, assume the response is a plain number
          data = parseFloat(rawData.replace('Current April price: ', '').trim());
        }

        let price: number;
        if (typeof data === 'string') {
          price = parseFloat(data);
        } else if (typeof data === 'number') {
          price = data;
        } else if (typeof data === 'object' && data !== null) {
          // If the response is an object, try to find a numeric property
          const numericValue = Object.values(data).find(value => typeof value === 'number');
          if (numericValue !== undefined) {
            price = numericValue;
          } else {
            throw new Error('Unexpected response format');
          }
        } else {
          throw new Error('Unexpected response format');
        }

        if (isNaN(price)) {
          throw new Error('Invalid price value');
        }

        const formattedPrice = price.toFixed(6); // Format to 6 decimal places
        console.log('Parsed APRIL USD Price:', formattedPrice); // Log the parsed price

        aprilPriceStore.setCell('price', 'APRIL', 'usd', formattedPrice);
        aprilPriceStore.setCell('price', 'APRIL', 'lastFetchTime', Date.now());
        await aprilPricePersister.save();
        setAprilUsdPrice(parseFloat(formattedPrice));
      } catch (error) {
        console.error('Error fetching APRIL price:', error);
        // If there's an error, we'll use the last stored price if available
        const storedPrice = aprilPriceStore.getCell('price', 'APRIL', 'usd') as string | undefined;
        if (storedPrice) {
          setAprilUsdPrice(parseFloat(storedPrice));
          console.log('Using stored APRIL USD Price:', storedPrice);
        } else {
          // If no stored price is available, we set the price to the default value (0)
          setAprilUsdPrice(DEFAULT_APRIL_PRICE);
          console.log('Using default APRIL USD Price:', DEFAULT_APRIL_PRICE);
        }
      }
    };

    const loadAprilPrice = async () => {
      await aprilPricePersister.load();
      const storedPrice = aprilPriceStore.getCell('price', 'APRIL', 'usd') as string | undefined;
      const lastFetchTime = aprilPriceStore.getCell('price', 'APRIL', 'lastFetchTime') as number | undefined;

      if (storedPrice && lastFetchTime) {
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        if (timeSinceLastFetch < 2 * 60 * 60 * 1000) { // Less than 2 hours
          setAprilUsdPrice(parseFloat(storedPrice));
          console.log('APRIL USD Price (from local store):', storedPrice);
          return;
        }
      }

      await fetchAprilPrice();
    };

    loadAprilPrice();

    const intervalId3 = setInterval(() => {
      loadAprilPrice();
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => {
      clickStore.delListener(scoreListenerId);
      shareStore.delListener(shareListenerId);
      clickPersister.destroy();
      sharePersister.destroy();
      dailyPersister.destroy();
      aprilBalanceStore.delListener(aprilBalanceListenerId);
      aprilBalancePersister.destroy();
      clearInterval(intervalId);
      clearInterval(intervalId3);
      aprilPricePersister.destroy();
    };
  }, [localWalletAddress, address]);

  // Update loadPersistedData function
  const loadPersistedData = async () => {
    try {
      await clickPersister.load();
      await sharePersister.load();
      
      const loadedScore = clickStore.getCell('stats', 'clicks', 'count') as number;
      const loadedShares = shareStore.getCell('stats', 'shares', 'count') as number;
      
      setScore(loadedScore);
      setShares(loadedShares);
      
      console.log('Loaded score:', loadedScore, 'Shares:', loadedShares);
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const shouldResetDailyTaps = (lastReset: Date): boolean => {
    const now = new Date();
    const diffMinutes = (now.getTime() - lastReset.getTime()) / (1000 * 60);
    return diffMinutes >= RESET_MINUTES;
  };

  const resetDailyTaps = () => {
    dailyStore.setCell('dailyStats', 'clicks', 'count', 0);
    dailyStore.setCell('dailyStats', 'clicks', 'lastReset', new Date().toISOString());
    setDailyTaps(0);
    setIsDailyLimitReached(false);
  };

  // Update handleLogin to accept userId as a parameter
  const handleLogin = async (userIdParam: string, loginMethod: 'telegram' | 'peerDID' = 'telegram') => {
    if (!userIdParam) {
      setError("User ID or Peer:DID not available. Please try reloading the app.");
      return;
    }
    setLoading(true);
    try {
      let wallet = new LocalWallet();
      let isNewWallet = false;
      
      try {
        await wallet.load({
          strategy: "encryptedJson",
          password: userIdParam,
        });
        // Removed the console.log that was printing the login method
      } catch (loadError) {
        console.log(`No existing wallet found, creating new one`);
        await wallet.generate();
        await wallet.save({
          strategy: "encryptedJson",
          password: userIdParam,
        });
        isNewWallet = true;
      }

      await wallet.connect();
      setLocalWallet(wallet);
      const walletAddress = await wallet.getAddress();
      setLocalWalletAddress(walletAddress);
      console.log('Wallet connected. Address:', walletAddress);

      // Set the login method
      setLoginMethod(loginMethod);

      // Call the welcome prize endpoint only for new wallets
      if (isNewWallet) {
        await claimWelcomePrize(walletAddress);
      }

      setIsConnected(true);
    } catch (error) {
      console.error("Error handling login:", error);
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // New function to claim welcome prize
  const claimWelcomePrize = async (walletAddress: string) => {
    try {
      const response = await fetch('https://asia-southeast1-fourth-buffer-421320.cloudfunctions.net/welcomePrizeProxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to claim welcome prize');
      }

      const result = await response.json();
      console.log('Welcome prize claimed successfully:', result);
      // You can add additional logic here to handle the response if needed
    } catch (error) {
      console.error('Error claiming welcome prize:', error);
      // You can decide whether to show this error to the user or handle it silently
    }
  };

  const handleDisconnect = async () => {
    if (localWallet) {
      try {
        await localWallet.disconnect();
        setLocalWallet(null);
        setLocalWalletAddress(null);
        console.log('Disconnected from local wallet');
      } catch (error) {
        console.error("Error disconnecting local wallet:", error);
        setError("Failed to disconnect local wallet. Please try again.");
      }
    }
  };

  const handleShare = async () => {
    try {
      if (WebApp && WebApp.openTelegramLink) {
        await WebApp.openTelegramLink(SHARE_URL);
      } else {
        window.open(SHARE_URL, '_blank');
      }

      const currentShares = shareStore.getCell('stats', 'shares', 'count') as number;
      const newShares = currentShares + 1;
      shareStore.setCell('stats', 'shares', 'count', newShares);

      console.log('Share processed successfully');
    } catch (err) {
      console.error('Error processing share:', err);
    }
  };

  const handleConnectionStatus = (status: boolean) => {
    setIsConnected(status);
  };

  // Add this new function
  const handlePeerSyncReady = () => {
    setIsPeerSyncReady(true);
  };

  const handleSurveyResponse = async (question: string, response: string) => {
    console.log(`Survey question: ${question}`);
    console.log(`Survey response: ${response}`);
    // Here you would typically send the survey response to your backend
    // For example:
    // await updateUserPreferences(userId, question, response);
  };

  const calculateTotalBalanceUsd = (aprilBalance: { value: string; displayValue: string }, aprilPrice: number | null) => {
    if (!aprilPrice) return 0;
    const balance = parseFloat(aprilBalance.displayValue);
    return balance * aprilPrice;
  };

  const formatUsdBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const calculatedBalance = calculateTotalBalanceUsd(aprilBalance, aprilUsdPrice);
    setTotalBalanceUsd(calculatedBalance);
  }, [aprilBalance.displayValue, aprilUsdPrice]);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.style.height = `${window.innerHeight}px`;
    }
  }, []);

  const sendInlineKeyboardMessage = () => {
    if (WebApp && WebApp.sendData) {
      const botUsername = 'Reapmini_bot'; // Replace with your actual bot username
      const startParameter = 'shop';

      const inlineKeyboard = JSON.stringify({
        inline_keyboard: [
          [
            { text: "Shop & Save", url: `https://t.me/${botUsername}?start=${startParameter}` },
            { text: "Join Channel", url: "https://t.me/apriloraclenews" }, // Replace with your actual channel URL
            { text: "Join Group", url: "https://t.me/apriloracle" } // Replace with your actual group URL
          ]
        ]
      });

      if (WebApp.initDataUnsafe.user) {
        WebApp.sendData(JSON.stringify({
          method: "sendMessage",
          chat_id: WebApp.initDataUnsafe.user.id,
          text: "Welcome to Reap Mini! Choose an option to get started:",
          reply_markup: inlineKeyboard
        }));
      } else {
        console.error('User data is not available.');
      }
    }
  };

  const Navigation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
  
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        borderTop: '1px solid #333333'
      }}>
        {/* Home button */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: location.pathname === '/' ? '#f05e23' : '#fff',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '4px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 21V13C15 12.7348 14.8946 12.4804 14.7071 12.2929C14.5196 12.1054 14.2652 12 14 12H10C9.73478 12 9.48043 12.1054 9.29289 12.2929C9.10536 12.4804 9 12.7348 9 13V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 9.99997C2.99993 9.70904 3.06333 9.42159 3.18579 9.15768C3.30824 8.89378 3.4868 8.65976 3.709 8.47197L10.709 2.47297C11.07 2.16788 11.5274 2.00049 12 2.00049C12.4726 2.00049 12.93 2.16788 13.291 2.47297L20.291 8.47197C20.5132 8.65976 20.6918 8.89378 20.8142 9.15768C20.9367 9.42159 21.0001 9.70904 21 9.99997V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V9.99997Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ marginTop: '2px' }}>Home</span>
        </button>

  
        {/* Cart button */}
        <button
          onClick={() => navigate('/cart')}
          style={{
            background: 'none',
            border: 'none',
            color: location.pathname === '/cart' ? '#f05e23' : '#fff',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '4px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ marginTop: '2px' }}>Cart</span>
        </button>
  
        {/* Profile button */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'none',
            border: 'none',
            color: location.pathname === '/profile' ? '#f05e23' : '#fff',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '4px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 7.757 2 5.636 3.464 4.318C4.93 3 7.286 3 12 3C16.714 3 19.071 3 20.535 4.318C21.999 5.636 22 7.758 22 12C22 16.242 22 18.364 20.535 19.682C19.072 21 16.714 21 12 21C7.286 21 4.929 21 3.464 19.682C1.999 18.364 2 16.242 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 16H10M14 8H18M14 12H18M14 16H18M8.4 8H7.6C6.846 8 6.469 8 6.234 8.234C6 8.47 6 8.846 6 9.6V10.4C6 11.154 6 11.531 6.234 11.766C6.47 12 6.846 12 7.6 12H8.4C9.154 12 9.531 12 9.766 11.766C10 11.53 10 11.154 10 10.4V9.6C10 8.846 10 8.469 9.766 8.234C9.53 8 9.154 8 8.4 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ marginTop: '2px' }}>Profile</span>
        </button>
      </div>
    );
  };

  // Add websocket context
  const { provider, ydoc } = useWebSocket();

  // Update the MainPage props to use context
  const mainPageProps = {
    totalBalanceUsd,
    aprilBalance: {
      value: aprilBalance.value,
      displayValue: aprilBalance.displayValue,
      display: aprilBalance.display
    },
    localWalletAddress,
    address,
    showSurvey,
    handleSurveyResponse,
    setShowSurvey,
    ydoc
  };

  return (
      <div ref={appRef} style={{ backgroundColor: '#000000', color: '#FFFFFF', padding: '1rem', maxWidth: '28rem', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative', overflowY: 'auto' }}>
        {/* Connection status icon now uses websocket context */}
        <div 
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: provider ? '#0d0d0d' : '#000000',
            transition: 'background-color 0.3s ease',
          }}
          title={provider ? 'Connected to sync server' : 'Disconnected from sync server'}
        />

        <InitialDataFetcher />
        <PeerSync 
  
          onReady={handlePeerSyncReady}
        />
         <BrainInitializer>
        <> </> 
      </BrainInitializer>

        <Routes>
          <Route path="/" element={<MainPage {...mainPageProps} />} />
          <Route path="/tap" element={
            <TapComponent
              score={score}
              dailyTaps={dailyTaps}
              isDailyLimitReached={isDailyLimitReached}
              localWalletAddress={localWalletAddress}
              address={address}
              handleTransfer={handleTransfer}
              error={error}
            />
          } />
          <Route path="/friends" element={<FriendsComponent />} />
          <Route path="/cashout" element={
            localWallet ? (
              <Cashout 
                localWallet={localWallet}
                aprilTokenAddress="0x18719D2e1e57A1A64708e4550fF3DEF9d1074621"
                celoAprilBalance={celoAprilBalance}
                polygonAprilBalance={polygonAprilBalance}
              />
            ) : (
              <div>Please connect your wallet to access the Cashout feature.</div>
            )
          } />
          <Route path="/deals" element={<DealsComponent />} />
          <Route path="/merchant-deals/:merchantName" element={<MerchantDealsComponent localWalletAddress={localWalletAddress} address={address} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/watch-ads" element={<WatchAdsComponent />} />
          <Route path="/surveys" element={<SurveyList localWalletAddress={localWalletAddress} address={address} />} />
          <Route path="/profile" element={<ProfileComponent localWalletAddress={localWalletAddress} address={address} />} />
          <Route path="/similar/:asin" element={<SimilarProductsPage />} /> {/* New route for similar products */}
          <Route path="/products/:asin" element={<ProductDetailPage />} /> {/* New route for product details */}
          <Route path="/discovery" element={<DiscoveryPage />} /> {/* New route for discovery page */}
        </Routes>

        <Navigation />
      </div>
  )
}

export default TelegramMiniApp

