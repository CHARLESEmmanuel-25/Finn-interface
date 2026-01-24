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
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSectors, type Sector } from '../services/api';

// Couleurs par défaut pour les secteurs
const sectorColors: { [key: string]: string } = {
  'Technology': '#8B5CF6',
  'Technologies': '#8B5CF6',
  'Finance': '#4CD964',
  'Healthcare': '#FF3B30',
  'Energy': '#FF9500',
  'Consumer': '#5AC8FA',
  'Consumer Cyclical': '#5AC8FA',
  'Utilities': '#FFCC00',
  'Communication Services': '#45B7D1',
  'Industrials': '#96CEB4',
  'Services': '#4ECDC4',
};

export default function MarketSectorsScreen() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      setLoading(true);
      const sectorsData = await fetchSectors();
      setSectors(sectorsData);
    } catch (error) {
      console.error('Erreur lors du chargement des secteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Top secteurs (premiers 6)
  const topSectors = sectors.slice(0, 6);
  // Tous les secteurs
  const allSectors = sectors;

  const handleSectorPress = (sector: any) => {
    console.log(`Secteur sélectionné: ${sector.name}`);
    // Ici vous pouvez naviguer vers une page détaillée du secteur
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
          <>
            {/* Top Sectors */}
            {topSectors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Sectors</Text>
                <View style={styles.sectorsGrid}>
                  {topSectors.map((sector) => (
                    <SectorCard 
                      key={sector._id}
                      sector={sector}
                      onPress={() => handleSectorPress(sector)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* All Market Sectors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Market Sectors</Text>
              <View style={styles.sectorsGrid}>
                {allSectors.map((sector) => (
                  <SectorCard 
                    key={sector._id}
                    sector={sector}
                    onPress={() => handleSectorPress(sector)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour les cartes de secteur
const SectorCard = ({ sector, onPress }: { sector: Sector; onPress: () => void }) => {
  const color = sectorColors[sector.name] || '#8B5CF6';
  return (
    <TouchableOpacity style={styles.sectorCard} onPress={onPress}>
      <View style={[styles.sectorIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.sectorEmoji}>{sector.logo || '📊'}</Text>
      </View>
      <Text style={styles.sectorName}>{sector.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  sectorEmoji: {
    fontSize: 24,
  },
  sectorName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
