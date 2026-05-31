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
  const [finTab, setFinTab] = useState<"annual" | "quarterly">("annual");
  const [finSection, setFinSection] = useState<"resultat" | "bilan" | "ratios">("resultat");
  const [ratiosExpanded, setRatiosExpanded] = useState(true);

  const quarterlyData = [
    { period: "Q1 '25", revenus: "125M €", revenusChange: "-13.61", ebitda: "-14.6M €", ebitdaChange: "+46.39", resultatNet: "-18.1M €", resultatNetChange: "+38.64" },
    { period: "Q2 '25", revenus: "186M €", revenusChange: "-32.00", ebitda: "-13.3M €", ebitdaChange: "-539.52", resultatNet: "-13.3M €", resultatNetChange: "-694.80" },
    { period: "Q3 '25", revenus: "239M €", revenusChange: "-12.03", ebitda: "5.02M €", ebitdaChange: "-24.68", resultatNet: "3.8M €", resultatNetChange: "-15.20" },
    { period: "Q4 '25", revenus: "272M €", revenusChange: "+8.50", ebitda: "6.7M €", ebitdaChange: "+12.45", resultatNet: "4.5M €", resultatNetChange: "+10.30" },
  ];
  const resultatAnnual = [
    { label: "Chiffre d'affaires", sub: "Total des ventes", value: "$394.3B", change: "+6.0" },
    { label: "EBITDA", sub: "Résultat avant charges", value: "$120.5B", change: "+4.2" },
    { label: "Résultat net", sub: "Bénéfice final", value: "$96.8B", change: "+8.6" },
  ];
  const bilanData = {
    actif: [{ label: "Actifs courants", value: "$150.5B" }, { label: "Actifs non courants", value: "$340.2B" }, { label: "Total Actif", value: "$490.7B", bold: true }],
    passif: [{ label: "Passifs courants", value: "$120.3B" }, { label: "Passifs non courants", value: "$180.1B" }, { label: "Total Passif", value: "$300.4B", bold: true }],
    equity: [{ label: "Capitaux propres", value: "$190.3B", bold: true }],
  };
  const ratiosGroups = [
    {
      category: "VALORISATION",
      items: [
        { label: "PER (Price/Earnings)", sub: "Combien paye-t-on pour €1 de bénéfice", value: "28.7", color: "#8B5CF6", bar: 0.58, hint: "Moy. secteur : 32" },
        { label: "P/B (Price/Book)", sub: "Cours vs valeur comptable de l'entreprise", value: "45.2", color: "#F59E0B", bar: 0.88, hint: "Élevé pour le secteur" },
        { label: "PEG Ratio", sub: "PER rapporté à la croissance des bénéfices", value: "2.3", color: "#F59E0B", bar: 0.38, hint: "Idéal < 1" },
      ],
    },
    {
      category: "RENTABILITÉ",
      items: [
        { label: "Marge Brute", sub: "Part du CA restant après coûts de production", value: "43.5%", color: "#22C55E", bar: 0.75, hint: "Très solide" },
        { label: "Marge d'Exploitation", sub: "Profit avant impôts et intérêts", value: "28.9%", color: "#22C55E", bar: 0.54, hint: "Moy. secteur : 20%" },
        { label: "Marge Nette", sub: "Bénéfice final sur chaque euro de vente", value: "24.6%", color: "#22C55E", bar: 0.48, hint: "Moy. secteur : 15%" },
        { label: "ROE", sub: "Rendement des capitaux propres", value: "50.8%", color: "#22C55E", bar: 0.92, hint: "Exceptionnel" },
        { label: "ROA", sub: "Rendement des actifs totaux", value: "19.7%", color: "#22C55E", bar: 0.65, hint: "Moy. secteur : 8%" },
        { label: "ROIC", sub: "Rendement du capital investi", value: "42.5%", color: "#22C55E", bar: 0.82, hint: "Très élevé" },
      ],
    },
    {
      category: "ENDETTEMENT",
      items: [
        { label: "Dette LT / Equity", sub: "Dettes long terme vs fonds propres", value: "1.8", color: "#F59E0B", bar: 0.45, hint: "Idéal < 1" },
        { label: "Dette / Equity", sub: "Endettement total vs fonds propres", value: "2.1", color: "#F59E0B", bar: 0.55, hint: "Élevé — courant en tech" },
      ],
    },
    {
      category: "LIQUIDITÉ",
      items: [
        { label: "Current Ratio", sub: "Capacité à payer les dettes à court terme", value: "1.5", color: "#22C55E", bar: 0.5, hint: "Idéal > 1" },
        { label: "Quick Ratio", sub: "Liquidité sans compter les stocks", value: "1.2", color: "#22C55E", bar: 0.4, hint: "Idéal > 1" },
        { label: "Cash Ratio", sub: "Cash disponible vs dettes court terme", value: "0.85", color: "#F59E0B", bar: 0.3, hint: "Acceptable" },
      ],
    },
    {
      category: "TECHNIQUE",
      items: [
        { label: "RSI", sub: "Force relative du cours (0 = survendu · 100 = suracheté)", value: "65", color: "#22C55E", bar: 0.65, hint: "Zone neutre (30–70)" },
        { label: "Dividend Growth", sub: "Croissance annuelle du dividende", value: "8.5%", color: "#22C55E", bar: 0.4, hint: "Croissance solide" },
        { label: "Payout Ratio", sub: "Part des bénéfices reversée en dividendes", value: "15.8%", color: "#22C55E", bar: 0.25, hint: "Sain — beaucoup réinvesti" },
      ],
    },
  ];

  // Récupérer les données passées en paramètres
  const companyData = {
    symbol: (params.symbol as string) || "AAPL",
    name: (params.name as string) || "Apple Inc.",
    price: (params.price as string) || "123.45",
    change: (params.change as string) || "+2.5",
    logo: (params.logo as string) || "",
    location: (params.location as string) || "Cupertino, CA, USA",
    website: (params.website as string) || "www.apple.com",
    sector: (params.sector as string) || "",
    industry: (params.industry as string) || "",
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
          <View style={styles.badgeRow}>
            {companyData.location ? (
              <View style={styles.badge}>
                <Ionicons name="location-outline" size={13} color="#8B5CF6" />
                <Text style={styles.badgeText} numberOfLines={1}>{companyData.location}</Text>
              </View>
            ) : null}
            {companyData.sector ? (
              <View style={styles.badge}>
                <Ionicons name="layers-outline" size={13} color="#8B5CF6" />
                <Text style={styles.badgeText} numberOfLines={1}>{companyData.sector}</Text>
              </View>
            ) : null}
            {companyData.industry ? (
              <View style={styles.badge}>
                <Ionicons name="business-outline" size={13} color="#8B5CF6" />
                <Text style={styles.badgeText} numberOfLines={1}>{companyData.industry}</Text>
              </View>
            ) : null}
            {companyData.website ? (
              <View style={styles.badge}>
                <Ionicons name="globe-outline" size={13} color="#8B5CF6" />
                <Text style={styles.badgeText} numberOfLines={1}>{companyData.website}</Text>
              </View>
            ) : null}
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
                          {...({ paddingRight: 16 } as any)}
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
                        
                          style={{
                            padding: 0,
                            paddingRight: hasReal ? 44 : 16,
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

        {/* Données Financières */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Données Financières</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/financial-data",
                  params: { symbol: companyData.symbol, name: companyData.name },
                } as any)
              }
            >
              <Text style={styles.viewAll}>voir tout</Text>
            </TouchableOpacity>
          </View>

          {/* Period tabs */}
          <View style={styles.finPeriodTabs}>
            {(["annual", "quarterly"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.finPeriodTab, finTab === t && styles.finPeriodTabActive]}
                onPress={() => setFinTab(t)}
              >
                <Text style={[styles.finPeriodTabText, finTab === t && styles.finPeriodTabTextActive]}>
                  {t === "annual" ? "Annuel" : "Trimestriel"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section tabs */}
          <View style={styles.finSectionTabs}>
            {(["resultat", "bilan", "ratios"] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.finSectionTab, finSection === s && styles.finSectionTabActive]}
                onPress={() => setFinSection(s)}
              >
                <Text style={[styles.finSectionTabText, finSection === s && styles.finSectionTabTextActive]}>
                  {s === "resultat" ? "Résultat" : s === "bilan" ? "Bilan" : "Ratios"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Résultat */}
          {finSection === "resultat" && (
            <View style={styles.finCard}>
              {finTab === "annual" ? (
                <>
                  <View style={styles.finCardHeader}>
                    <Text style={styles.finCardTitle}>FY 2024</Text>
                    <Text style={styles.finCardSubtitle}>Janv. 2024</Text>
                  </View>
                  {resultatAnnual.map((item, i) => (
                    <View key={i} style={[styles.finRow, i < resultatAnnual.length - 1 && styles.finRowBorder]}>
                      <View>
                        <Text style={styles.finRowLabel}>{item.label}</Text>
                        <Text style={styles.finRowSub}>{item.sub}</Text>
                      </View>
                      <View style={styles.finRowRight}>
                        <Text style={styles.finRowValue}>{item.value}</Text>
                        <View style={[styles.finChangeBadge, parseFloat(item.change) >= 0 ? styles.finChangeBadgePos : styles.finChangeBadgeNeg]}>
                          <Ionicons name={parseFloat(item.change) >= 0 ? "arrow-up" : "arrow-down"} size={10} color={parseFloat(item.change) >= 0 ? "#22C55E" : "#EF4444"} />
                          <Text style={[styles.finChangeText, parseFloat(item.change) >= 0 ? styles.finChangePos : styles.finChangeNeg]}>
                            {Math.abs(parseFloat(item.change))}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                quarterlyData.map((q, i) => (
                  <View key={i} style={[styles.finRow, i < quarterlyData.length - 1 && styles.finRowBorder]}>
                    <Text style={styles.finRowLabel}>{q.period}</Text>
                    <View style={styles.finRowRight}>
                      <Text style={styles.finRowValue}>{q.revenus}</Text>
                      <View style={[styles.finChangeBadge, parseFloat(q.revenusChange) >= 0 ? styles.finChangeBadgePos : styles.finChangeBadgeNeg]}>
                        <Ionicons name={parseFloat(q.revenusChange) >= 0 ? "arrow-up" : "arrow-down"} size={10} color={parseFloat(q.revenusChange) >= 0 ? "#22C55E" : "#EF4444"} />
                        <Text style={[styles.finChangeText, parseFloat(q.revenusChange) >= 0 ? styles.finChangePos : styles.finChangeNeg]}>
                          {Math.abs(parseFloat(q.revenusChange))}%
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Bilan */}
          {finSection === "bilan" && (
            <View style={styles.finCard}>
              {[{ title: "Actif", rows: bilanData.actif }, { title: "Passif", rows: bilanData.passif }, { title: "Equity", rows: bilanData.equity }].map((group) => (
                <View key={group.title} style={styles.bilanGroup}>
                  <Text style={styles.bilanGroupTitle}>{group.title}</Text>
                  {group.rows.map((item, i) => (
                    <View key={i} style={[styles.finRow, i < group.rows.length - 1 && styles.finRowBorder]}>
                      <Text style={[styles.finRowLabel, (item as any).bold && styles.finRowLabelBold]}>{item.label}</Text>
                      <Text style={[styles.finRowValue, (item as any).bold && styles.finRowValueBold]}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Ratios */}
          {finSection === "ratios" && (
            <View>
              {/* Section header with collapse toggle */}
              <View style={styles.ratiosHeader}>
                <Text style={styles.ratiosHeaderTitle}>Ratios financiers</Text>
                <TouchableOpacity style={styles.ratiosToggle} onPress={() => setRatiosExpanded((v) => !v)}>
                  <Text style={styles.ratiosToggleText}>{ratiosExpanded ? "Réduire" : "Afficher"}</Text>
                  <Ionicons name={ratiosExpanded ? "chevron-up" : "chevron-down"} size={13} color="#8B5CF6" />
                </TouchableOpacity>
              </View>

              {ratiosExpanded && ratiosGroups.map((group) => (
                <View key={group.category}>
                  <Text style={styles.ratioCategoryLabel}>{group.category}</Text>
                  <View style={styles.finCard}>
                    {group.items.map((ratio, i) => (
                      <View key={i} style={[styles.ratioItem, i < group.items.length - 1 && styles.finRowBorder]}>
                        {/* Top line: name + value */}
                        <View style={styles.ratioTopRow}>
                          <Text style={styles.ratioItemLabel}>{ratio.label}</Text>
                          <Text style={[styles.ratioItemValue, { color: ratio.color }]}>{ratio.value}</Text>
                        </View>
                        {/* Description */}
                        <Text style={styles.ratioItemSub}>{ratio.sub}</Text>
                        {/* Bar + hint */}
                        <View style={styles.ratioBarRow}>
                          <View style={styles.ratioBarTrack}>
                            <View style={[styles.ratioBarFill, { width: `${Math.round(ratio.bar * 100)}%` as any, backgroundColor: ratio.color }]} />
                          </View>
                          <Text style={styles.ratioHint}>{ratio.hint}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
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
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
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

  // Financial Data embedded
  finPeriodTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  finPeriodTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  finPeriodTabActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  finPeriodTabText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  finPeriodTabTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  finSectionTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  finSectionTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  finSectionTabActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  finSectionTabText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  finSectionTabTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  finCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  finCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  finCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  finCardSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  finRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  finRowLabel: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "500",
  },
  finRowLabelBold: {
    fontWeight: "700",
  },
  finRowSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  finRowValue: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  finRowValueBold: {
    fontWeight: "700",
    color: "#8B5CF6",
  },
  finRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  finChangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  finChangeBadgePos: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  finChangeBadgeNeg: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  finChangeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  finChangePos: {
    color: "#22C55E",
  },
  finChangeNeg: {
    color: "#EF4444",
  },
  bilanGroup: {
    marginBottom: 0,
  },
  bilanGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  ratiosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 2,
  },
  ratiosHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  ratiosToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratiosToggleText: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  ratioCategoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.1,
    marginTop: 16,
    marginBottom: 8,
  },
  ratioItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ratioTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  ratioItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  ratioItemValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  ratioItemSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    marginBottom: 8,
  },
  ratioBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratioBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  ratioBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  ratioHint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    minWidth: 90,
    textAlign: "right",
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
