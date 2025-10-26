import React, { useState } from 'react';
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

export default function FilterScreen() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const generalCriteria = [
    { id: 'lowest-price', title: 'Lowest Price', description: 'Stocks with lowest current price' },
    { id: 'high-dividend', title: 'High Dividend Yield', description: 'Stocks with high dividend yield' },
    { id: 'dividend-growth', title: 'Dividend Growth', description: 'Stocks with consistent dividend growth' },
  ];

  const financialIndicators = [
    { id: 'low-pe', title: 'Low P/E Ratio', description: 'Stocks with low price-to-earnings ratio' },
    { id: 'avg-ebitda', title: 'Average EBITDA', description: 'Stocks with average EBITDA margin' },
    { id: 'low-pb', title: 'Low P/B Ratio', description: 'Stocks with low price-to-book ratio' },
    { id: 'revenue-growth', title: 'Revenue Growth', description: 'Stocks with strong revenue growth' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const selectAll = (filters: any[]) => {
    const filterIds = filters.map(f => f.id);
    setSelectedFilters(prev => [...new Set([...prev, ...filterIds])]);
  };

  const clearAll = () => {
    setSelectedFilters([]);
  };

  const applyFilters = () => {
    console.log('Filtres appliqués:', selectedFilters);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sort & Filter</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* General Criteria */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General Criteria</Text>
            <TouchableOpacity onPress={() => selectAll(generalCriteria)}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filtersList}>
            {generalCriteria.map((filter) => (
              <FilterItem 
                key={filter.id}
                filter={filter}
                isSelected={selectedFilters.includes(filter.id)}
                onToggle={() => toggleFilter(filter.id)}
              />
            ))}
          </View>
        </View>

        {/* Financial Indicators */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Indicators</Text>
            <TouchableOpacity onPress={() => selectAll(financialIndicators)}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filtersList}>
            {financialIndicators.map((filter) => (
              <FilterItem 
                key={filter.id}
                filter={filter}
                isSelected={selectedFilters.includes(filter.id)}
                onToggle={() => toggleFilter(filter.id)}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour les éléments de filtre
const FilterItem = ({ filter, isSelected, onToggle }: any) => (
  <TouchableOpacity style={styles.filterItem} onPress={onToggle}>
    <View style={styles.filterItemLeft}>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Ionicons name="checkmark" size={16} color="#000" />}
      </View>
      <View style={styles.filterContent}>
        <Text style={styles.filterTitle}>{filter.title}</Text>
        <Text style={styles.filterDescription}>{filter.description}</Text>
      </View>
    </View>
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
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  
  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Liste des filtres
  filtersList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  filterItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterContent: {
    flex: 1,
  },
  filterTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  filterDescription: {
    color: '#A9A9A9',
    fontSize: 12,
  },
  
  // Actions
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
  clearButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});
