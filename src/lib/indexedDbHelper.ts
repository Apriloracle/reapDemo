// src/lib/indexedDbHelper.ts

const DB_NAME = 'ReapUpgradeDB';
const DB_VERSION = 1;
const STORE_NAME = 'KeyValueStore';

export let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('Error opening IndexedDB.');
    };
  });
}

export async function set(key: string, value: any): Promise<void> {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error(`Error setting key "${key}" in IndexedDB:`, (event.target as IDBRequest).error);
      reject(`Error setting key "${key}".`);
    };
  });
}

export async function get<T>(key: string): Promise<T | undefined> {
  const dbInstance = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as T | undefined);
    };

    request.onerror = (event) => {
      console.error(`Error getting key "${key}" from IndexedDB:`, (event.target as IDBRequest).error);
      reject(`Error getting key "${key}".`);
    };
  });
}

const ANCHORS_KEY = 'discoveryEngineAnchors';

export async function saveAnchors(anchors: any[]): Promise<void> {
  return set(ANCHORS_KEY, anchors);
}

export async function loadAnchors(): Promise<any[] | undefined> {
  return get<any[]>(ANCHORS_KEY);
}
