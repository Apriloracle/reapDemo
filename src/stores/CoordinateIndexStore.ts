import { createStore, Store } from 'tinybase';
import { createIndexes, Indexes } from 'tinybase/indexes';
import { createMetrics, Metrics } from 'tinybase/metrics';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';

// 1. Create a single, global store instance.
const store = createStore();
const persister = typeof window !== 'undefined' 
  ? createLocalPersister(store, 'coordinate-index')
  : null;

// 2. Create an Indexes object for the store.
const indexes = createIndexes(store);

// 3. Define the structure of our master table.
export const COORDINATES_TABLE = 'coordinates';
export const USER_ACTIONS_TABLE = 'userActions';

// 4. Define the index definitions.
export const INDEX_DEFINITIONS = {
  byCoordinate: 'coordinate',
  byType: 'type',
};

// 5. Initialize the indexes.
indexes.setIndexDefinition(
  'byCoordinate',
  COORDINATES_TABLE,
  INDEX_DEFINITIONS.byCoordinate
);
indexes.setIndexDefinition(
  'byType',
  COORDINATES_TABLE,
  INDEX_DEFINITIONS.byType
);

// 6. Create a Metrics object for the store.
const metrics = createMetrics(store);

// 7. Define the metric definitions.
metrics.setMetricDefinition(
  'coordinateCount',
  COORDINATES_TABLE
);

metrics.setMetricDefinition(
  'coordinateCapacity',
  'coordinates', // We still need to listen to a table
  () => {
    const count = metrics.getMetric('coordinateCount') as number ?? 0;
    const capacity = 10000; // Arbitrary capacity for this example
    return (count / capacity) * 100;
  }
);

let previousCoordinateCount = 0;
let coordinateIncrease = 0;

setInterval(() => {
  const currentCount = metrics.getMetric('coordinateCount') as number ?? 0;
  coordinateIncrease = currentCount - previousCoordinateCount;
  previousCoordinateCount = currentCount;
}, 10000);

metrics.setMetricDefinition(
  'coordinateIncrease',
  'coordinates',
  () => coordinateIncrease
);

/**
 * Calculate product gravity scores from user actions.
 * This returns an object mapping coordinates to their gravity scores.
 * Since TinyBase metrics must return numbers, we use a regular function instead.
 */
export const getProductGravityScores = (): { [coordinate: number]: number } => {
  const table = store.getTable(USER_ACTIONS_TABLE);
  if (!table) {
    return {};
  }
  const counts: { [coordinate: number]: number } = {};
  Object.values(table).forEach((row: any) => {
    const score = row.type === 'click' ? 4 : 1;
    counts[row.coordinate] = (counts[row.coordinate] || 0) + score;
  });
  return counts;
};

/**
 * Get the gravity score for a specific coordinate.
 * @param coordinate - The coordinate to get the score for.
 */
export const getGravityScoreForCoordinate = (coordinate: number): number => {
  const scores = getProductGravityScores();
  return scores[coordinate] || 0;
};

/**
 * Adds a user action to the store.
 * @param {object} data - The action data.
 * @param {string} data.coordinate - The coordinate associated with the action.
 * @param {'click' | 'view'} data.type - The type of action.
 */
export const addUserAction = ({ coordinate, type }: { coordinate: number; type: 'click' | 'view' }) => {
  const timestamp = Date.now();
  store.addRow(USER_ACTIONS_TABLE, {
    coordinate,
    type,
    timestamp,
  });
};

/**
 * Adds or updates a coordinate in the central index.
 * This function will be called by other stores to register their coordinates.
 * @param {object} data - The coordinate data.
 * @param {string} data.id - The unique ID of the entity.
 * @param {string} data.type - The type of the entity.
 * @param {number} data.coordinate - The coordinate of the entity.
 */
export const upsertCoordinate = ({ id, type, coordinate }: { id: string; type: string; coordinate: number }) => {
  const rowData = {
    type,
    coordinate,
  };
  store.setRow(COORDINATES_TABLE, id, rowData);
};

/**
 * Retrieves the raw Tinybase Store instance.
 */
export const getCoordinateStore = (): Store => store;

/**
 * Retrieves the Tinybase Indexes instance.
 */
export const getCoordinateIndexes = (): Indexes => indexes;

/**
 * Retrieves the Tinybase Metrics instance.
 */
export const getCoordinateMetrics = (): Metrics => metrics;

/**
 * Initializes the CoordinateIndexStore by loading persisted data.
 */
export const initializeCoordinateIndexStore = async () => {
  if (persister) {
    await persister.load();
    persister.startAutoSave();
    console.log('CoordinateIndexStore initialized from persister.');
  }
};
