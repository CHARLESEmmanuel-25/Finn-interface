import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MarketSectorsScreen() {
  const topSectors = [
    { name: 'Finance', icon: '🏦', color: '#4CD964' },
    { name: 'Technology', icon: '💻', color: '#8B5CF6' },
    { name: 'Utilities', icon: '⚡', color: '#FFCC00' },
    { name: 'Healthcare', icon: '🏥', color: '#FF3B30' },
    { name: 'Energy', icon: '⛽', color: '#FF9500' },
    { name: 'Consumer', icon: '🛒', color: '#5AC8FA' },
  ];

  const allSectors = [
    { name: 'Business', icon: '💼', color: '#8B5CF6' },
    { name: 'Energy', icon: '⚡', color: '#FF9500' },
    { name: 'Healthcare', icon: '🏥', color: '#FF3B30' },
    { name: 'Finance', icon: '🏦', color: '#4CD964' },
    { name: 'Technology', icon: '💻', color: '#8B5CF6' },
    { name: 'Consumer', icon: '🛒', color: '#5AC8FA' },
    { name: 'Utilities', icon: '⚡', color: '#FFCC00' },
    { name: 'Materials', icon: '🏭', color: '#FF6B6B' },
    { name: 'Real Estate', icon: '🏠', color: '#4ECDC4' },
    { name: 'Communication', icon: '📱', color: '#45B7D1' },
    { name: 'Industrial', icon: '🏗️', color: '#96CEB4' },
    { name: 'Transportation', icon: '🚚', color: '#FFEAA7' },
  ];

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
        {/* Top Sectors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Sectors</Text>
          <View style={styles.sectorsGrid}>
            {topSectors.map((sector, index) => (
              <SectorCard 
                key={index}
                sector={sector}
                onPress={() => handleSectorPress(sector)}
              />
            ))}
          </View>
        </View>

        {/* All Market Sectors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Market Sectors</Text>
          <View style={styles.sectorsGrid}>
            {allSectors.map((sector, index) => (
              <SectorCard 
                key={index}
                sector={sector}
                onPress={() => handleSectorPress(sector)}
              />
            ))}
          </View>
        </View>

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour les cartes de secteur
const SectorCard = ({ sector, onPress }: any) => (
  <TouchableOpacity style={styles.sectorCard} onPress={onPress}>
    <View style={[styles.sectorIcon, { backgroundColor: sector.color + '20' }]}>
      <Text style={styles.sectorEmoji}>{sector.icon}</Text>
    </View>
    <Text style={styles.sectorName}>{sector.name}</Text>
  </TouchableOpacity>
);

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
});
