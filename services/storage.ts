import AsyncStorage from '@react-native-async-storage/async-storage';
import { RateData } from '../types';

const STORAGE_KEYS = {
    CURRENT: 'rates_current',
    PREVIOUS: 'rates_previous',
    TIMESTAMP: 'rates_timestamp',
    PREVIOUS_TIMESTAMP: 'rates_previous_timestamp'
};

export const storage = {
    async getCurrentRecord() {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT);
            const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.TIMESTAMP);
            return data ? { rates: JSON.parse(data) as RateData[], timestamp: timestamp } : null;
        } catch (e) {
            console.error('Error reading current rates', e);
            return null;
        }
    },

    async getPreviousRecord() {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PREVIOUS);
            const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.PREVIOUS_TIMESTAMP);
            return data ? { rates: JSON.parse(data) as RateData[], timestamp: timestamp } : null;
        } catch (e) {
            console.error('Error reading previous rates', e);
            return null;
        }
    },

    async updateRates(newRates: RateData[]): Promise<boolean> {
        const currentRecord = await this.getCurrentRecord();
        let hasChanged = false;

        if (!currentRecord) {
            await AsyncStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify(newRates));
            await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
            hasChanged = true;
        } else {
            const currentRates = currentRecord.rates;
            const currentMap = new Map(currentRates.map(r => [r.code, r.price]));
            const newMap = new Map(newRates.map(r => [r.code, r.price]));

            if (currentMap.size !== newMap.size) {
                hasChanged = true;
            } else {
                for (const [code, price] of newMap) {
                    if (currentMap.get(code) !== price) {
                        hasChanged = true;
                        break;
                    }
                }
            }

            if (hasChanged) {
                await AsyncStorage.setItem(STORAGE_KEYS.PREVIOUS, JSON.stringify(currentRates));
                await AsyncStorage.setItem(STORAGE_KEYS.PREVIOUS_TIMESTAMP, currentRecord.timestamp || new Date().toISOString());

                await AsyncStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify(newRates));
                await AsyncStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
            }
        }
        return hasChanged;
    }
};
