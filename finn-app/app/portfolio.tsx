import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogoImage } from "../components/LogoImage";
import { fetchStocks, formatMarketCap, type Stock } from "../services/api";

interface PortfolioCompany {
  symbol: string;
  name: string;
  price: string;
  change: string;
  logo: string;
  location: string;
  website: string;
  about: string;
  marketCap: string;
  shares: string;
  revenue: string;
  eps: string;
  peRatio: string;
  dividend: string;
  quantity?: number;
  currency?: string;
}

interface EnrichedPortfolioItem extends PortfolioCompany {
  currentPrice: number;
  percentVar: number;
  marketCapNum: number;
  currency: string;
  quantity: number;
}

type SortKey = "dailyPercent" | "dailyEuro" | "marketCap" | "name";
const SORT_LABELS: Record<SortKey, string> = {
  dailyPercent: "Perf jour - %",
  dailyEuro: "Perf jour - €",
  marketCap: "Cap. Bours.",
  name: "Nom",
};

export default function Portfolio() {
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([]);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedPortfolioItem[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sort
  const [sortBy, setSortBy] = useState<SortKey>("dailyPercent");
  const [sortAsc, setSortAsc] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Search modal
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Load portfolio ────────────────────────────────────────────────────────
  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem("portfolio");
      let companies: PortfolioCompany[] = portfolioData ? JSON.parse(portfolioData) : [];
      setPortfolioCompanies(companies);

      if (companies.length === 0) { setEnrichedItems([]); return; }

      const stocks = await fetchStocks().catch(() => [] as Stock[]);
      if (stocks.length) setAllStocks(stocks);

      const bySymbol = Object.fromEntries(stocks.map((s) => [s.symbol, s]));
      const enriched: EnrichedPortfolioItem[] = companies.map((c) => {
        const api = bySymbol[c.symbol] as Stock | undefined;
        const quantity = c.quantity ?? 1;
        const currency = api?.currency ?? c.currency ?? "USD";
        if (api) return { ...c, currentPrice: api.currentPrice, percentVar: api.percentVar, marketCapNum: api.marketCap, currency, quantity };
        const storedPrice = parseFloat(c.price.replace(/[$,€]/g, "").replace(",", ".")) || 0;
        const storedChange = parseFloat(c.change.replace(/[+%]/g, "")) || 0;
        return { ...c, currentPrice: storedPrice, percentVar: storedChange, marketCapNum: parseFloat(c.marketCap.replace(/[$,€BMT\s]/g, "")) * 1e9 || 0, currency, quantity };
      });
      setEnrichedItems(enriched);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPortfolio(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    await loadPortfolio();
    setRefreshing(false);
  }, []);

  // ─── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = async (symbol: string) => {
    const updated = portfolioCompanies.filter((c) => c.symbol !== symbol);
    await AsyncStorage.setItem("portfolio", JSON.stringify(updated));
    setPortfolioCompanies(updated);
    setEnrichedItems((prev) => prev.filter((i) => i.symbol !== symbol));
  };

  const confirmRemove = (symbol: string, name: string) =>
    Alert.alert("Retirer du portfolio", `Retirer ${name} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => handleRemove(symbol) },
    ]);

  const handleRemovePress = (symbol: string, name: string) =>
    Alert.alert("Retirer du portfolio", `Retirer ${name} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => handleRemove(symbol) },
    ]);

  // ─── Add from search ───────────────────────────────────────────────────────
  const handleAddStock = async (stock: Stock) => {
    const already = portfolioCompanies.find((c) => c.symbol === stock.symbol);
    if (already) {
      Alert.alert("Déjà ajouté", `${stock.shortName} est déjà dans votre portfolio.`);
      return;
    }
    const newCompany: PortfolioCompany = {
      symbol: stock.symbol,
      name: stock.shortName,
      price: `${stock.currentPrice}`,
      change: `${stock.percentVar}%`,
      logo: stock.logo ?? "",
      location: stock.country ?? "",
      website: stock.website ?? "",
      about: stock.summary ?? "",
      marketCap: `${stock.marketCap}`,
      shares: stock.sharesStats.toString() ?? "N/A",
      revenue: "N/A",
      eps: stock.EPS?.toString() ?? "N/A",
      peRatio: stock.PER?.toString() ?? "N/A",
      dividend: stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : "0.00%",
      quantity: 1,
      currency: stock.currency ?? "USD",
    };
    const updated = [...portfolioCompanies, newCompany];
    await AsyncStorage.setItem("portfolio", JSON.stringify(updated));
    setPortfolioCompanies(updated);
    setSearchVisible(false);
    setSearchQuery("");
    await loadPortfolio();
  };

  // ─── Navigate ──────────────────────────────────────────────────────────────
  const handleCompanyPress = (c: PortfolioCompany) =>
    router.push({ pathname: "/company-profile", params: { ...c, currency: c.currency ?? "USD" } } as any);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const totalValue = enrichedItems.reduce((s, i) => s + i.currentPrice * i.quantity, 0);
  const totalDailyChange = enrichedItems.reduce(
    (s, i) => s + i.currentPrice * (i.percentVar / 100) * i.quantity, 0
  );
  const overallPercent = totalValue > 0 ? (totalDailyChange / totalValue) * 100 : 0;
  const portfolioPositive = overallPercent >= 0;

  const sortedItems = [...enrichedItems].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "dailyPercent") cmp = a.percentVar - b.percentVar;
    else if (sortBy === "dailyEuro")
      cmp = a.currentPrice * (a.percentVar / 100) * a.quantity -
        b.currentPrice * (b.percentVar / 100) * b.quantity;
    else if (sortBy === "marketCap") cmp = a.marketCapNum - b.marketCapNum;
    else cmp = a.name.localeCompare(b.name);
    return sortAsc ? cmp : -cmp;
  });

  const filteredStocks = allStocks.filter(
    (s) =>
      s.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Portfolio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}
      >
        {loading ? (
          <View style={s.centered}><ActivityIndicator size="large" color="#8B5CF6" /></View>
        ) : portfolioCompanies.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#666" style={{ marginBottom: 24 }} />
            <Text style={s.emptyTitle}>Votre portfolio est vide</Text>
            <Text style={s.emptyDesc}>Ajoutez des entreprises depuis la recherche</Text>
          </View>
        ) : (
          <>
            {/* Total value — top */}
            <View style={s.totalCard}>
              <Text style={s.totalLabel}>Valeur totale</Text>
              <Text style={s.totalValue}>€{totalValue.toFixed(2)}</Text>
              <Text style={[s.totalPerf, { color: portfolioPositive ? "#4CD964" : "#FF3B30" }]}>
                {portfolioPositive ? "▲" : "▼"} {Math.abs(overallPercent).toFixed(2)}%
                {"  "}
                <Text style={s.totalPerfSub}>
                  ({portfolioPositive ? "+" : ""}{totalDailyChange.toFixed(2)} aujourd'hui)
                </Text>
              </Text>
            </View>

            {/* Count + sort row */}
            <View style={s.metaRow}>
              <Text style={s.metaCount}>
                {enrichedItems.length} en suivi{" "}
                <Ionicons name={sortAsc ? "arrow-up" : "arrow-down"} size={13} color="#A9A9A9" />
              </Text>

              {/* Dropdown trigger */}
              <TouchableOpacity style={s.sortTrigger} onPress={() => setSortOpen(!sortOpen)}>
                <Text style={s.sortTriggerText}>{SORT_LABELS[sortBy]}</Text>
                <Ionicons name={sortOpen ? "chevron-up" : "chevron-down"} size={14} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            {/* Inline dropdown */}
            {sortOpen && (
              <View style={s.dropdown}>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.dropdownItem, sortBy === key && s.dropdownItemActive]}
                    onPress={() => {
                      if (sortBy === key) setSortAsc(!sortAsc);
                      else { setSortBy(key); setSortAsc(false); }
                      setSortOpen(false);
                    }}
                  >
                    <Text style={[s.dropdownText, sortBy === key && s.dropdownTextActive]}>
                      {SORT_LABELS[key]}
                    </Text>
                    {sortBy === key && (
                      <Ionicons name={sortAsc ? "arrow-up" : "arrow-down"} size={13} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Asset list */}
            <View style={s.list}>
              {sortedItems.map((item, idx) => {
                const dailyEuro = item.currentPrice * (item.percentVar / 100) * item.quantity;
                const pos = item.percentVar >= 0;
                const sym = item.currency === "EUR" ? "€" : "$";
                return (
                  <TouchableOpacity
                    key={`${item.symbol}-${idx}`}
                    style={s.row}
                    onPress={() => handleCompanyPress(item)}
                    activeOpacity={0.75}
                    delayPressIn={50}
                  >
                    {/* Left */}
                    <LogoImage logo={item.logo} symbol={item.symbol} name={item.name} size={38} />
                    <View style={s.rowMid}>
                      <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.rowPrice}>
                        {item.currentPrice.toFixed(2)} {sym}
                        {"  ·  "}
                        <Text style={s.rowQty}>x{item.quantity}</Text>
                      </Text>
                    </View>
                    {/* Right */}
                    <View style={s.rowRight}>
                      <Text style={[s.rowPerf, { color: pos ? "#4CD964" : "#FF3B30" }]}>
                        {pos ? "▲" : "▼"} {Math.abs(item.percentVar).toFixed(2)}%
                      </Text>
                      <Text style={[s.rowPerfEuro, { color: pos ? "#4CD964" : "#FF3B30" }]}>
                        {pos ? "+" : ""}{dailyEuro.toFixed(2)} {sym}
                      </Text>
                    </View>
                    {/* Remove */}
                    <TouchableOpacity
                      style={s.removeBtn}
                      onPress={(e) => { e.stopPropagation?.(); confirmRemove(item.symbol, item.name); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Ajouter */}
      <TouchableOpacity style={s.fab} onPress={() => { setSearchQuery(""); setSearchVisible(true); }}>
        <Text style={s.fabText}>Ajouter</Text>
        <Ionicons name="add" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Search modal */}
      <Modal visible={searchVisible} animationType="slide" transparent onRequestClose={() => setSearchVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Ajouter un actif</Text>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={s.searchBar}>
              <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Nom ou symbole..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            {allStocks.length === 0 ? (
              <View style={s.centered}><ActivityIndicator color="#8B5CF6" /></View>
            ) : (
              <FlatList
                data={filteredStocks.slice(0, 50)}
                keyExtractor={(s) => s.symbol}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.searchRow} onPress={() => handleAddStock(item)}>
                    <LogoImage logo={item.logo ?? ""} symbol={item.symbol} name={item.shortName} size={34} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.searchName}>{item.shortName}</Text>
                      <Text style={s.searchSymbol}>{item.symbol}</Text>
                    </View>
                    <Text style={s.searchPrice}>{item.currentPrice.toFixed(2)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 60 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },

  // Total card
  totalCard: { backgroundColor: "#111", marginHorizontal: 16, marginTop: 8, marginBottom: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#8B5CF630" },
  totalLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: "bold", color: "#FFF", marginBottom: 6 },
  totalPerf: { fontSize: 15, fontWeight: "600" },
  totalPerfSub: { fontSize: 13, color: "#A9A9A9", fontWeight: "400" },

  // Meta row
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8 },
  metaCount: { fontSize: 14, color: "#A9A9A9", fontWeight: "500" },
  sortTrigger: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#181820", borderWidth: 1, borderColor: "#8B5CF640" },
  sortTriggerText: { fontSize: 13, color: "#8B5CF6", fontWeight: "600" },

  // Dropdown
  dropdown: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#181820", borderRadius: 14, borderWidth: 1, borderColor: "#23232c", overflow: "hidden" },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 18 },
  dropdownItemActive: { backgroundColor: "#8B5CF615" },
  dropdownText: { fontSize: 14, color: "#A9A9A9" },
  dropdownTextActive: { color: "#8B5CF6", fontWeight: "600" },

  // List
  list: { paddingHorizontal: 12 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: "#1E1E2A" },
  rowMid: { flex: 1, marginLeft: 12 },
  rowName: { fontSize: 15, fontWeight: "600", color: "#FFF", marginBottom: 3 },
  rowPrice: { fontSize: 12.5, color: "#666" },
  rowQty: { color: "#8B5CF6", fontWeight: "600" },
  rowRight: { alignItems: "flex-end", marginRight: 8 },
  rowPerf: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowPerfEuro: { fontSize: 12, fontWeight: "500" },
  removeBtn: { padding: 2 },

  // Empty
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 10, textAlign: "center" },
  emptyDesc: { fontSize: 14, color: "#A9A9A9", textAlign: "center" },

  // FAB
  fab: { position: "absolute", bottom: 30, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1C1C1E", paddingVertical: 14, paddingHorizontal: 32, marginRight: 12, borderRadius: 30, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabText: { fontSize: 16, fontWeight: "600", color: "#FFF" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40, height: "80%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#1C1C1E", marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: "#FFF" },
  searchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: "#1C1C1E" },
  searchName: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  searchSymbol: { fontSize: 12, color: "#666", marginTop: 2 },
  searchPrice: { fontSize: 14, color: "#A9A9A9", fontWeight: "500" },
});