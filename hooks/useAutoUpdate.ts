import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAutoUpdate = (updateFn: () => Promise<void>) => {
    const appState = useRef(AppState.currentState);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Background/Foreground handling
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App active, updating...');
                updateFn();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [updateFn]);

    // Scheduled updates logic
    useEffect(() => {
        const UPDATE_HOURS = [9, 12, 18];

        const getMillisecondsUntilNextUpdate = () => {
            const now = new Date();
            const currentHour = now.getHours();

            let nextHour = UPDATE_HOURS.find(hour => hour > currentHour);

            if (nextHour === undefined) {
                nextHour = UPDATE_HOURS[0];
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(nextHour, 0, 0, 0);
                return tomorrow.getTime() - now.getTime();
            }

            const nextUpdate = new Date(now);
            nextUpdate.setHours(nextHour, 0, 0, 0);
            return nextUpdate.getTime() - now.getTime();
        };

        const scheduleNextUpdate = () => {
            const msUntilUpdate = getMillisecondsUntilNextUpdate();

            if (intervalRef.current) clearTimeout(intervalRef.current);

            console.log(`Next update in ${Math.round(msUntilUpdate / 1000 / 60)} minutes`);

            intervalRef.current = setTimeout(async () => {
                console.log('Running scheduled update...');
                await updateFn();
                scheduleNextUpdate();
            }, msUntilUpdate);
        };

        scheduleNextUpdate();

        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current);
        };
    }, [updateFn]);
};
