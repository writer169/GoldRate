import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { differenceInHours, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';

import { ApiResponse, RateData } from './types';
import { fetchRates } from './services/api';
import { RateCard } from './components/RateCard';
import { DigitAnalysis } from './components/DigitAnalysis';
import { useWakeLock } from './hooks/useWakeLock';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import * as Updates from 'expo-updates';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchFailed, setLastFetchFailed] = useState<boolean>(false);

  useWakeLock();

  // NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRates();
      setData(result);
      setLastFetchFailed(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      setError(errorMessage);
      setLastFetchFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRefreshPress = () => {
    if (!loading) {
      loadData();
    }
  };

  useAutoUpdate(async () => {
    if (!__DEV__) {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('OTA update found – applying...');
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return;
        }
      } catch (e) {
        console.warn('OTA check failed', e);
      }
    }
    await loadData();
  });

  const getSortedRates = (rates: RateData[]) => {
    return [...rates].sort((a, b) => Number(b.code) - Number(a.code));
  };

  const isStale = (dateString?: string) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    return differenceInHours(new Date(), date) >= 12;
  };

  const formatKZDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const kzTime = new Date(utc + (3600000 * 5));
      return format(kzTime, 'dd.MM.yyyy HH:mm', { locale: ru });
    } catch (e) {
      return '';
    }
  };

  const currentRates = data ? getSortedRates(data.current) : [];
  const prevRates = data ? getSortedRates(data.previous) : [];
  const stale = isStale(data?.lastUpdated);

  const headerBaseClass = styles.header;
  const headerBg = loading ? '#e2e8f0' : stale ? '#fef9c3' : '#dcfce7';
  const headerTextColor = stale ? '#713f12' : '#14532d';

  if (error && !data) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[headerBaseClass, { backgroundColor: headerBg }]}>
        <View style={styles.headerContent}>
          {!stale && !loading && (
            <Text style={styles.headerLabel}>АКТУАЛЬНО</Text>
          )}
          <Text style={[styles.headerDate, { color: headerTextColor }]}>
            {data?.lastUpdated ? formatKZDate(data.lastUpdated) : 'Загрузка...'}
          </Text>
        </View>
        <View style={styles.iconsRow}>
          {lastFetchFailed && (
            <View style={styles.iconBox}>
              {isOnline ? <Wifi size={20} color="#000" /> : <WifiOff size={20} color="#dc2626" />}
            </View>
          )}
          <TouchableOpacity 
            style={styles.iconBox} 
            onPress={handleRefreshPress}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="#000" /> : <RefreshCw size={20} color="#000" />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.cardsStack}>
          {currentRates.map((rate) => {
            const previousRate = prevRates.find(p => p.code === rate.code);
            return (
              <RateCard
                key={rate.code}
                rate={rate}
                previousRate={previousRate}
                isStale={stale}
              />
            );
          })}
        </View>

        {data && data.previous.length > 0 && (
          <View style={styles.analysisContainer}>
            <DigitAnalysis current={data.current} previous={data.previous} />
          </View>
        )}

        {data && data.previous.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerTitle}>ПРЕДЫДУЩИЕ ЦЕНЫ</Text>
              {data.previousUpdated && (
                <Text style={styles.footerDate}>{formatKZDate(data.previousUpdated)}</Text>
              )}
            </View>
            <View style={styles.footerGrid}>
              {prevRates.map(r => (
                <View key={r.code} style={styles.footerItem}>
                  <Text style={styles.footerItemLabel}>{r.label}</Text>
                  <Text style={styles.footerItemPrice}>{r.price}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.brandText}>Аванс Ломбард</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f1f5f9',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'col',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    opacity: 0.5,
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  cardsStack: {
    gap: 8,
  },
  analysisContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  footerDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerItem: {
    minWidth: '30%',
    marginBottom: 8,
  },
  footerItemLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  footerItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  brandText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    opacity: 0.7,
  }
});