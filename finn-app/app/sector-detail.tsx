import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchSectorStocks, Stock, formatMarketCap, formatPrice } from "@/services/api";
import { getSectorEntry } from "@/constants/sectorIcons";
import { LogoImage } from "@/components/LogoImage";

const GREEN = "#22C55E";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";

export default function SectorDetailScreen() {
  const params = useLocalSearchParams();
  const sectorId = params.id as string;
  const sectorName = params.name as string || "Secteur";
  const avgPerf = params.avgPerf ? parseFloat(params.avgPerf as string) : null;
  const totalMarketCap = params.totalMarketCap ? parseFloat(params.totalMarketCap as string) : null;

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSectorStocks(sectorId);
      const sorted = [...data].sort((a, b) => b.marketCap - a.marketCap);
      setStocks(sorted);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [sectorId]);

  useEffect(() => { load(); }, [load]);

  const entry = getSectorEntry(sectorName);
  const isPerfPos = avgPerf != null && avgPerf >= 0;

  const handleStockPress = (stock: Stock) => {
    router.push({
      pathname: "/company-profile",
      params: {
        stockId: stock._id,
        symbol: stock.symbol,
        name: stock.shortName,
        price: stock.currentPrice?.toString() ?? "0",
        change: stock.percentVar?.toString() ?? "0",
        logo: stock.logo ?? "",
        location: stock.country ?? "",
        sector: stock.sector ?? "",
        website: stock.website ?? "",
        about: stock.summary ?? "",
        currency: stock.currency,
      },
    } as any);
  };

  const renderStock = ({ item, index }: { item: Stock; index: number }) => {
    const isPos = item.percentVar >= 0;
    return (
      <TouchableOpacity style={styles.stockRow} onPress={() => handleStockPress(item)}>
        <Text style={styles.stockRank}>{index + 1}</Text>
        <View style={styles.stockLogo}>
          <LogoImage logo={item.logo ?? undefined} symbol={item.symbol} name={item.shortName} size={38} />
        </View>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockName} numberOfLines={1}>{item.shortName}</Text>
        </View>
        <View style={styles.stockRight}>
          <Text style={styles.stockPrice}>{formatPrice(item.currentPrice, item.currency)}</Text>
          <View style={[styles.changePill, { backgroundColor: isPos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}>
            <Ionicons name={isPos ? "arrow-up" : "arrow-down"} size={11} color={isPos ? GREEN : RED} />
            <Text style={[styles.changeText, { color: isPos ? GREEN : RED }]}>
              {Math.abs(item.percentVar).toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secteur</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.sectorHero}>
        <View style={[styles.sectorIconWrap, { backgroundColor: entry.bg }]}>
          <MaterialCommunityIcons name={entry.icon} size={32} color={entry.color} />
        </View>
        <Text style={styles.sectorName}>{sectorName}</Text>
        <View style={styles.statsRow}>
          {avgPerf != null && (
            <View style={styles.statPill}>
              <Ionicons name={isPerfPos ? "trending-up" : "trending-down"} size={14} color={isPerfPos ? GREEN : RED} />
              <Text style={[styles.statText, { color: isPerfPos ? GREEN : RED }]}>
                {isPerfPos ? "+" : ""}{avgPerf.toFixed(2)}% moy.
              </Text>
            </View>
          )}
          {totalMarketCap != null && (
            <View style={styles.statPill}>
              <Ionicons name="bar-chart-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statText}>{formatMarketCap(totalMarketCap)}</Text>
            </View>
          )}
          {!loading && (
            <View style={styles.statPill}>
              <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={styles.statText}>{stocks.length} actions</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={RED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : stocks.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucune action dans ce secteur</Text>
        </View>
      ) : (
        <FlatList
          data={stocks}
          keyExtractor={(item) => item._id}
          renderItem={renderStock}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#FFF" },
  placeholder: { width: 40 },

  sectorHero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  sectorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  sectorName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  errorText: { color: RED, fontSize: 14, textAlign: "center" },
  emptyText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  retryText: { color: PURPLE, fontWeight: "600", fontSize: 14 },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: "rgba(255,255,255,0.05)" },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  stockRank: {
    width: 22,
    fontSize: 13,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "600",
    textAlign: "right",
  },
  stockLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  stockInfo: { flex: 1 },
  stockSymbol: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  stockName: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 },
  stockRight: { alignItems: "flex-end", gap: 5 },
  stockPrice: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  changeText: { fontSize: 12, fontWeight: "600" },
});
