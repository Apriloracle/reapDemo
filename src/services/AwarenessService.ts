import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { Metrics } from 'tinybase/metrics';

type Provider = WebrtcProvider | WebsocketProvider;

class AwarenessService {
  private static instance: AwarenessService;
  private awareness: Provider['awareness'] | null = null;
  private provider: Provider | null = null;
  private metrics: Metrics | null = null;
  private metricListenerId: string | null = null;
  private changeHandler: ((changes: any, origin: any) => void) | null = null;

  private constructor() {}

  public static getInstance(): AwarenessService {
    if (!AwarenessService.instance) {
      AwarenessService.instance = new AwarenessService();
    }
    return AwarenessService.instance;
  }

  public initialize(provider: Provider, metrics: Metrics) {
    if (this.provider) {
      return; // Already initialized
    }

    this.provider = provider;
    this.awareness = provider.awareness;
    this.metrics = metrics;

    this.changeHandler = (changes: { added: number[], updated: number[], removed: number[] }, origin: string) => {
      if (origin === 'local') {
        return; // Ignore local changes
      }
      
      if (this.awareness) {
        const states = this.awareness.getStates();
        console.log('Awareness changed, states:', Array.from(states.values()));
      }
    };

    this.awareness.on('change', this.changeHandler);

    // Set initial state and listen for changes
    this.setupMetricBroadcasting();
  }

  private setupMetricBroadcasting() {
    if (!this.metrics || !this.awareness) return;

    // Set the initial value
    const initialCount = this.metrics.getMetric('coordinateCount');
    this.awareness.setLocalStateField('user', {
      coordinateCount: initialCount,
      origin: 'local',
    });

    // Listen for changes to the metric
    this.metricListenerId = this.metrics.addMetricListener('coordinateCount', (
      metrics,
      metricId,
      newValue
    ) => {
      if (this.awareness) {
        this.awareness.setLocalStateField('user', {
          coordinateCount: newValue,
          origin: 'local',
        });
      }
    });
  }

  public destroy() {
    if (this.awareness && this.changeHandler) {
      this.awareness.off('change', this.changeHandler);
    }
    if (this.metrics && this.metricListenerId) {
      this.metrics.delListener(this.metricListenerId);
    }
    this.provider = null;
    this.awareness = null;
    this.metrics = null;
    this.changeHandler = null;
  }
}

export default AwarenessService;
