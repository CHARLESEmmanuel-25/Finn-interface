import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogoImage } from "../../components/LogoImage";

interface LargeCapCardProps {
  symbol: string;
  name: string;
  percentVar: number;
  logo?: string;
  rank: number;
  onPress: () => void;
}

export const LargeCapCard: React.FC<LargeCapCardProps> = ({
  symbol,
  name,
  percentVar,
  logo,
  rank,
  onPress,
}) => {
  const isPositive = percentVar >= 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.rank}>{rank}</Text>

      <View style={styles.iconContainer}>
        <LogoImage logo={logo} symbol={symbol} name={name} size={36} />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.changeContainer}>
        <Ionicons
          name={isPositive ? "arrow-up" : "arrow-down"}
          size={12}
          color={isPositive ? "#4CD964" : "#FF3B30"}
        />
        <Text
          style={[
            styles.percent,
            { color: isPositive ? "#4CD964" : "#FF3B30" },
          ]}
        >
          {Math.abs(percentVar).toFixed(2)} %
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "31%",
    minWidth: 95,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    position: "relative",
  },
  rank: {
    position: "absolute",
    top: 8,
    right: 10,
    fontSize: 32,
    fontWeight: "300",
    color: "rgba(255,255,255,0.08)",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  percent: {
    fontSize: 14,
    fontWeight: "600",
  },
});