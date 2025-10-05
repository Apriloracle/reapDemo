import { createStore, Store } from 'tinybase';
import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import { addCoordinateToStore } from '../lib/storeCoordinates';

class DeviceDataStore {
  private store: Store;
  private persister: any;
  private static instance: DeviceDataStore;

  private constructor() {
    this.store = createStore();
    if (typeof window !== 'undefined') {
      this.persister = createLocalPersister(this.store, 'device-data');
    }
  }

  public static getInstance(): DeviceDataStore {
    if (!DeviceDataStore.instance) {
      DeviceDataStore.instance = new DeviceDataStore();
    }
    return DeviceDataStore.instance;
  }

  private async getDeviceData(): Promise<any> {
    const deviceData: any = {};

    // Device information
    deviceData.deviceType = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop';
    deviceData.os = navigator.platform;
    deviceData.browser = navigator.userAgent;

    // Time-based information
    const now = new Date();
    deviceData.timeOfDay = now.getHours();
    deviceData.dayOfWeek = now.getDay();
    deviceData.month = now.getMonth();

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      deviceData.connectionType = connection.effectiveType;
      deviceData.networkSpeed = connection.downlink;
    }

    // Screen properties
    deviceData.screenWidth = window.screen.width;
    deviceData.screenHeight = window.screen.height;
    deviceData.colorDepth = window.screen.colorDepth;

    // Language and locale
    deviceData.language = navigator.language;
    deviceData.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Battery status
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        deviceData.batteryLevel = battery.level;
        deviceData.isCharging = battery.charging;
      } catch (error) {
        console.error('Could not retrieve battery status:', error);
      }
    }

    return deviceData;
  }

  public async fetchAndStoreDeviceData() {
    const deviceData = await this.getDeviceData();
    this.store.setTable('deviceData', { current: deviceData });

    const updateCoordinates = addCoordinateToStore(this.store, 'deviceData');
    await updateCoordinates();

    if (this.persister) {
      await this.persister.save();
    }

    // Temporary log for verification
    console.log('DeviceDataStore data with coordinates:', this.store.getTable('deviceData'));
  }

  public getStore(): Store {
    return this.store;
  }
}

export const deviceDataStore = DeviceDataStore.getInstance();
