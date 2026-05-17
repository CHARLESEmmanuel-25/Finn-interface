import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import FrenchStockCard from "../french stocks/french-stock-card";

interface Props {
  stocks: any[];
  onPressMore: () => void;
}

export const FrenchStocksSection: React.FC<Props> = ({
  stocks,
  onPressMore,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Actions françaises</Text>

        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.more}>voir plus</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {stocks.map((stock) => (
          <FrenchStockCard
            key={stock.symbol}
            symbol={stock.symbol}
            name={stock.name}
            price={stock.price}
            change={stock.change}
          />
        ))}
      </ScrollView>
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