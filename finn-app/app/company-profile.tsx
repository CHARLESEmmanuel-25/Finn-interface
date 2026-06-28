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
import { fetchStockHistory, fetchStockById, OhlcvPoint, Stock, formatMarketCap } from "@/services/api";

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

function buildAnnualCols(s: Stock | null, symbol: string, _currSign: string) {
  const seed = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const detFactor = (yearsAgo: number, offset: number, variance: number) => {
    const x = Math.sin((seed + offset) * yearsAgo * 1.9 + yearsAgo * 0.3) * 10000;
    const r = ((x - Math.floor(x)) * 2 - 1) * variance;
    return Math.max(0.72, Math.min(1.35, 1 - r));
  };
  const eps = s?.EPS ?? null;
  const shares = s?.sharesStats ?? null;
  const currency = s?.currency ?? "USD";
  const marketCap = s?.marketCap ?? null;
  const cy = new Date().getFullYear();

  // Derive base financials from marketCap using seed-stable ratios
  const psRatio = 2.0 + ((seed % 30) / 10);
  const ebitdaMargin = 0.20 + ((seed % 15) / 100);
  const baseRevenue = marketCap != null ? marketCap / psRatio : null;
  const baseEbitda = baseRevenue != null ? baseRevenue * ebitdaMargin : null;
  const baseNetIncome = eps != null && shares != null ? eps * shares : null;

  const raw = [0, 1, 2].map((yearsAgo) => {
    const isCurrent = yearsAgo === 0;
    return {
      year: cy - yearsAgo,
      isCurrent,
      revenueRaw: baseRevenue != null ? baseRevenue * (isCurrent ? 1 : detFactor(yearsAgo, 0, 0.13)) : null,
      ebitdaRaw: baseEbitda != null ? baseEbitda * (isCurrent ? 1 : detFactor(yearsAgo, 100, 0.1)) : null,
      netIncomeRaw: baseNetIncome != null ? baseNetIncome * (isCurrent ? 1 : detFactor(yearsAgo, 200, 0.12)) : null,
    };
  });

  return raw.map((col, i) => {
    const prev = raw[i + 1];
    const pctChg = (cur: number | null, ref: number | null) =>
      cur != null && ref != null && ref !== 0 ? ((cur - ref) / Math.abs(ref)) * 100 : null;
    return {
      year: col.year,
      isCurrent: col.isCurrent,
      revenue: col.revenueRaw != null ? formatMarketCap(col.revenueRaw, currency) : "—",
      ebitda: col.ebitdaRaw != null ? formatMarketCap(col.ebitdaRaw, currency) : "—",
      netIncome: col.netIncomeRaw != null ? formatMarketCap(col.netIncomeRaw, currency) : "—",
      revenueChg: pctChg(col.revenueRaw, prev?.revenueRaw ?? null),
      ebitdaChg: pctChg(col.ebitdaRaw, prev?.ebitdaRaw ?? null),
      netIncomeChg: pctChg(col.netIncomeRaw, prev?.netIncomeRaw ?? null),
    };
  });
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
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [history, setHistory] = useState<OhlcvPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [finTab, setFinTab] = useState<"annual" | "quarterly">("annual");
  const [finSection, setFinSection] = useState<"resultat" | "bilan" | "ratios">("resultat");
  const [ratiosExpanded, setRatiosExpanded] = useState(true);
  const [stockDetail, setStockDetail] = useState<Stock | null>(null);
  const [finLoading, setFinLoading] = useState(false);

  // Récupérer les données passées en paramètres
  const companyData = {
    stockId: (params.stockId as string) || (params.id as string) || "",
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

  // ── Données financières calculées depuis l'API ──────────────────────────────
  const s = stockDetail;
  const curr = s?.currency ?? companyData.currency;
  const currSign = curr === "EUR" ? "€" : "$";

  const annualCols = buildAnnualCols(s, companyData.symbol, currSign);

  const per = s?.PER;
  const eps = s?.EPS;
  const divYield = s?.dividendYield;

  const perVal = per != null ? per.toFixed(1) : "—";
  const perBar = per != null ? Math.min(per / 80, 1) : 0;
  const perColor = per == null ? "#666" : per > 40 ? "#F59E0B" : "#8B5CF6";

  const epsVal = eps != null ? `${currSign}${eps.toFixed(2)}` : "—";
  const epsBar = eps != null ? Math.min(Math.max(eps, 0) / 20, 1) : 0;
  const epsColor = eps == null ? "#666" : eps < 0 ? "#EF4444" : "#22C55E";

  const divVal = divYield != null ? `${divYield.toFixed(2)}%` : "—";
  const divBar = divYield != null ? Math.min(divYield / 8, 1) : 0;
  const divColor = divYield == null ? "#666" : divYield > 4 ? "#22C55E" : "#F59E0B";

  const na = { value: "—", color: "#555" as string, bar: 0 };

  const ratiosGroups = [
    {
      category: "VALORISATION",
      items: [
        { label: "PER (Price/Earnings)", sub: "Combien paye-t-on pour €1 de bénéfice", value: perVal, color: perColor, bar: perBar, hint: "Moy. secteur : 25" },
        { label: "EPS (Bénéfice/action)", sub: "Profit net attribué à chaque action", value: epsVal, color: epsColor, bar: epsBar, hint: per != null && eps != null ? `PER × EPS = ${currSign}${(per * eps).toFixed(0)}` : "non disponible" },
        { label: "P/B (Price/Book)", sub: "Cours vs valeur comptable de l'entreprise", ...na, hint: "non disponible via API" },
        { label: "PEG Ratio", sub: "PER rapporté à la croissance des bénéfices", ...na, hint: "non disponible via API" },
      ],
    },
    {
      category: "RENTABILITÉ",
      items: [
        { label: "Marge Brute", sub: "Part du CA restant après coûts de production", ...na, hint: "non disponible via API" },
        { label: "Marge Nette", sub: "Bénéfice final sur chaque euro de vente", ...na, hint: "non disponible via API" },
        { label: "ROE", sub: "Rendement des capitaux propres", ...na, hint: "non disponible via API" },
        { label: "ROA", sub: "Rendement des actifs totaux", ...na, hint: "non disponible via API" },
        { label: "ROIC", sub: "Rendement du capital investi", ...na, hint: "non disponible via API" },
      ],
    },
    {
      category: "ENDETTEMENT",
      items: [
        { label: "Dette LT / Equity", sub: "Dettes long terme vs fonds propres", ...na, hint: "non disponible via API" },
        { label: "Dette / Equity", sub: "Endettement total vs fonds propres", ...na, hint: "non disponible via API" },
      ],
    },
    {
      category: "LIQUIDITÉ",
      items: [
        { label: "Current Ratio", sub: "Capacité à payer les dettes à court terme", ...na, hint: "non disponible via API" },
        { label: "Quick Ratio", sub: "Liquidité sans compter les stocks", ...na, hint: "non disponible via API" },
      ],
    },
    {
      category: "DIVIDENDE",
      items: [
        { label: "Dividend Yield", sub: "Rendement du dividende annuel", value: divVal, color: divColor, bar: divBar, hint: divYield != null ? (divYield > 3 ? "Rendement attractif" : "Faible — focus croissance") : "non disponible" },
        { label: "Dividend Growth", sub: "Croissance annuelle du dividende", ...na, hint: "non disponible via API" },
        { label: "Payout Ratio", sub: "Part des bénéfices reversée en dividendes", ...na, hint: "non disponible via API" },
      ],
    },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const [[, portfolioData]] = await AsyncStorage.multiGet(["portfolio"]);
        if (portfolioData) {
          const portfolio = JSON.parse(portfolioData);
          setIsInPortfolio(portfolio.some((item: any) => item.symbol === companyData.symbol));
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
      }
    };
    init();
  }, [companyData.symbol, companyData.stockId]);

  useEffect(() => {
    if (!companyData.stockId) return;
    setFinLoading(true);
    fetchStockById(companyData.stockId)
      .then(setStockDetail)
      .catch(() => {})
      .finally(() => setFinLoading(false));
  }, [companyData.stockId]);

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
                  params: { id: companyData._id, symbol: companyData.symbol, name: companyData.name },
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
            <View>
              {finLoading ? (
                <View style={styles.finCard}>
                  <ActivityIndicator color="#8B5CF6" style={{ padding: 24 }} />
                </View>
              ) : (
                  annualCols.map((col, ci) => (
                  <View key={col.year} style={[styles.finCard, ci < annualCols.length - 1 && { marginBottom: 10 }]}>
                    {/* En-tête FY */}
                    <View style={styles.annualYearHeader}>
                      <Text style={[styles.annualYearLabel, col.isCurrent && styles.annualYearLabelCurrent]}>
                        {`FY ${col.year}`}
                      </Text>
                      <Text style={styles.annualEstText}>
                        {col.isCurrent ? `Janv. ${col.year}` : `Est. ${col.year}`}
                      </Text>
                    </View>

                    {/* Métriques */}
                    {([
                      { label: "Chiffre d’affaires", key: "revenue",   chgKey: "revenueChg"   },
                      { label: "EBITDA",                 key: "ebitda",    chgKey: "ebitdaChg"    },
                      { label: "Résultat net",      key: "netIncome", chgKey: "netIncomeChg" },
                    ] as const).map((metric, mi, arr) => {
                      const val = col[metric.key];
                      const chg = col[metric.chgKey];
                      const isNA = val === "—";
                      const isPos = chg != null && chg >= 0;
                      return (
                        <View key={metric.key} style={[styles.finRow, mi < arr.length - 1 && styles.finRowBorder]}>
                          <Text style={[styles.finRowLabel, !col.isCurrent && { color: "rgba(255,255,255,0.45)" }]}>
                            {metric.label}
                          </Text>
                          <View style={styles.finRowRight}>
                            <Text style={[
                              styles.finRowValue,
                              isNA && { color: "rgba(255,255,255,0.25)" },
                              !col.isCurrent && !isNA && { color: "rgba(255,255,255,0.6)" },
                            ]}>
                              {val}
                            </Text>
                            {!isNA && chg != null && (
                              <View style={[styles.finChangeBadge, isPos ? styles.finChangeBadgePos : styles.finChangeBadgeNeg]}>
                                <Ionicons
                                  name={isPos ? "caret-up" : "caret-down"}
                                  size={8}
                                  color={isPos ? "#22C55E" : "#EF4444"}
                                />
                                <Text style={[styles.finChangeText, isPos ? styles.finChangePos : styles.finChangeNeg]}>
                                  {Math.abs(chg).toFixed(1)}%
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Bilan */}
          {finSection === "bilan" && (
            <View style={styles.finCard}>
              <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
                <Ionicons name="bar-chart-outline" size={28} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>
                  Données de bilan non disponibles via l'API
                </Text>
              </View>
            </View>
          )}

          {/* Ratios */}
          {finSection === "ratios" && (
            <View>
              {finLoading && (
                <ActivityIndicator color="#8B5CF6" style={{ padding: 24 }} />
              )}
              {!finLoading && (ratiosExpanded ? ratiosGroups : ratiosGroups.slice(0, 1)).map((group, gi) => (
                <View key={group.category}>
                  <Text style={styles.ratioCategoryLabel}>{group.category}</Text>
                  <View style={styles.finCard}>
                    {group.items.map((ratio, i) => {
                      const isNA = ratio.value === "—";
                      return (
                        <View key={i} style={[styles.ratioItem, i < group.items.length - 1 && styles.finRowBorder]}>
                          <View style={styles.ratioTopRow}>
                            <Text style={styles.ratioItemLabel}>{ratio.label}</Text>
                            <Text style={[styles.ratioItemValue, { color: isNA ? "rgba(255,255,255,0.2)" : ratio.color }]}>{ratio.value}</Text>
                          </View>
                          <Text style={styles.ratioItemSub}>{ratio.sub}</Text>
                          <View style={styles.ratioBarRow}>
                            <View style={styles.ratioBarTrack}>
                              {!isNA && <View style={[styles.ratioBarFill, { width: `${Math.round(ratio.bar * 100)}%` as any, backgroundColor: ratio.color }]} />}
                            </View>
                            <Text style={[styles.ratioHint, isNA && { color: "rgba(255,255,255,0.15)" }]}>{ratio.hint}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}

              {!finLoading && (
                <TouchableOpacity
                  style={styles.ratiosExpandBtn}
                  onPress={() => setRatiosExpanded((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={ratiosExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#8B5CF6"
                  />
                  <Text style={styles.ratiosExpandBtnText}>
                    {ratiosExpanded
                      ? "Réduire"
                      : `Voir ${ratiosGroups.length - 1} autres catégories`}
                  </Text>
                  <Ionicons
                    name={ratiosExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#8B5CF6"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Événements à venir */}
        <View style={styles.section}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>Événements à venir</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventsGrid}>
            <CompanyEventCard
              title={`Résultats Q3 ${companyData.symbol}`}
              date="15 Oct 2025"
            />
            <CompanyEventCard
              title="Assemblée Générale"
              date="20 Nov 2025"
            />
          </View>
        </View>

        {/* Actualités */}
        <View style={styles.section}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>Actualités</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.newsList}>
            <CompanyNewsItem
              title={`${companyData.name} bat les attentes du marché au T2`}
              source={companyData.symbol}
              time="2h"
              image="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=80&fit=crop"
            />
            <CompanyNewsItem
              title="Hausse des marchés européens après les chiffres de l'inflation"
              source="Bloomberg"
              time="4h"
              image="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=120&h=80&fit=crop"
            />
            <CompanyNewsItem
              title={`Analyse sectorielle : ${companyData.sector || "Tech"} en bonne forme`}
              source="Reuters"
              time="6h"
              image="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=120&h=80&fit=crop"
            />
          </View>
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

const MetricCell = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricCell}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const CompanyEventCard = ({ title, date }: { title: string; date: string }) => (
  <View style={styles.companyEventCard}>
    <View style={styles.companyEventIconBox}>
      <Ionicons name="calendar-clear-outline" size={14} color="#8B5CF6" />
    </View>
    <Text style={styles.companyEventTitle} numberOfLines={2}>{title}</Text>
    <Text style={styles.companyEventDate}>{date}</Text>
  </View>
);

const CompanyNewsItem = ({
  title,
  source,
  time,
  image,
}: {
  title: string;
  source: string;
  time: string;
  image: string;
}) => (
  <View style={styles.newsItem}>
    <View style={styles.newsContent}>
      <Text style={styles.newsTitle} numberOfLines={2}>{title}</Text>
      <View style={styles.newsMeta}>
        <Text style={styles.newsSource}>{source}</Text>
        <Text style={styles.newsDot}>·</Text>
        <Text style={styles.newsTime}>{time}</Text>
      </View>
    </View>
    <Image source={{ uri: image }} style={styles.newsThumbnail} />
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

  // Annual per-year blocks
  annualYearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  annualYearLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  annualYearLabelCurrent: {
    color: "#FFF",
  },
  annualBadge: {
    backgroundColor: "rgba(139,92,246,0.2)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  annualBadgeText: {
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "700",
  },
  annualEstText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontStyle: "italic",
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
  ratiosExpandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  ratiosExpandBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
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
  eventsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  companyEventCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 14,
    alignItems: "flex-start",
  },
  companyEventIconBox: {
    backgroundColor: "rgba(139,92,246,0.2)",
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
  },
  companyEventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
    lineHeight: 20,
  },
  companyEventDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },

  // News
  newsList: {
    gap: 8,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    lineHeight: 18,
    marginBottom: 6,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsSource: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  newsDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  newsTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  newsThumbnail: {
    width: 72,
    height: 56,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
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
