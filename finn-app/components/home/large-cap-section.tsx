import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LargeCapCard } from "@/components/stocks/large-cap-card";
import { formatMarketCap, formatShares, Stock } from "@/services/api";
import { router } from "expo-router";

interface Props {
  stocks: Stock[];
  loading: boolean;
  onPressStock: (stock: Stock) => void;
}

export const LargeCapSection: React.FC<Props> = ({
  stocks,
  loading,
}) => {
  const largeCaps = [...stocks]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 6);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Grandes capitalisations</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" />
      ) : (
        <View style={styles.grid}>
          {largeCaps.map((stock, index) => (
            <LargeCapCard
              key={stock._id}
              symbol={stock.symbol}
              name={stock.shortName}
              percentVar={stock.percentVar}
              logo={stock.logo || ""}
              rank={index + 1}
              onPress={() =>
                router.push({
                  pathname: "/company-profile",
                  params: {
                    symbol: stock.symbol,
                    name: stock.shortName,
                    price: stock.currentPrice.toString(),
                    change: stock.percentVar.toString(),
                    logo: stock.logo || "",
                    location: stock.country,
                    website: stock.website,
                    about: stock.summary,
                    marketCap: formatMarketCap(stock.marketCap, stock.currency),
                    shares: formatShares(stock.sharesStats),
                    revenue: "N/A",
                    eps: stock.EPS?.toString() || "N/A",
                    peRatio: stock.PER?.toString() || "N/A",
                    dividend: stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : "0.00%",
                    currency: stock.currency,
                  },
                } as any)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});