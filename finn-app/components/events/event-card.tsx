import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { glass, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/glass";

interface EventCardProps {
  title: string;
  date: string;
  symbol?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ title, date, symbol }) => {
  return (
    <View style={[glass.card, styles.card]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-clear-outline" size={14} color="#8B5CF6" />
        </View>
        {symbol && <Text style={styles.symbol}>{symbol}</Text>}
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  iconBox: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 8,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  symbol: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
