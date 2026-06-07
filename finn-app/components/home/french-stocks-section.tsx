import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import FrenchStockCard from "../french stocks/french-stock-card";
import { Stock, formatPrice } from "@/services/api";

interface Props {
  stocks: Stock[];
  loading?: boolean;
  onPressStock?: (stock: Stock) => void;
  onPressMore: () => void;
}

export const FrenchStocksSection: React.FC<Props> = ({ stocks, loading, onPressStock, onPressMore }) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Top du moment</Text>
        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.more}>voir plus</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#8B5CF6" style={{ marginVertical: 20 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stocks.map((stock) => (
            <FrenchStockCard
              key={stock._id}
              symbol={stock.symbol}
              name={stock.shortName}
              price={formatPrice(stock.currentPrice, stock.currency)}
              change={stock.percentVar}
              onPress={onPressStock ? () => onPressStock(stock) : undefined}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  more: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
});
