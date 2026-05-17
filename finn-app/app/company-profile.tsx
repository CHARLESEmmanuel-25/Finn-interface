import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchStockHistory, OhlcvPoint } from "@/services/api";

const { width } = Dimensions.get("window");

const PERIODS = ["1D", "1W", "1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_API_MAP: Record<Period, "1m" | "3m" | "6m" | "1y" | null> = {
  "1D": null,
  "1W": null,
  "1M": "1m",
  "3M": "3m",
  "6M": "6m",
  "1Y": "1y",
};

function samplePoints<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0);
}

// Génère une courbe déterministe (basée sur le symbole) quand l'historique est absent
function generateSyntheticData(
  currentPrice: number,
  changePct: number,
  symbol: string,
  n = 24,
) {
  const openPrice = currentPrice / (1 + changePct / 100);
  const diff = currentPrice - openPrice;
  const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const osc =
      Math.sin(t * Math.PI * (3 + (seed % 4)) + seed * 0.1) *
      Math.abs(diff) *
      0.25;
    return Math.max(openPrice * 0.99, openPrice + diff * eased + osc);
  });
}

export default function CompanyProfile() {
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1D");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [history, setHistory] = useState<OhlcvPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Récupérer les données passées en paramètres
  const companyData = {
    symbol: (params.symbol as string) || "AAPL",
    name: (params.name as string) || "Apple Inc.",
    price: (params.price as string) || "123.45",
    change: (params.change as string) || "+2.5",
    logo: (params.logo as string) || "",
    location: (params.location as string) || "Cupertino, CA, USA",
    website: (params.website as string) || "www.apple.com",
    about: (params.about as string) || "No description available.",
    marketCap: (params.marketCap as string) || "$0.0T",
    shares: (params.shares as string) || "0.0B",
    revenue: (params.revenue as string) || "$0.0B",
    eps: (params.eps as string) || "$0.00",
    peRatio: (params.peRatio as string) || "0.0",
    dividend: (params.dividend as string) || "0.00%",
    currency: (params.currency as string) || "USD",
  };

  useEffect(() => {
    const checkPortfolioStatus = async () => {
      try {
        const portfolioData = await AsyncStorage.getItem("portfolio");
        if (portfolioData) {
          const portfolio = JSON.parse(portfolioData);
          const exists = portfolio.some(
            (item: any) => item.symbol === companyData.symbol,
          );
          setIsInPortfolio(exists);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du portfolio:", error);
      }
    };

    checkPortfolioStatus();
  }, [companyData.symbol]);

  useEffect(() => {
    const apiPeriod = PERIOD_API_MAP[selectedPeriod];
    if (!apiPeriod) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    fetchStockHistory(companyData.symbol, apiPeriod)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [companyData.symbol, selectedPeriod]);

  const handleTogglePortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem("portfolio");
      let portfolio = portfolioData ? JSON.parse(portfolioData) : [];

      if (isInPortfolio) {
        // Retirer du portfolio
        portfolio = portfolio.filter(
          (item: any) => item.symbol !== companyData.symbol,
        );
        setIsInPortfolio(false);
        Alert.alert("Succès", `${companyData.symbol} retiré du portfolio`);
      } else {
        // Ajouter au portfolio
        const companyToAdd = {
          symbol: companyData.symbol,
          name: companyData.name,
          price: companyData.price,
          change: companyData.change,
          logo: companyData.logo,
          location: companyData.location,
          website: companyData.website,
          about: companyData.about,
          marketCap: companyData.marketCap,
          shares: companyData.shares,
          revenue: companyData.revenue,
          eps: companyData.eps,
          peRatio: companyData.peRatio,
          dividend: companyData.dividend,
          currency: companyData.currency,
        };
        portfolio.push(companyToAdd);
        setIsInPortfolio(true);
        Alert.alert("Succès", `${companyData.symbol} ajouté au portfolio`);
      }

      await AsyncStorage.setItem("portfolio", JSON.stringify(portfolio));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du portfolio:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le portfolio");
    }
  };

  const sampled = samplePoints(history, 8);
  const chartData =
    sampled.length > 1
      ? {
          labels: sampled.map((p) => {
            const d = new Date(p.date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }),
          datasets: [{ data: sampled.map((p) => p.close) }],
        }
      : {
          labels: ["—"],
          datasets: [{ data: [0] }],
        };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Profile</Text>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 4,
          }}
        >
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleTogglePortfolio}
          >
            <Ionicons
              name={isInPortfolio ? "bag-remove" : "bag-add"}
              size={24}
              color={isInPortfolio ? "#8B5CF6" : "#FFF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info */}
        <View style={styles.companyHeader}>
          <View style={styles.logoContainer}>
            {companyData.logo ? (
              <Image
                source={{ uri: companyData.logo }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.logoText}>{companyData.symbol}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {companyData.name} ({companyData.symbol})
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${companyData.price}</Text>
              <Ionicons
                name={
                  parseFloat(companyData.change) >= 0
                    ? "arrow-up"
                    : "arrow-down"
                }
                size={16}
                color={
                  parseFloat(companyData.change) >= 0 ? "#4CD964" : "#FF3B30"
                }
              />
              <Text
                style={[
                  styles.change,
                  {
                    color:
                      parseFloat(companyData.change) >= 0
                        ? "#4CD964"
                        : "#FF3B30",
                  },
                ]}
              >
                {parseFloat(companyData.change) >= 0 ? "+" : ""}
                {companyData.change}%
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text
            style={styles.aboutText}
            numberOfLines={descExpanded ? undefined : 2}
          >
            {companyData.about}
          </Text>
          {companyData.about.length > 80 && (
            <TouchableOpacity onPress={() => setDescExpanded((e) => !e)}>
              <Text style={styles.readMore}>
                {descExpanded ? "Réduire" : "Lire la suite"}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color="#A9A9A9" />
              <Text style={styles.infoText} numberOfLines={1}>
                {companyData.location}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="globe-outline" size={16} color="#A9A9A9" />
              <Text style={styles.infoText} numberOfLines={1}>
                {companyData.website}
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Graph */}
        {(() => {
          const isPos = parseFloat(companyData.change) >= 0;
          const chartColor = isPos ? "#22C55E" : "#EF4444";
          const openPrice = history.length > 0 ? history[0].open : null;
          const highPrice =
            history.length > 0 ? Math.max(...history.map((p) => p.high)) : null;
          const lowPrice =
            history.length > 0 ? Math.min(...history.map((p) => p.low)) : null;
          const fmt = (v: number | null) => (v != null ? v.toFixed(2) : "—");
          const curr = companyData.currency === "EUR" ? "€" : "$";

          return (
            <View style={styles.chartSection}>
              {/* Period selector — full width, no title */}
              <View style={styles.periodButtons}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodBtn,
                      selectedPeriod === p && styles.periodBtnActive,
                    ]}
                    onPress={() => setSelectedPeriod(p)}
                  >
                    <Text
                      style={[
                        styles.periodBtnText,
                        selectedPeriod === p && { color: chartColor },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(() => {
                const currentPrice = parseFloat(companyData.price);
                const changePct = parseFloat(companyData.change);
                const hasReal = history.length > 1;
                const synth =
                  !hasReal && currentPrice > 0
                    ? generateSyntheticData(
                        currentPrice,
                        changePct,
                        companyData.symbol,
                      )
                    : null;

                const displayData = hasReal
                  ? chartData
                  : synth
                    ? {
                        labels: Array.from({ length: synth.length }, () => ""),
                        datasets: [{ data: synth }],
                      }
                    : null;

                return (
                  <View style={styles.chartContainer}>
                    {historyLoading ? (
                      <ActivityIndicator
                        color={chartColor}
                        style={{ height: 200 }}
                      />
                    ) : displayData ? (
                      <>
                        <LineChart
                          data={displayData}
                          width={width - 40}
                          height={200}
                          withShadow
                          chartConfig={{
                            backgroundColor: "transparent",
                            backgroundGradientFrom: "#0A0A0F",
                            backgroundGradientTo: "#0A0A0F",
                            decimalPlaces: 2,
                            color: () => chartColor,
                            labelColor: () => "rgba(255,255,255,0.3)",
                            fillShadowGradient: chartColor,
                            fillShadowGradientOpacity: 0.35,
                            fillShadowGradientTo: chartColor,
                            fillShadowGradientToOpacity: 0,
                            propsForDots: { r: "0" },
                            propsForBackgroundLines: {
                              strokeDasharray: "4,6",
                              stroke: "rgba(255,255,255,0.07)",
                              strokeWidth: 1,
                            },
                          }}
                          bezier
                          // style={[
                          //   styles.chart,
                          //   {
                          //     paddingTop: 8,
                          //     // paddingRight = inset gauche du tracé (défaut lib : 64)
                          //     paddingRight: hasReal ? 44 : 0,
                          //   },
                          // ]}
                          style={{
                            padding: 0,
                            // paddingRight: hasReal ? 44 : 0,
                          }}
                          withInnerLines
                          withOuterLines={false}
                          withVerticalLines={false}
                          withHorizontalLines
                          withVerticalLabels={false}
                          withHorizontalLabels={hasReal}
                        />
                        {!hasReal && (
                          <Text style={styles.syntheticNote}>
                            Aperçu basé sur la variation du jour
                          </Text>
                        )}
                      </>
                    ) : (
                      <View style={styles.chartCurrentPrice}>
                        <Ionicons
                          name="stats-chart-outline"
                          size={36}
                          color="#333"
                        />
                        <Text style={styles.chartCurrentSub}>
                          Données indisponibles
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Metrics grid */}
              <View style={styles.metricsGrid}>
                <MetricCell
                  label="Open"
                  value={
                    openPrice != null
                      ? `${curr}${fmt(openPrice)}`
                      : `${curr}${companyData.price}`
                  }
                />
                <MetricCell
                  label="High"
                  value={highPrice != null ? `${curr}${fmt(highPrice)}` : "—"}
                />
                <MetricCell
                  label="Low"
                  value={lowPrice != null ? `${curr}${fmt(lowPrice)}` : "—"}
                />
                <MetricCell
                  label="P/E"
                  value={
                    companyData.peRatio !== "0.0" ? companyData.peRatio : "—"
                  }
                />
                <MetricCell label="Mkt Cap" value={companyData.marketCap} />
                <MetricCell
                  label="EPS"
                  value={companyData.eps !== "$0.00" ? companyData.eps : "—"}
                />
                <MetricCell label="Dividend" value={companyData.dividend} />
                <MetricCell label="Actions" value={companyData.shares} />
                <MetricCell label="Devise" value={companyData.currency} />
              </View>
            </View>
          );
        })()}

        {/* Key Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Key Stats</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/financial-data",
                  params: {
                    symbol: companyData.symbol,
                    name: companyData.name,
                  },
                } as any)
              }
            >
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard label="Market Cap" value={companyData.marketCap} />
              <StatCard label="Shares Stats" value={companyData.shares} />
              <StatCard label="Annual Revenue" value={companyData.revenue} />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="EPS (TTM)" value={companyData.eps} />
              <StatCard label="P/E Ratio" value={companyData.peRatio} />
              <StatCard label="Dividend Yield" value={companyData.dividend} />
            </View>
          </View>
        </View>

        {/* Recent & Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>Recent & Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsScroll}
          >
            <EventCard
              title="Q3 Earnings Call"
              date="Aug 15, 2025"
              image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=200&fit=crop"
            />
            <EventCard
              title="Annual Meeting"
              date="Nov 20, 2025"
              image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop"
            />
          </ScrollView>
        </View>

        {/* Set Price Alerts */}
        <View style={styles.section}>
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="notifications" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Set Price Alerts</Text>
              <Text style={styles.alertDescription}>
                Get notified when {companyData.symbol} reaches a specific price.
              </Text>
            </View>
            <TouchableOpacity style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Set Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant MetricCell (grille sous le graphique)
const MetricCell = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricCell}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

// Composant StatCard
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// Composant EventCard
const EventCard = ({
  title,
  date,
  image,
}: {
  title: string;
  date: string;
  image: string;
}) => (
  <View style={styles.eventCard}>
    <Image source={{ uri: image }} style={styles.eventImage} />
    <View style={styles.eventOverlay}>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventDate}>{date}</Text>
    </View>
  </View>
);

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
  },
  bookmarkButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },

  // Company Header
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#A9A9A9",
    marginRight: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CD964",
    marginLeft: 4,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },

  // About
  aboutText: {
    fontSize: 13,
    color: "#A9A9A9",
    lineHeight: 20,
    marginBottom: 4,
  },
  readMore: {
    color: "#8B5CF6",
    fontWeight: "600",
    fontSize: 13,
    marginTop: 2,
  },
  syntheticNote: {
    fontSize: 10,
    color: "#444",
    textAlign: "center",
    marginTop: 4,
  },
  infoRow: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#A9A9A9",
  },

  // Graph
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  periodButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  periodBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  periodBtnText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "700",
  },
  chartContainer: {
    overflow: "hidden",
  },
  chart: {
    borderRadius: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  metricCell: {
    width: "33.33%",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    color: "#FFF",
    fontWeight: "600",
  },
  chartCurrentPrice: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  chartCurrentLabel: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chartCurrentValue: {
    fontSize: 44,
    fontWeight: "700",
  },
  chartCurrentBadge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chartCurrentChange: {
    fontSize: 15,
    fontWeight: "700",
  },
  chartCurrentSub: {
    fontSize: 11,
    color: "#444",
    marginTop: 4,
  },

  // Key Stats
  statsContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  statLabel: {
    fontSize: 12,
    color: "#A9A9A9",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },

  // Events
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  eventsScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  eventCard: {
    width: 240,
    height: 160,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#A9A9A9",
  },

  // Alert Card
  alertCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: "#A9A9A9",
    lineHeight: 18,
  },
  alertButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },

  bottomSpacer: {
    height: 40,
  },
});
