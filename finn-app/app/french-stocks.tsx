import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterCategory = "Larges Caps" | "Small caps" | "Top Gagnantes" | "Plus cheres" | "Plus performnats" | "Plus Active" | "Plus valotiles" | "Penny stock" | "Plus bas " | "Plus hauts";

export default function FrenchStocks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("Larges Caps");
  const [showFilters, setShowFilters] = useState(false);

  // Filtres pour chaque catégorie
  const [filters, setFilters] = useState({
    roe: "Tout",
    roa: "Tout",
    per: "Tout",
    pb: "Tout",
    peg: "Tout",
    debtEquity: "Tout",
    debtEbitda: "Tout",
    cashRatio: "Tout",
    margeExploitation: "Tout",
    margeNette: "Tout",
  });

  const categories = [
    { key: "Larges Caps", label: "Larges Caps" },
    { key: "Small caps", label: "Small caps" },
    { key: "Top Gagnantes", label: "Top Gagnantes" },
    { key: "Plus cheres", label: "Plus cheres" },
    { key: "Plus performnats", label: "Plus performnats" },
    { key: "Plus Active", label: "Plus Active" },
    { key: "Plus valotiles", label: "Plus valotiles" },
    { key: "Penny stock", label: "Penny stock" },
    { key: "Plus bas", label: "Plus bas" },
    { key: "Plus hauts", label: "Plus hauts" },
  ];

  // Options pour les filtres basées sur les ratios
  const filterOptions = {
    roe: ["Tout", "0-10% (faible)", "10-20% (correcte)", ">20% (élevée)"],
    roa: ["Tout", "0-5% (faible)", "5-10% (moyenne)", ">10% (bonne)"],
    per: ["Tout", "<10 (sous-évalué)", "10-25 (raisonnable)", ">25 (élevé)"],
    pb: ["Tout", "<1 (sous-évalué)", "1-2 (correct)", ">2 (élevé)"],
    peg: ["Tout", "<1 (attractif)", "1-2 (raisonnable)", ">2 (cher)"],
    debtEquity: ["Tout", "<20% (faible)", "20-50% (modéré)", ">50% (élevé)"],
    debtEbitda: ["Tout", "<20% (faible)", "20-50% (modéré)", ">50% (élevé)"],
    cashRatio: ["Tout", "<0.5 (faible)", "0.5-1 (correcte)", ">1 (très bonne)"],
    margeExploitation: ["Tout", "0-10% (faible)", "10-20% (correcte)", ">20% (excellente)"],
    margeNette: ["Tout", "0-5% (faible)", "5-15% (moyenne)", ">15% (très bonne)"],
  };

  const stocksData = [
    {
      id: 1,
      symbol: "MC",
      name: "LVMH",
      market: "Paris",
      sector: "Consommation cyclique",
      industry: "Textile et habillement",
      marketCap: "264,52 Md €",
      per: "24,2x",
      peg: "-1,16",
      lastPrice: "532,80 €",
      variation: "-1,4%",
      logo: "https://logo.clearbit.com/lvmh.com",
      // Ratios pour les filtres
      roe: 22, // >20% (élevée)
      roa: 12, // >10% (bonne)
      perValue: 24.2, // 10-25 (raisonnable)
      pb: 4.5, // >2 (élevé)
      pegValue: -1.16,
      debtEquity: 35, // 20-50% (modéré)
      debtEbitda: 25, // 20-50% (modéré)
      cashRatio: 0.8, // 0.5-1 (correcte)
      margeExploitation: 28, // >20% (excellente)
      margeNette: 18, // >15% (très bonne)
    },
    {
      id: 2,
      symbol: "RMS",
      name: "Hermès International",
      market: "Paris",
      sector: "Consommation cyclique",
      industry: "Textile et habillement",
      marketCap: "213,13 Md €",
      per: "47,7x",
      peg: "84,16",
      lastPrice: "2026 €",
      variation: "-0,8%",
      logo: "https://logo.clearbit.com/hermes.com",
      roe: 35, // >20% (élevée)
      roa: 18, // >10% (bonne)
      perValue: 47.7, // >25 (élevé)
      pb: 8.2, // >2 (élevé)
      pegValue: 84.16,
      debtEquity: 15, // <20% (faible)
      debtEbitda: 12, // <20% (faible)
      cashRatio: 1.2, // >1 (très bonne)
      margeExploitation: 42, // >20% (excellente)
      margeNette: 32, // >15% (très bonne)
    },
    {
      id: 3,
      symbol: "OR",
      name: "L'Oréal",
      market: "Paris",
      sector: "Consommation non cyclique",
      industry: "Produits et services personnels",
      marketCap: "196,33 Md €",
      per: "32,3x",
      peg: "-5,81",
      lastPrice: "368,50 €",
      variation: "-0,4%",
      logo: "https://logo.clearbit.com/loreal.com",
      roe: 28, // >20% (élevée)
      roa: 14, // >10% (bonne)
      perValue: 32.3, // >25 (élevé)
      pb: 5.1, // >2 (élevé)
      pegValue: -5.81,
      debtEquity: 22, // 20-50% (modéré)
      debtEbitda: 18, // <20% (faible)
      cashRatio: 0.9, // 0.5-1 (correcte)
      margeExploitation: 19, // 10-20% (correcte)
      margeNette: 16, // >15% (très bonne)
    },
    {
      id: 4,
      symbol: "AIR",
      name: "Airbus Group",
      market: "Paris",
      sector: "Industriels",
      industry: "Aérospatiale et défense",
      marketCap: "160,75 Md €",
      per: "32,5x",
      peg: "0,54",
      lastPrice: "203,30 €",
      variation: "+0,5%",
      logo: "https://logo.clearbit.com/airbus.com",
      roe: 18, // 10-20% (correcte)
      roa: 8, // 5-10% (moyenne)
      perValue: 32.5, // >25 (élevé)
      pb: 3.2, // >2 (élevé)
      pegValue: 0.54,
      debtEquity: 45, // 20-50% (modéré)
      debtEbitda: 38, // 20-50% (modéré)
      cashRatio: 0.7, // 0.5-1 (correcte)
      margeExploitation: 8, // 0-10% (faible)
      margeNette: 6, // 5-15% (moyenne)
    },
    {
      id: 5,
      symbol: "SU",
      name: "Schneider Electric",
      market: "Paris",
      sector: "Industriels",
      industry: "Machines, outils, véhicules",
      marketCap: "138,14 Md €",
      per: "32,3x",
      peg: "2,84",
      lastPrice: "245,15 €",
      variation: "-0,7%",
      logo: "https://logo.clearbit.com/se.com",
      roe: 15, // 10-20% (correcte)
      roa: 7, // 5-10% (moyenne)
      perValue: 32.3, // >25 (élevé)
      pb: 2.8, // >2 (élevé)
      pegValue: 2.84,
      debtEquity: 52, // >50% (élevé)
      debtEbitda: 48, // 20-50% (modéré)
      cashRatio: 0.6, // 0.5-1 (correcte)
      margeExploitation: 14, // 10-20% (correcte)
      margeNette: 9, // 5-15% (moyenne)
    },
    {
      id: 6,
      symbol: "EL",
      name: "EssilorLuxottica",
      market: "Paris",
      sector: "Santé",
      industry: "Équipement et fournitures",
      marketCap: "125,80 Md €",
      per: "53x",
      peg: "23,57",
      lastPrice: "272,20 €",
      variation: "-0,9%",
      logo: "https://logo.clearbit.com/essilorluxottica.com",
      roe: 8, // 0-10% (faible)
      roa: 4, // 0-5% (faible)
      perValue: 53, // >25 (élevé)
      pb: 6.5, // >2 (élevé)
      pegValue: 23.57,
      debtEquity: 58, // >50% (élevé)
      debtEbitda: 62, // >50% (élevé)
      cashRatio: 0.4, // <0.5 (faible)
      margeExploitation: 18, // 10-20% (correcte)
      margeNette: 12, // 5-15% (moyenne)
    },
    {
      id: 7,
      symbol: "SAF",
      name: "Safran",
      market: "Paris",
      sector: "Industriels",
      industry: "Aérospatiale et défense",
      marketCap: "124,64 Md €",
      per: "28,5x",
      peg: "0,17",
      lastPrice: "299,50 €",
      variation: "+0,5%",
      logo: "https://logo.clearbit.com/safran-group.com",
      roe: 25, // >20% (élevée)
      roa: 11, // >10% (bonne)
      perValue: 28.5, // >25 (élevé)
      pb: 3.8, // >2 (élevé)
      pegValue: 0.17,
      debtEquity: 28, // 20-50% (modéré)
      debtEbitda: 32, // 20-50% (modéré)
      cashRatio: 0.85, // 0.5-1 (correcte)
      margeExploitation: 15, // 10-20% (correcte)
      margeNette: 11, // 5-15% (moyenne)
    },
  ];

  // Fonction de filtrage
  const filterStocks = () => {
    return stocksData.filter((stock) => {
      // Filtre par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !stock.name.toLowerCase().includes(query) &&
          !stock.symbol.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Filtre ROE
      if (filters.roe !== "Tout") {
        if (filters.roe === "0-10% (faible)" && stock.roe > 10) return false;
        if (filters.roe === "10-20% (correcte)" && (stock.roe <= 10 || stock.roe > 20)) return false;
        if (filters.roe === ">20% (élevée)" && stock.roe <= 20) return false;
      }

      // Filtre ROA
      if (filters.roa !== "Tout") {
        if (filters.roa === "0-5% (faible)" && stock.roa > 5) return false;
        if (filters.roa === "5-10% (moyenne)" && (stock.roa <= 5 || stock.roa > 10)) return false;
        if (filters.roa === ">10% (bonne)" && stock.roa <= 10) return false;
      }

      // Filtre PER
      if (filters.per !== "Tout") {
        if (filters.per === "<10 (sous-évalué)" && stock.perValue >= 10) return false;
        if (filters.per === "10-25 (raisonnable)" && (stock.perValue < 10 || stock.perValue > 25)) return false;
        if (filters.per === ">25 (élevé)" && stock.perValue <= 25) return false;
      }

      // Filtre P/B
      if (filters.pb !== "Tout") {
        if (filters.pb === "<1 (sous-évalué)" && stock.pb >= 1) return false;
        if (filters.pb === "1-2 (correct)" && (stock.pb < 1 || stock.pb > 2)) return false;
        if (filters.pb === ">2 (élevé)" && stock.pb <= 2) return false;
      }

      // Filtre PEG
      if (filters.peg !== "Tout") {
        if (filters.peg === "<1 (attractif)" && stock.pegValue >= 1) return false;
        if (filters.peg === "1-2 (raisonnable)" && (stock.pegValue < 1 || stock.pegValue > 2)) return false;
        if (filters.peg === ">2 (cher)" && stock.pegValue <= 2) return false;
      }

      // Filtre Dette/Equity
      if (filters.debtEquity !== "Tout") {
        if (filters.debtEquity === "<20% (faible)" && stock.debtEquity >= 20) return false;
        if (filters.debtEquity === "20-50% (modéré)" && (stock.debtEquity < 20 || stock.debtEquity > 50)) return false;
        if (filters.debtEquity === ">50% (élevé)" && stock.debtEquity <= 50) return false;
      }

      // Filtre Dette/EBITDA
      if (filters.debtEbitda !== "Tout") {
        if (filters.debtEbitda === "<20% (faible)" && stock.debtEbitda >= 20) return false;
        if (filters.debtEbitda === "20-50% (modéré)" && (stock.debtEbitda < 20 || stock.debtEbitda > 50)) return false;
        if (filters.debtEbitda === ">50% (élevé)" && stock.debtEbitda <= 50) return false;
      }

      // Filtre Cash Ratio
      if (filters.cashRatio !== "Tout") {
        if (filters.cashRatio === "<0.5 (faible)" && stock.cashRatio >= 0.5) return false;
        if (filters.cashRatio === "0.5-1 (correcte)" && (stock.cashRatio < 0.5 || stock.cashRatio > 1)) return false;
        if (filters.cashRatio === ">1 (très bonne)" && stock.cashRatio <= 1) return false;
      }

      // Filtre Marge d'exploitation
      if (filters.margeExploitation !== "Tout") {
        if (filters.margeExploitation === "0-10% (faible)" && stock.margeExploitation > 10) return false;
        if (filters.margeExploitation === "10-20% (correcte)" && (stock.margeExploitation <= 10 || stock.margeExploitation > 20)) return false;
        if (filters.margeExploitation === ">20% (excellente)" && stock.margeExploitation <= 20) return false;
      }

      // Filtre Marge nette
      if (filters.margeNette !== "Tout") {
        if (filters.margeNette === "0-5% (faible)" && stock.margeNette > 5) return false;
        if (filters.margeNette === "5-15% (moyenne)" && (stock.margeNette <= 5 || stock.margeNette > 15)) return false;
        if (filters.margeNette === ">15% (très bonne)" && stock.margeNette <= 15) return false;
      }

      return true;
    });
  };

  const filteredStocks = filterStocks();

  const handleStockPress = (stock: any) => {
    router.push({
      pathname: "/company-profile",
      params: {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.lastPrice.replace(/[€\s]/g, ""),
        change: stock.variation.replace("%", ""),
        logo: stock.logo,
        location: `${stock.market}, France`,
        website: `www.${stock.name.toLowerCase().replace(/\s/g, "")}.com`,
        about: `${stock.name} est une entreprise française cotée en bourse, leader dans le secteur ${stock.sector.toLowerCase()}.`,
        marketCap: stock.marketCap,
        shares: "N/A",
        revenue: "N/A",
        eps: "N/A",
        peRatio: stock.per,
        dividend: "N/A",
      },
    } as any);
  };

  const getRatioColor = (value: string) => {
    const numValue = parseFloat(value.replace(/[x,%]/g, ""));
    if (value.includes("x")) {
      // PER
      if (numValue > 40) return "#FF3B30";
      if (numValue > 25) return "#FF9500";
      return "#4CD964";
    }
    return "#FFF";
  };

  const getVariationColor = (variation: string) => {
    return variation.startsWith("+") ? "#4CD964" : "#FF3B30";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actions Françaises</Text>
        <Text style={styles.stockCount}>700 actions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une action..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(cat.key as FilterCategory)}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategory === cat.key && styles.categoryTabTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filtersScroll}>
            <FilterDropdown
              label="ROE (Return on Equity)"
              value={filters.roe}
              options={filterOptions.roe}
              onChange={(value: any) => setFilters({ ...filters, roe: value })}
            />
            <FilterDropdown
              label="ROA (Return on Assets)"
              value={filters.roa}
              options={filterOptions.roa}
              onChange={(value: any) => setFilters({ ...filters, roa: value })}
            />
            <FilterDropdown
              label="PER (Price/Earnings)"
              value={filters.per}
              options={filterOptions.per}
              onChange={(value: any) => setFilters({ ...filters, per: value })}
            />
            <FilterDropdown
              label="P/B (Price/Book)"
              value={filters.pb}
              options={filterOptions.pb}
              onChange={(value: any) => setFilters({ ...filters, pb: value })}
            />
            <FilterDropdown
              label="PEG (Price/Earnings to Growth)"
              value={filters.peg}
              options={filterOptions.peg}
              onChange={(value: any) => setFilters({ ...filters, peg: value })}
            />
            <FilterDropdown
              label="Dette/Equity"
              value={filters.debtEquity}
              options={filterOptions.debtEquity}
              onChange={(value: any) => setFilters({ ...filters, debtEquity: value })}
            />
            <FilterDropdown
              label="Dette/EBITDA"
              value={filters.debtEbitda}
              options={filterOptions.debtEbitda}
              onChange={(value: any) => setFilters({ ...filters, debtEbitda: value })}
            />
            <FilterDropdown
              label="Cash Ratio"
              value={filters.cashRatio}
              options={filterOptions.cashRatio}
              onChange={(value: any) => setFilters({ ...filters, cashRatio: value })}
            />
            <FilterDropdown
              label="Marge d'exploitation"
              value={filters.margeExploitation}
              options={filterOptions.margeExploitation}
              onChange={(value: any) => setFilters({ ...filters, margeExploitation: value })}
            />
            <FilterDropdown
              label="Marge nette"
              value={filters.margeNette}
              options={filterOptions.margeNette}
              onChange={(value: any) => setFilters({ ...filters, margeNette: value })}
            />
          </ScrollView>
        </View>
      )}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colSymbol]}>Symbole</Text>
        <Text style={[styles.tableHeaderText, styles.colName]}>Nom</Text>
        <Text style={[styles.tableHeaderText, styles.colMarketCap]}>Cap. Marché</Text>
        <Text style={[styles.tableHeaderText, styles.colPER]}>PER</Text>
        <Text style={[styles.tableHeaderText, styles.colPrice]}>Cours</Text>
        <Text style={[styles.tableHeaderText, styles.colVariation]}>Var.</Text>
      </View>

      {/* Stocks List */}
      <ScrollView style={styles.stocksList} showsVerticalScrollIndicator={false}>
        {filteredStocks.length > 0 ? (
          filteredStocks.map((stock) => (
            <TouchableOpacity
              key={stock.id}
              style={styles.stockRow}
              onPress={() => handleStockPress(stock)}
            >
              <View style={styles.stockCell}>
                <Text style={styles.stockSymbol}>{stock.symbol}</Text>
              </View>
              <View style={[styles.stockCell, styles.colName]}>
                <Text style={styles.stockName} numberOfLines={1}>
                  {stock.name}
                </Text>
                <Text style={styles.stockSector} numberOfLines={1}>
                  {stock.sector}
                </Text>
              </View>
              <View style={[styles.stockCell, styles.colMarketCap]}>
                <Text style={styles.stockText}>{stock.marketCap}</Text>
              </View>
              <View style={[styles.stockCell, styles.colPER]}>
                <Text style={[styles.stockText, { color: getRatioColor(stock.per) }]}>
                  {stock.per}
                </Text>
              </View>
              <View style={[styles.stockCell, styles.colPrice]}>
                <Text style={styles.stockPrice}>{stock.lastPrice}</Text>
              </View>
              <View style={[styles.stockCell, styles.colVariation]}>
                <Text style={[styles.stockVariation, { color: getVariationColor(stock.variation) }]}>
                  {stock.variation}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="filter-outline" size={64} color="#333" />
            <Text style={styles.emptyStateText}>Aucune action ne correspond aux filtres</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setFilters({
                  roe: "Tout",
                  roa: "Tout",
                  per: "Tout",
                  pb: "Tout",
                  peg: "Tout",
                  debtEquity: "Tout",
                  debtEbitda: "Tout",
                  cashRatio: "Tout",
                  margeExploitation: "Tout",
                  margeNette: "Tout",
                });
                setSearchQuery("");
              }}
            >
              <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant FilterDropdown
const FilterDropdown = ({ label, value, options, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.filterItem}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.filterDropdown}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.filterValue}>{value}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#A9A9A9"
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.filterOptions}>
          {options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.filterOption}
              onPress={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              <Text style={styles.filterOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  stockCount: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "600",
  },

  // Search
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 12,
  },

  // Categories
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryTabActive: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "#8B5CF6",
  },
  categoryTabText: {
    fontSize: 14,
    color: "#A9A9A9",
    fontWeight: "600",
  },
  categoryTabTextActive: {
    color: "#8B5CF6",
  },

  // Filters
  filtersSection: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  filtersScroll: {
    maxHeight: 320,
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: "#A9A9A9",
    marginBottom: 8,
  },
  filterDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterValue: {
    fontSize: 14,
    color: "#FFF",
  },
  filterOptions: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#FFF",
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#8B5CF6",
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#A9A9A9",
    textTransform: "uppercase",
  },
  colSymbol: {
    width: 70,
  },
  colName: {
    flex: 1,
  },
  colMarketCap: {
    width: 100,
  },
  colPER: {
    width: 60,
  },
  colPrice: {
    width: 90,
  },
  colVariation: {
    width: 60,
  },

  // Stocks List
  stocksList: {
    flex: 1,
  },
  stockRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  stockCell: {
    justifyContent: "center",
  },
  stockSymbol: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5CF6",
    width: 70,
  },
  stockName: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  stockSector: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  stockText: {
    fontSize: 13,
    color: "#FFF",
  },
  stockPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  stockVariation: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});