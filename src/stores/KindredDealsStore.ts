import { createStore, Store } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface Deal {
  id: string;
  dealId: string;
  merchantName: string;
  logo: string;
  logoAbsoluteUrl: string;
  cashbackType: string;
  cashback: number;
  currency: string;
  domains: string[];
  countries: string[];
  codes: any[];
  startDate: string;
  endDate: string;
}

const store = createStore();
const persister = typeof window !== 'undefined'
  ? createLocalPersister(store, 'kindred-deals')
  : null;

export const fetchAndStoreDeals = async (countryCode: string) => {
  console.log('Fetching deals with country code:', countryCode);
  try {
    const response = await fetch(`https://asia-southeast1-fourth-buffer-421320.cloudfunctions.net/kindredMerchant?countryCode=${countryCode}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch deals: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data: Deal[] = await response.json();
    
    const dealsTable: Record<string, Record<string, string | number | boolean>> = {};

    data.forEach(deal => {
      dealsTable[deal.id] = {
        dealId: deal.dealId,
        merchantName: deal.merchantName,
        logo: deal.logo,
        logoAbsoluteUrl: deal.logoAbsoluteUrl,
        cashbackType: deal.cashbackType,
        cashback: deal.cashback,
        currency: deal.currency,
        domains: JSON.stringify(deal.domains),
        countries: JSON.stringify(deal.countries),
        codes: JSON.stringify(deal.codes),
        startDate: deal.startDate,
        endDate: deal.endDate
      };
    });

    store.setTable('deals', dealsTable);
    store.setValue('lastFetchTime', Date.now());

    const updateCoordinates = addCoordinateToStore(store, 'deals');
    await updateCoordinates();

    if (persister) {
      await persister.save();
    }
  } catch (err) {
    console.error('Error fetching deals:', err);
  }
};

export const loadOrFetchDeals = async (countryCode: string) => {
  if (persister) {
    await persister.load();
  }
  const lastFetchTime = store.getValue('lastFetchTime') as number | undefined;
  const currentTime = Date.now();

  if (!lastFetchTime || currentTime - lastFetchTime > CACHE_DURATION) {
    console.log('Fetching new deals data');
    await fetchAndStoreDeals(countryCode);
  } else {
    console.log('Using cached deals data');
  }
};

export const getDealsStore = (): Store => store;
