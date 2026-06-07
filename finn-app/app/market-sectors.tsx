import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSectors, fetchSectorPerformance, type Sector, type SectorPerformance } from '../services/api';
import { getSectorEntry } from '../constants/sectorIcons';

export default function MarketSectorsScreen() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [perfMap, setPerfMap] = useState<Record<string, SectorPerformance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const [sectorsData, perfData] = await Promise.all([
        fetchSectors(),
        fetchSectorPerformance().catch(() => [] as SectorPerformance[]),
      ]);
      setSectors(sectorsData);
      const map: Record<string, SectorPerformance> = {};
      perfData.forEach(p => { map[p.name] = p; });
      setPerfMap(map);
    } catch (error) {
      console.error('Erreur lors du chargement des secteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const allSectors = sectors;

  const handleSectorPress = (sector: Sector) => {
    const perf = perfMap[sector.name];
    router.push({
      pathname: "/sector-detail",
      params: {
        id: sector._id,
        name: sector.name,
        ...(perf?.avgPerf != null && { avgPerf: String(perf.avgPerf) }),
        ...(perf?.totalMarketCap != null && { totalMarketCap: String(perf.totalMarketCap) }),
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Sectors</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : sectors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun secteur disponible</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tous les secteurs</Text>
            <View style={styles.sectorsGrid}>
              {allSectors.map((sector) => (
                <SectorCard
                  key={sector._id}
                  sector={sector}
                  perf={perfMap[sector.name]}
                  onPress={() => handleSectorPress(sector)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SectorCard = ({
  sector,
  perf,
  onPress,
}: {
  sector: Sector;
  perf?: SectorPerformance;
  onPress: () => void;
}) => {
  const entry = getSectorEntry(sector.name);
  const avgPerf = perf?.avgPerf;
  const isPos = avgPerf != null && avgPerf >= 0;
  return (
    <TouchableOpacity style={styles.sectorCard} onPress={onPress}>
      <View style={[styles.sectorIcon, { backgroundColor: entry.bg }]}>
        <MaterialCommunityIcons name={entry.icon} size={26} color={entry.color} />
      </View>
      <Text style={styles.sectorName}>{sector.name}</Text>
      {avgPerf != null && (
        <Text style={[styles.sectorPerf, { color: isPos ? '#22C55E' : '#EF4444' }]}>
          {isPos ? '+' : ''}{avgPerf.toFixed(2)}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // Pour centrer le titre
  },
  scrollView: {
    flex: 1,
  },
  
  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Grille des secteurs
  sectorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  sectorCard: {
    width: '30%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  sectorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectorName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectorPerf: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#A9A9A9',
    fontSize: 14,
  },
});
