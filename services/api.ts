import { RateData, ApiResponse } from '../types';
import { storage } from './storage';

const EXTERNAL_API = 'https://m-lombard.kz/ru/api/admin/purities/?format=json';

export const fetchRates = async (): Promise<ApiResponse> => {
    try {
        const currentRecord = await storage.getCurrentRecord();
        const previousRecord = await storage.getPreviousRecord();

        try {
            const response = await fetch(EXTERNAL_API);
            if (response.ok) {
                const newRates: RateData[] = await response.json();

                await storage.updateRates(newRates);

                const updatedCurrent = await storage.getCurrentRecord();
                const updatedPrevious = await storage.getPreviousRecord();

                return {
                    current: updatedCurrent?.rates || newRates,
                    previous: updatedPrevious?.rates || [],
                    lastUpdated: updatedCurrent?.timestamp || new Date().toISOString(),
                    previousUpdated: updatedPrevious?.timestamp || undefined
                };
            }
        } catch (fetchError) {
            console.warn('Network request failed, using cache', fetchError);
        }

        if (currentRecord) {
            return {
                current: currentRecord.rates,
                previous: previousRecord?.rates || [],
                lastUpdated: currentRecord.timestamp || new Date().toISOString(),
                previousUpdated: previousRecord?.timestamp || undefined
            };
        }

        throw new Error('No data available. Please check your internet connection.');
    } catch (error) {
        console.error('fetchRates error:', error);
        throw error;
    }
};

export const initializeDatabase = async () => {
    // No-op for AsyncStorage as it doesn't need init like IDB
};
