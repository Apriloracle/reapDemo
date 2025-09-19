import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStore } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { logInteraction, loadInteractions, getCurrentUserId } from '../utils/interactionLogger';
import RecommendationNode from './RecommendationNode';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { getRandomWebSocketURL } from '../utils/websocketUtils';

interface Recommendation {
  dealId: string;
  confidence: number;
}

interface Deal {
  id: string;
  dealId: string;
  merchantName: string;
  logo: string;
  logoAbsoluteUrl: string;
}

// Update the Row type to match the actual structure
interface Row {
  [key: string]: any;  // This allows for any properties
}

const DealsComponent: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [deals, setDeals] = useState<Record<string, Deal>>({});
  const recommendationNodeRef = useRef<RecommendationNode | null>(null);
  const [recommendationNode, setRecommendationNode] = useState<RecommendationNode | null>(null);

  useEffect(() => {
    const loadRecommendationsAndDeals = async () => {
      const recommendationsStore = createStore();
      const recommendationsPersister = createLocalPersister(recommendationsStore, 'personalized-recommendations');
      await recommendationsPersister.load();

      const dealsStore = createStore();
      const dealsPersister = createLocalPersister(dealsStore, 'kindred-deals');
      await dealsPersister.load();

      const recommendationsTable = recommendationsStore.getTable('recommendations');
      if (recommendationsTable) {
        const recommendationsArray = Object.values(recommendationsTable).map((row: Row): Recommendation => ({
          dealId: row.dealId as string,
          confidence: row.confidence as number
        }));
        setRecommendations(recommendationsArray);
      }

      const dealsTable = dealsStore.getTable('deals');
      if (dealsTable) {
        const mappedDeals: Record<string, Deal> = {};
        Object.entries(dealsTable).forEach(([key, value]: [string, Row]) => {
          mappedDeals[key] = {
            id: value.id as string,
            dealId: value.dealId as string,
            merchantName: value.merchantName as string,
            logo: value.logo as string,
            logoAbsoluteUrl: value.logoAbsoluteUrl as string
          };
        });
        setDeals(mappedDeals);
      }

      await loadInteractions();
    };

    loadRecommendationsAndDeals();
  }, []);

  useEffect(() => {
    const initializeRecommendationNode = async () => {
      const ydoc = new Y.Doc();
      const wsProvider = new WebsocketProvider(getRandomWebSocketURL(), 'recommendations', ydoc);
      
      const node = new RecommendationNode(ydoc, wsProvider);
      setRecommendationNode(node);
    };

    initializeRecommendationNode();
  }, []);

  const handleDealClick = (dealId: string) => {
    if (recommendationNode) {
      recommendationNode.broadcastInteraction(dealId, 2);
    }
  };

  const handleDealView = (dealId: string) => {
    if (recommendationNode) {
      recommendationNode.broadcastInteraction(dealId, 1);
    }
  };

  const handleViewDeals = (merchantName: string) => {
    navigate(`/merchant-deals/${encodeURIComponent(merchantName)}`);
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#000000', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 style={{ color: '#f05e23', margin: 0 }}>Deals for you</h2>
      </div>
      
      {recommendations.length > 0 ? (
        <div>
          {recommendations.slice(0, 10).map((recommendation, index) => {
            const deal = deals[recommendation.dealId];
            if (!deal) return null;

            return (
              <div key={index} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#1A202C', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', marginRight: '1rem', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img 
                      src={deal.logoAbsoluteUrl || deal.logo} 
                      alt={`${deal.merchantName} logo`} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <p style={{ color: '#f05e23', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{deal.merchantName}</p>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button 
                    style={{
                      backgroundColor: '#f05e23',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                    onClick={() => handleViewDeals(deal.merchantName)}
                  >
                    View Deals
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: '#A0AEC0' }}>Please reload app to see your deals.</p>
      )}
    </div>
  );
};

export default DealsComponent;


