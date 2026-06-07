import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchStockById,
  searchStocks,
  Stock,
  formatMarketCap,
  formatShares,
} from "@/services/api";

const GREEN = "#22C55E";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";

function fmt(val: number | null | undefined, suffix = "", decimals = 2): string {
  if (val == null || isNaN(val)) return "—";
  return `${val.toFixed(decimals)}${suffix}`;
}

function fmtCurrency(val: number | null | undefined, currency: string): string {
  if (val == null || isNaN(val)) return "—";
  const sym = currency === "EUR" ? "€" : "$";
  return `${sym}${val.toFixed(2)}`;
}

export default function FinancialData() {
  const params = useLocalSearchParams();
  const stockId = params.id as string | undefined;
  const symbol = params.symbol as string || "";
  const companyName = params.name as string || symbol;

  const [selectedTab, setSelectedTab] = useState<"annual" | "quarterly">("annual");
  const [selectedSection, setSelectedSection] = useState<"resultat" | "bilan" | "ratios">("resultat");
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let s: Stock;
      if (stockId) {
        s = await fetchStockById(stockId);
      } else {
        const results = await searchStocks(symbol);
        const exact = results.find(
          (r) => r.symbol.toUpperCase() === symbol.toUpperCase()
        );
        s = exact ?? results[0];
        if (!s) throw new Error("Action introuvable");
      }
      setStock(s);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [stockId, symbol]);

  useEffect(() => { load(); }, [load]);

  const currency = stock?.currency ?? "USD";
  const currSym = currency === "EUR" ? "€" : "$";

  const netIncomeEst =
    stock?.EPS != null && stock?.sharesStats != null
      ? stock.EPS * stock.sharesStats
      : null;

  const ratios: { label: string; value: string; available: boolean }[] = [
    { label: "PER (Price/Earnings)", value: fmt(stock?.PER, "", 1), available: stock?.PER != null },
    { label: "EPS", value: stock?.EPS != null ? fmtCurrency(stock.EPS, currency) : "—", available: stock?.EPS != null },
    { label: "Rendement dividende", value: fmt(stock?.dividendYield, "%"), available: stock?.dividendYield != null },
    { label: "Capitalisation", value: stock ? formatMarketCap(stock.marketCap, currency) : "—", available: stock?.marketCap != null },
    { label: "Actions en circulation", value: stock ? formatShares(stock.sharesStats) : "—", available: stock?.sharesStats != null },
    { label: "P/B (Price/Book)", value: "—", available: false },
    { label: "Marge brute", value: "—", available: false },
    { label: "Marge nette", value: "—", available: false },
    { label: "ROE", value: "—", available: false },
    { label: "ROA", value: "—", available: false },
    { label: "Dette/Equity", value: "—", available: false },
  ];

  const annualResults: { label: string; value: string; available: boolean }[] = [
    { label: "EPS", value: stock?.EPS != null ? fmtCurrency(stock.EPS, currency) : "—", available: stock?.EPS != null },
    { label: "Résultat net (estimé)", value: netIncomeEst != null ? formatMarketCap(netIncomeEst, currency) : "—", available: netIncomeEst != null },
    { label: "Rendement dividende", value: fmt(stock?.dividendYield, "%"), available: stock?.dividendYield != null },
    { label: "Chiffre d'affaires", value: "—", available: false },
    { label: "EBITDA", value: "—", available: false },
    { label: "Résultat d'exploitation", value: "—", available: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Données Financières</Text>
          <Text style={styles.headerSubtitle}>
            {companyName}{symbol ? ` (${symbol})` : ""}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.periodTabs}>
        {(["annual", "quarterly"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.periodTab, selectedTab === tab && styles.periodTabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.periodTabText, selectedTab === tab && styles.periodTabTextActive]}>
              {tab === "annual" ? "Annuellement" : "Trimestre"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionTabs}>
        {(["resultat", "bilan", "ratios"] as const).map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[styles.sectionTab, selectedSection === sec && styles.sectionTabActive]}
            onPress={() => setSelectedSection(sec)}
          >
            <Text style={[styles.sectionTabText, selectedSection === sec && styles.sectionTabTextActive]}>
              {sec === "resultat" ? "Résultat" : sec === "bilan" ? "Bilan" : "Ratios"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Chargement des données…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={RED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {selectedSection === "resultat" && (
            <View style={styles.content}>
              {selectedTab === "quarterly" ? (
                <View style={styles.unavailableCard}>
                  <Ionicons name="bar-chart-outline" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.unavailableTitle}>Données trimestrielles</Text>
                  <Text style={styles.unavailableText}>
                    Les résultats trimestriels ne sont pas disponibles via l'API.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.dataSourceNote}>
                    Données issues de l'API Finn · Exercice en cours
                  </Text>
                  <View style={styles.dataCard}>
                    {annualResults.map((item, i) => (
                      <View key={i} style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{item.label}</Text>
                        <Text style={[styles.dataValue, !item.available && styles.dataValueUnavailable]}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {netIncomeEst != null && (
                    <Text style={styles.estimateNote}>
                      * Résultat net estimé = EPS × actions en circulation
                    </Text>
                  )}
                </>
              )}
            </View>
          )}

          {selectedSection === "bilan" && (
            <View style={styles.content}>
              <View style={styles.unavailableCard}>
                <Ionicons name="document-text-outline" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={styles.unavailableTitle}>Bilan comptable</Text>
                <Text style={styles.unavailableText}>
                  Les données du bilan (actif, passif, capitaux propres) ne sont pas disponibles via l'API.
                </Text>
              </View>
            </View>
          )}

          {selectedSection === "ratios" && (
            <View style={styles.content}>
              <Text style={styles.dataSourceNote}>
                Données issues de l'API Finn · {stock?.symbol}
              </Text>
              <View style={styles.dataCard}>
                {ratios.map((ratio, i) => (
                  <View key={i} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{ratio.label}</Text>
                    <Text style={[
                      styles.ratioValue,
                      !ratio.available && styles.dataValueUnavailable,
                    ]}>
                      {ratio.value}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.estimateNote}>
                — = données non disponibles via l'API
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  placeholder: { width: 40 },

  periodTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodTabActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  periodTabText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  periodTabTextActive: { color: "#FFF" },

  sectionTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  sectionTabActive: {
    borderColor: PURPLE,
    backgroundColor: "rgba(139,92,246,0.12)",
  },
  sectionTabText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  sectionTabTextActive: { color: PURPLE },

  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  loadingText: { color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 8 },
  errorText: { color: RED, fontSize: 14, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  retryText: { color: PURPLE, fontWeight: "600", fontSize: 14 },

  dataSourceNote: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 12,
    textAlign: "center",
  },
  dataCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  dataLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  dataValue: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  dataValueUnavailable: { color: "rgba(255,255,255,0.25)" },
  ratioValue: { fontSize: 15, fontWeight: "600", color: PURPLE },

  estimateNote: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginTop: 10,
    paddingHorizontal: 4,
  },

  unavailableCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  unavailableText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 20,
  },

  bottomSpacer: { height: 40 },
});
