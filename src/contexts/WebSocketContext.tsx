'use client';

import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { open as openYstream } from '../lib/y-stream';
import { YSTREAM_CONFIG } from '../lib/y-stream/config';
import { WebSocketComm } from '../lib/y-stream/comms/websocket';
import { COLLECTION_CONFIG } from '../config/collection';
import { bindydoc } from '../lib/y-stream/bindydoc';
import AwarenessService from '../services/AwarenessService';
import { getCoordinateMetrics, initializeCoordinateIndexStore } from '../stores/CoordinateIndexStore';

interface WebSocketContextType {
  provider: WebrtcProvider | null;
  ydoc: Y.Doc | null;
  ystream: any | null;
  clustersMap: Y.Map<any> | null;
  globalProvider: WebrtcProvider | null;
  globalYDoc: Y.Doc | null;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const providerRef = useRef<WebrtcProvider | null>(null);
  const globalProviderRef = useRef<WebrtcProvider | null>(null);
  const [ydoc] = useState(() => new Y.Doc());
  const [globalYDoc] = useState(() => new Y.Doc());
  const [ystream, setYstream] = useState<any | null>(null);
  const clustersMap = ydoc.getMap('clusters');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const signalingServer = 'wss://webrtcserver-50775725716.asia-southeast1.run.app/';
    const peerOpts = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    };

    // Initialize primary WebRTC provider
    providerRef.current = new WebrtcProvider('u-interactions', ydoc, { signaling: [signalingServer], peerOpts });

    // Initialize global WebRTC provider for awareness
    globalProviderRef.current = new WebrtcProvider('global', globalYDoc, { signaling: [signalingServer], peerOpts });

    // Initialize AwarenessService with the global provider and metrics
    const initializeAwareness = async () => {
      if (!globalProviderRef.current) return;
      await initializeCoordinateIndexStore();
      const metrics = getCoordinateMetrics();
      AwarenessService.getInstance().initialize(globalProviderRef.current, metrics);
    };
    
    const onSync = () => {
      console.log('WebRTC provider synced. Initializing AwarenessService.');
      setIsConnected(true);
      initializeAwareness();
    };

    globalProviderRef.current.on('synced', onSync);

    // Add diagnostic event listeners
    globalProviderRef.current.on('status', (event: { connected: boolean }) => {
      console.log('WebRTC provider status:', event.connected ? 'connected' : 'disconnected');
    });

    // Initialize Ystream
    const initYstreamInstance = async () => {
      try {
        const websocketServer = 'wss://websocketdocker-50775725716.asia-southeast1.run.app/';
        const wsComm = new WebSocketComm(websocketServer, {
          owner: COLLECTION_CONFIG.owner,
          name: COLLECTION_CONFIG.name
        });

        const ystreamInstance = await openYstream('recommendations-db', {
          ...YSTREAM_CONFIG,
          comms: [wsComm]
        });

        if (ystreamInstance) {
          await bindydoc(
            ystreamInstance,
            COLLECTION_CONFIG.owner,
            COLLECTION_CONFIG.name,
            'clusters',
            ydoc
          );
          
          setYstream(ystreamInstance);
        }
      } catch (error) {
        console.error('Failed to initialize Ystream:', error);
      }
    };

    initYstreamInstance();

    // Cleanup
    const cleanup = () => {
      const provider = providerRef.current;
      const globalProvider = globalProviderRef.current;

      if (globalProvider) {
        globalProvider.off('synced', onSync);
        globalProvider.destroy();
      }
      if (provider) {
        provider.destroy();
      }
      if (ystream) {
        ystream.destroy();
      }
      AwarenessService.getInstance().destroy();
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [ydoc, globalYDoc]);

  return (
    <WebSocketContext.Provider value={{ provider: providerRef.current, ydoc, ystream, clustersMap, globalProvider: globalProviderRef.current, globalYDoc }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
