import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Stock, formatMarketCap, formatPrice, formatShares } from "../../services/api";
import { WinningStockCard } from "../stocks/winning-stock-card";
import { router } from "expo-router";

interface Props {
  stocks: Stock[];
  loading: boolean;
  onPressStock: (stock: Stock) => void;
}

export const WinningStocksSection: React.FC<Props> = ({
  stocks,
  loading,
}) => {
  const winners = [...stocks]
    .filter((s) => s.percentVar > 0)
    .sort((a, b) => b.percentVar - a.percentVar)
    .slice(0, 5);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Actions gagnantes</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" />
      ) : (
        <View style={styles.list}>
          {winners.map((stock) => (
            <WinningStockCard
              key={stock._id}
              symbol={stock.symbol}
              name={stock.shortName}
              price={formatPrice(stock.currentPrice, stock.currency)}
              percentVar={stock.percentVar}
              logo={stock.logo || ""}
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
  list: {
    gap: 8,
  },
});