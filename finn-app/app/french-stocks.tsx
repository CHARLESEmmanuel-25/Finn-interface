import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchBigCaps, fetchTopGainers, fetchTopLosers, fetchStocks, Stock, formatPrice, formatMarketCap } from "@/services/api";

type FilterCategory = "Larges Caps" | "Small caps" | "Top Gagnantes" | "Plus cheres" | "Plus performnats" | "Plus Active" | "Plus valotiles" | "Penny stock" | "Plus bas " | "Plus hauts";

export default function FrenchStocks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("Larges Caps");
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    setLoading(true);
    const fetcher =
      selectedCategory === "Top Gagnantes" ? fetchTopGainers(20)
      : selectedCategory === "Small caps" ? fetchStocks()
      : selectedCategory === "Plus performnats" ? fetchTopGainers(20)
      : selectedCategory === "Plus bas " ? fetchTopLosers(20)
      : fetchBigCaps();
    fetcher
      .then(setStocks)
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

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


  const filteredStocks = stocks.filter((stock) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return stock.shortName.toLowerCase().includes(q) || stock.symbol.toLowerCase().includes(q);
  });

  const handleStockPress = (stock: Stock) => {
    router.push({
      pathname: "/company-profile",
      params: {
        symbol: stock.symbol,
        name: stock.shortName,
        price: stock.currentPrice.toFixed(2),
        change: stock.percentVar.toFixed(2),
        logo: stock.logo ?? "",
        stockId: stock._id ?? "",
        location: stock.country ?? "",
        sector: stock.sector ?? "",
        website: stock.website ?? "",
        about: stock.summary ?? "",
        marketCap: formatMarketCap(stock.marketCap, stock.currency),
        shares: stock.sharesStats ? String(stock.sharesStats) : "N/A",
        revenue: "N/A",
        eps: stock.EPS != null ? String(stock.EPS) : "N/A",
        peRatio: stock.PER != null ? String(stock.PER) : "N/A",
        dividend: stock.dividendYield != null ? `${stock.dividendYield.toFixed(2)}%` : "0.00%",
        currency: stock.currency,
      },
    } as any);
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
        <Text style={styles.stockCount}>{stocks.length} actions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color={searchFocused ? "#8B5CF6" : "#666"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une action..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            selectionColor="#8B5CF6"
            underlineColorAndroid="transparent"
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
        {loading ? (
          <ActivityIndicator color="#8B5CF6" style={{ marginTop: 60 }} />
        ) : filteredStocks.length > 0 ? (
          filteredStocks.map((stock) => (
            <TouchableOpacity
              key={stock._id}
              style={styles.stockRow}
              onPress={() => handleStockPress(stock)}
            >
              <View style={styles.stockCell}>
                <Text style={styles.stockSymbol}>{stock.symbol}</Text>
              </View>
              <View style={[styles.stockCell, styles.colName]}>
                <Text style={styles.stockName} numberOfLines={1}>{stock.shortName}</Text>
                <Text style={styles.stockSector} numberOfLines={1}>{stock.sector}</Text>
              </View>
              <View style={[styles.stockCell, styles.colMarketCap]}>
                <Text style={styles.stockText}>{formatMarketCap(stock.marketCap, stock.currency)}</Text>
              </View>
              <View style={[styles.stockCell, styles.colPER]}>
                <Text style={styles.stockText}>
                  {stock.PER != null ? `${stock.PER.toFixed(1)}x` : "—"}
                </Text>
              </View>
              <View style={[styles.stockCell, styles.colPrice]}>
                <Text style={styles.stockPrice}>{formatPrice(stock.currentPrice, stock.currency)}</Text>
              </View>
              <View style={[styles.stockCell, styles.colVariation]}>
                <Text style={[styles.stockVariation, { color: stock.percentVar >= 0 ? "#4CD964" : "#FF3B30" }]}>
                  {stock.percentVar >= 0 ? "+" : ""}{stock.percentVar.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="filter-outline" size={64} color="#333" />
            <Text style={styles.emptyStateText}>Aucune action trouvée</Text>
            <TouchableOpacity style={styles.resetButton} onPress={() => setSearchQuery("")}>
              <Text style={styles.resetButtonText}>Réinitialiser la recherche</Text>
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchBarFocused: {
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
    outlineStyle: "none",
  } as any,
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