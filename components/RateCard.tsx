import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react-native';
import { RateData } from '../types';

interface RateCardProps {
    rate: RateData;
    previousRate?: RateData;
    isStale: boolean;
}

export const RateCard: React.FC<RateCardProps> = ({ rate, previousRate, isStale }) => {
    const diff = previousRate ? rate.price - previousRate.price : 0;

    return (
        <View style={[
            styles.container,
            isStale ? styles.staleBorder : styles.freshBorder
        ]}>
            <View style={styles.header}>
                <Text style={styles.price}>
                    {rate.price.toLocaleString('ru-RU')}
                </Text>
                <Text style={styles.label}>
                    {rate.label}
                </Text>
            </View>

            <View style={styles.footer}>
                {diff !== 0 ? (
                    <View style={styles.diffContainer}>
                        <View style={[
                            styles.iconContainer,
                            diff > 0 ? styles.bgGreen : styles.bgRed
                        ]}>
                            {diff > 0 ?
                                <ArrowUp size={14} color="#15803d" strokeWidth={3} /> :
                                <ArrowDown size={14} color="#b91c1c" strokeWidth={3} />
                            }
                        </View>
                        <Text style={[
                            styles.diffText,
                            diff > 0 ? styles.textGreen : styles.textRed
                        ]}>
                            {Math.abs(diff).toLocaleString('ru-RU')} ₸
                        </Text>
                    </View>
                ) : (
                    <View style={styles.noChangeContainer}>
                        <View style={styles.minusContainer}>
                            <Minus size={14} color="#94a3b8" />
                        </View>
                        <Text style={styles.noChangeText}>Без изменений</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    freshBorder: {
        borderColor: '#22c55e', // green-500
        backgroundColor: '#f0fdf4', // green-50
    },
    staleBorder: {
        borderColor: '#facc15', // yellow-400
        backgroundColor: '#fefce8', // yellow-50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1e293b', // slate-800
        letterSpacing: -1,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748b', // slate-500
        fontFamily: 'monospace',
    },
    footer: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
    },
    diffContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgGreen: { backgroundColor: '#bbf7d0' }, // green-200
    bgRed: { backgroundColor: '#fecaca' }, // red-200
    textGreen: { color: '#15803d', fontWeight: 'bold', fontSize: 16 }, // green-700
    textRed: { color: '#b91c1c', fontWeight: 'bold', fontSize: 16 }, // red-700
    diffText: {
        fontFamily: 'monospace',
    },
    noChangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    minusContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#e2e8f0', // slate-200
        alignItems: 'center',
        justifyContent: 'center',
    },
    noChangeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8', // slate-400
    }
});
