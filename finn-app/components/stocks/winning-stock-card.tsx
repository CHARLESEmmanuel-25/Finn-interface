import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LogoImage } from "../../components/LogoImage";

interface WinningStockCardProps {
  symbol: string;
  name: string;
  price: string;
  percentVar: number;
  logo?: string;
  onPress: () => void;
}

export const WinningStockCard: React.FC<WinningStockCardProps> = ({
  symbol,
  name,
  price,
  percentVar,
  logo,
  onPress,
}) => {
  const isPositive = percentVar >= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.logoContainer}>
        <LogoImage logo={logo} symbol={symbol} name={name} size={40} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>

      <View style={styles.percentContainer}>
        <Text
          style={[
            styles.percent,
            { color: isPositive ? "#4CD964" : "#FF3B30" },
          ]}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(percentVar).toFixed(2)} %
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  price: {
    fontSize: 13,
    color: "#A9A9A9",
  },
  percentContainer: {
    alignItems: "flex-end",
  },
  percent: {
    fontSize: 13,
    fontWeight: "600",
  },
});