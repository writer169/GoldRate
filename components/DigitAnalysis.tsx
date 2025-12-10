import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RateData, DigitCounts } from '../types';

interface DigitAnalysisProps {
    current: RateData[];
    previous: RateData[];
}

export const DigitAnalysis: React.FC<DigitAnalysisProps> = ({ current, previous }) => {
    const diffs = useMemo(() => {
        const normalizeDigit = (char: string) => char === '9' ? '6' : char;

        const countDigits = (rates: RateData[]) => {
            const counts: DigitCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 };
            rates.forEach(r => {
                const strPrice = r.price.toString();
                for (const char of strPrice) {
                    const d = normalizeDigit(char);
                    if (counts[d] === undefined) counts[d] = 0;
                    counts[d]++;
                }
            });
            return counts;
        };

        const currentCounts = countDigits(current);
        const prevCounts = countDigits(previous);

        const needed: { digit: string; count: number }[] = [];
        const digitsToCheck = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];

        for (const d of digitsToCheck) {
            const diff = (currentCounts[d] || 0) - (prevCounts[d] || 0);
            if (diff > 0) {
                needed.push({ digit: d, count: diff });
            }
        }

        return { needed };
    }, [current, previous]);

    if (diffs.needed.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Обновление Табло (Добавить)</Text>

            <View style={styles.digitsRow}>
                {diffs.needed.map(({ digit, count }) => {
                    return Array.from({ length: count }, (_, index) => (
                        <View key={`${digit}-${index}`} style={styles.digitBox}>
                            <Text style={styles.digitText}>{digit}</Text>
                        </View>
                    ));
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#64748b',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 6,
        marginBottom: 8,
    },
    digitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    digitBox: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 6,
        minWidth: 40,
        alignItems: 'center',
    },
    digitText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
    }
});
