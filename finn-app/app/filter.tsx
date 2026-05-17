import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStocks, Stock, formatPrice, formatMarketCap } from '@/services/api';
import { GREEN, RED } from '@/constants/glass';

export default function FilterScreen() {
  const [minPER, setMinPER] = useState('');
  const [maxPER, setMaxPER] = useState('');
  const [minDividend, setMinDividend] = useState('');
  const [minPerfDay, setMinPerfDay] = useState('');
  const [maxPerfDay, setMaxPerfDay] = useState('');
  const [country, setCountry] = useState('');
  const [sector, setSector] = useState('');

  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const params: Record<string, any> = {};
      if (minPER) params.minPER = parseFloat(minPER);
      if (maxPER) params.maxPER = parseFloat(maxPER);
      if (minDividend) params.minDividendYield = parseFloat(minDividend);
      if (minPerfDay) params.minPerfDay = parseFloat(minPerfDay);
      if (maxPerfDay) params.maxPerfDay = parseFloat(maxPerfDay);
      if (country.trim()) params.country = country.trim();
      if (sector.trim()) params.sector = sector.trim();
      const data = await screenStocks(params);
      setResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la recherche');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMinPER(''); setMaxPER(''); setMinDividend('');
    setMinPerfDay(''); setMaxPerfDay('');
    setCountry(''); setSector('');
    setResults([]); setHasSearched(false); setError('');
  };

  const handleStockPress = (stock: Stock) => {
    router.push({
      pathname: '/company-profile',
      params: {
        symbol: stock.symbol,
        name: stock.shortName,
        price: stock.currentPrice.toFixed(2),
        change: stock.percentVar.toFixed(2),
        logo: stock.logo ?? '',
        location: stock.country ?? '',
        website: stock.website ?? '',
        about: stock.summary ?? '',
        marketCap: formatMarketCap(stock.marketCap, stock.currency),
        shares: stock.sharesStats ? String(stock.sharesStats) : '0',
        revenue: '—',
        eps: stock.EPS != null ? String(stock.EPS) : '—',
        peRatio: stock.PER != null ? String(stock.PER) : '—',
        dividend: stock.dividendYield != null ? `${stock.dividendYield.toFixed(2)}%` : '0.00%',
        currency: stock.currency,
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Screener</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Filtres numériques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valorisation</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>PER min</Text>
              <TextInput
                style={styles.input}
                value={minPER}
                onChangeText={setMinPER}
                placeholder="ex: 5"
                placeholderTextColor="#555"
                keyboardType="numeric"
                keyboardAppearance="dark"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>PER max</Text>
              <TextInput
                style={styles.input}
                value={maxPER}
                onChangeText={setMaxPER}
                placeholder="ex: 30"
                placeholderTextColor="#555"
                keyboardType="numeric"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Perf. jour min (%)</Text>
              <TextInput
                style={styles.input}
                value={minPerfDay}
                onChangeText={setMinPerfDay}
                placeholder="ex: -5"
                placeholderTextColor="#555"
                keyboardType="numeric"
                keyboardAppearance="dark"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Perf. jour max (%)</Text>
              <TextInput
                style={styles.input}
                value={maxPerfDay}
                onChangeText={setMaxPerfDay}
                placeholder="ex: 5"
                placeholderTextColor="#555"
                keyboardType="numeric"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.fullField}>
            <Text style={styles.label}>Rendement dividende min (%)</Text>
            <TextInput
              style={styles.input}
              value={minDividend}
              onChangeText={setMinDividend}
              placeholder="ex: 2"
              placeholderTextColor="#555"
              keyboardType="numeric"
              keyboardAppearance="dark"
            />
          </View>
        </View>

        {/* Filtres texte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Géographie & Secteur</Text>
          <View style={styles.fullField}>
            <Text style={styles.label}>Pays</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="ex: France"
              placeholderTextColor="#555"
              keyboardAppearance="dark"
            />
          </View>
          <View style={styles.fullField}>
            <Text style={styles.label}>Secteur</Text>
            <TextInput
              style={styles.input}
              value={sector}
              onChangeText={setSector}
              placeholder="ex: Technology"
              placeholderTextColor="#555"
              keyboardAppearance="dark"
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.applyButtonText}>Rechercher</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Résultats */}
        {hasSearched && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {results.length > 0 ? `${results.length} résultats` : 'Aucun résultat'}
            </Text>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              results.map(stock => {
                const isPos = stock.percentVar >= 0;
                return (
                  <TouchableOpacity
                    key={stock._id}
                    style={styles.resultItem}
                    onPress={() => handleStockPress(stock)}
                  >
                    <View style={styles.resultLogoBox}>
                      <Text style={styles.resultLogoText}>{stock.symbol}</Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName} numberOfLines={1}>{stock.shortName}</Text>
                      <Text style={styles.resultMeta}>{stock.sector} · {stock.country}</Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultPrice}>{formatPrice(stock.currentPrice, stock.currency)}</Text>
                      <Text style={[styles.resultPerf, { color: isPos ? GREEN : RED }]}>
                        {isPos ? '+' : ''}{stock.percentVar.toFixed(2)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  scrollView: { flex: 1 },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginBottom: 14 },

  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfField: { flex: 1 },
  fullField: { marginBottom: 12 },
  label: { color: '#A9A9A9', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  actionsSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  clearButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  clearButtonText: { color: '#8B5CF6', fontSize: 15, fontWeight: '600' },
  applyButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  errorText: { color: '#EF4444', fontSize: 14, marginTop: 8 },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  resultLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultLogoText: { color: '#8B5CF6', fontSize: 11, fontWeight: '700' },
  resultInfo: { flex: 1 },
  resultName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  resultMeta: { color: '#A9A9A9', fontSize: 11, marginTop: 2 },
  resultRight: { alignItems: 'flex-end' },
  resultPrice: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  resultPerf: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  bottomSpacer: { height: 100 },
});
