import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogoImage } from "../components/LogoImage";
import { fetchStocks, formatPrice, formatMarketCap, type Stock } from "../services/api";

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
}

export default function Portfolio() {
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([]);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedPortfolioItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem("portfolio");
      let companies: PortfolioCompany[] = [];
      if (portfolioData) {
        companies = JSON.parse(portfolioData);
      }
      setPortfolioCompanies(companies);

      if (companies.length === 0) {
        setEnrichedItems([]);
        return;
      }

      try {
        const stocks = await fetchStocks();
        const stocksBySymbol = Object.fromEntries(
          stocks.map((s) => [s.symbol, s])
        );

        const enriched: EnrichedPortfolioItem[] = companies.map((c) => {
          const apiStock = stocksBySymbol[c.symbol] as Stock | undefined;
          const quantity = c.quantity ?? 1;
          const currency = apiStock?.currency ?? c.currency ?? "USD";

          if (apiStock) {
            const dailyChangeEuro = apiStock.currentPrice * (apiStock.percentVar / 100) * quantity;
            return {
              ...c,
              currentPrice: apiStock.currentPrice,
              percentVar: apiStock.percentVar,
              marketCapNum: apiStock.marketCap,
              currency,
              quantity,
            };
          }

          const storedPrice = parseFloat(c.price.replace(/[$,€]/g, "").replace(",", "."));
          const storedChange = parseFloat(c.change.replace(/[+%]/g, "")) || 0;
          const dailyChangeEuro = storedPrice * (storedChange / 100) * quantity;
          return {
            ...c,
            currentPrice: storedPrice,
            percentVar: storedChange,
            marketCapNum: parseFloat(c.marketCap.replace(/[$,€BMT\s]/g, "")) * 1e9 || 0,
            currency: c.currency ?? "USD",
            quantity,
          };
        });

        setEnrichedItems(enriched);
      } catch (apiError) {
        console.warn("API indisponible, utilisation des données locales:", apiError);
        const enriched: EnrichedPortfolioItem[] = companies.map((c) => {
          const storedPrice = parseFloat(c.price.replace(/[$,€]/g, "").replace(",", "."));
          const storedChange = parseFloat(c.change.replace(/[+%]/g, "")) || 0;
          const quantity = c.quantity ?? 1;
          return {
            ...c,
            currentPrice: storedPrice,
            percentVar: storedChange,
            marketCapNum: parseFloat(c.marketCap.replace(/[$,€BMT\s]/g, "")) * 1e9 || 0,
            currency: c.currency ?? "USD",
            quantity,
          };
        });
        setEnrichedItems(enriched);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    await loadPortfolio();
    setRefreshing(false);
  }, []);

  const handleRemoveCompany = (symbol: string) => {
    Alert.alert(
      "Retirer du portfolio",
      `Êtes-vous sûr de vouloir retirer ${symbol} de votre portfolio ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedPortfolio = portfolioCompanies.filter(
                (company) => company.symbol !== symbol
              );
              await AsyncStorage.setItem("portfolio", JSON.stringify(updatedPortfolio));
              setPortfolioCompanies(updatedPortfolio);
              setEnrichedItems((prev) => prev.filter((i) => i.symbol !== symbol));
            } catch (error) {
              console.error("Erreur lors de la suppression:", error);
              Alert.alert("Erreur", "Impossible de retirer l'entreprise du portfolio.");
            }
          },
        },
      ]
    );
  };

  const handleCompanyPress = (company: PortfolioCompany) => {
    router.push({
      pathname: "/company-profile",
      params: {
        symbol: company.symbol,
        name: company.name,
        price: company.price,
        change: company.change,
        logo: company.logo,
        location: company.location,
        website: company.website,
        about: company.about,
        marketCap: company.marketCap,
        shares: company.shares,
        revenue: company.revenue,
        eps: company.eps,
        peRatio: company.peRatio,
        dividend: company.dividend,
        currency: company.currency ?? "USD",
      },
    } as any);
  };

  const totalValue = enrichedItems.reduce(
    (sum, item) => sum + item.currentPrice * (item.quantity ?? 1),
    0
  );

  const totalDailyChangeEuro = enrichedItems.reduce(
    (sum, item) =>
      sum +
      item.currentPrice *
        (item.percentVar / 100) *
        (item.quantity ?? 1),
    0
  );

  const overallDailyPercent =
    totalValue > 0 ? (totalDailyChangeEuro / totalValue) * 100 : 0;
  const isPositive = overallDailyPercent >= 0;

  const [sortBy, setSortBy] = useState<"name" | "dailyEuro" | "dailyPercent" | "marketCap">(
    "dailyPercent"
  );
  const [sortAsc, setSortAsc] = useState(false);

  const sortedItems = [...enrichedItems].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "dailyEuro":
        cmp =
          a.currentPrice * (a.percentVar / 100) * (a.quantity ?? 1) -
          b.currentPrice * (b.percentVar / 100) * (b.quantity ?? 1);
        break;
      case "dailyPercent":
        cmp = a.percentVar - b.percentVar;
        break;
      case "marketCap":
        cmp = a.marketCapNum - b.marketCapNum;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(col === "name");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : portfolioCompanies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="briefcase-outline" size={64} color="#666" />
            </View>
            <Text style={styles.emptyTitle}>Votre portfolio est vide</Text>
            <Text style={styles.emptyDescription}>
              Ajoutez des entreprises à votre portfolio depuis leur page de profil
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.exploreButtonText}>Explorer les marchés</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Performance section */}
            <View style={styles.performanceSection}>
              <View style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceTitle}>Performance</Text>
                  <Ionicons name="information-circle-outline" size={20} color="#A9A9A9" />
                </View>
                <Text
                  style={[
                    styles.performanceValue,
                    { color: isPositive ? "#4CD964" : "#FF3B30" },
                  ]}
                >
                  {isPositive ? "▲" : "▼"} {Math.abs(overallDailyPercent).toFixed(2)}%
                </Text>
                <Text style={styles.performanceSub}>
                  {isPositive ? "+" : ""}
                  {totalDailyChangeEuro.toFixed(2)} journalier
                </Text>
              </View>
            </View>

            {/* Table headers */}
            <View style={styles.tableHeader}>
              <TouchableOpacity
                style={[styles.tableColName, styles.tableCol]}
                onPress={() => toggleSort("name")}
              >
                <Text style={styles.tableHeaderText}>Nom</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tableColSmall, styles.tableCol]}
                onPress={() => toggleSort("dailyEuro")}
              >
                <Text style={styles.tableHeaderText}>Quotidienne</Text>
                {sortBy === "dailyEuro" && (
                  <Ionicons
                    name={sortAsc ? "arrow-up" : "arrow-down"}
                    size={12}
                    color="#8B5CF6"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tableColSmall, styles.tableCol, styles.tableColHighlight]}
                onPress={() => toggleSort("dailyPercent")}
              >
                <Text style={[styles.tableHeaderText, styles.tableHeaderHighlight]}>
                  Quotidienne (%)
                </Text>
                {sortBy === "dailyPercent" && (
                  <Ionicons
                    name={sortAsc ? "arrow-up" : "arrow-down"}
                    size={12}
                    color="#8B5CF6"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tableColCap, styles.tableCol]}
                onPress={() => toggleSort("marketCap")}
              >
                <Text style={styles.tableHeaderText}>Cap. Bours.</Text>
              </TouchableOpacity>
            </View>

            {/* Asset list */}
            <View style={styles.assetList}>
              {sortedItems.map((item, index) => (
                <PortfolioRow
                  key={`${item.symbol}-${index}`}
                  item={item}
                  onPress={() => handleCompanyPress(item)}
                  onRemove={() => handleRemoveCompany(item.symbol)}
                />
              ))}
            </View>

            {/* Total value */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Valeur totale</Text>
              <Text style={styles.totalValue}>€{totalValue.toFixed(2)}</Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const PortfolioRow = ({
  item,
  onPress,
  onRemove,
}: {
  item: EnrichedPortfolioItem;
  onPress: () => void;
  onRemove: () => void;
}) => {
  const dailyEuro =
    item.currentPrice * (item.percentVar / 100) * (item.quantity ?? 1);
  const isPositive = item.percentVar >= 0;
  const currencySymbol = item.currency === "EUR" ? "€" : "$";

  return (
    <TouchableOpacity
      style={styles.assetRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.assetLeft}>
        <View style={styles.assetLogo}>
          <LogoImage
            logo={item.logo}
            symbol={item.symbol}
            name={item.name}
            size={36}
          />
        </View>
        <View style={styles.assetInfo}>
          <Text style={styles.assetName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.assetPrice}>
            {currencySymbol}
            {item.currentPrice.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <View style={styles.assetCol}>
          <Text
            style={[
              styles.assetDailyEuro,
              { color: isPositive ? "#4CD964" : "#FF3B30" },
            ]}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(dailyEuro).toFixed(2)} {currencySymbol}
          </Text>
        </View>
        <View style={[styles.assetCol, styles.assetColPercent]}>
          <Text
            style={[
              styles.assetDailyPercent,
              { color: isPositive ? "#4CD964" : "#FF3B30" },
            ]}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(item.percentVar).toFixed(2)}%
          </Text>
        </View>
        <View style={styles.assetCol}>
          <Text style={styles.assetMarketCap}>
            {item.marketCapNum > 0
              ? formatMarketCap(item.marketCapNum, item.currency)
              : "-"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Ionicons name="close-circle-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },

  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  performanceSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  performanceCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  performanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  performanceSub: {
    fontSize: 14,
    color: "#A9A9A9",
    marginTop: 4,
  },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    alignItems: "center",
  },
  tableCol: { alignItems: "flex-start" },
  tableColName: { flex: 2 },
  tableColSmall: { flex: 1 },
  tableColHighlight: { alignItems: "center" },
  tableColCap: { flex: 1.2 },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A9A9A9",
  },
  tableHeaderHighlight: { color: "#8B5CF6" },

  assetList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  assetLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  assetInfo: { flex: 1 },
  assetName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  assetPrice: {
    fontSize: 13,
    color: "#A9A9A9",
    marginTop: 2,
  },
  assetRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 3,
  },
  assetCol: { flex: 1, alignItems: "flex-end" },
  assetColPercent: { alignItems: "center" },
  assetDailyEuro: { fontSize: 13, fontWeight: "600" },
  assetDailyPercent: { fontSize: 13, fontWeight: "600" },
  assetMarketCap: { fontSize: 12, color: "#A9A9A9" },
  removeBtn: { padding: 4, marginLeft: 4 },

  totalCard: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "#A9A9A9", marginBottom: 8 },
  totalValue: { fontSize: 24, fontWeight: "bold", color: "#FFF" },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { marginBottom: 24 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#A9A9A9",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  exploreButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },

  bottomSpacer: { height: 40 },
});
