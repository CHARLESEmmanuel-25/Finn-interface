import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSectorEntry } from "@/constants/sectorIcons";

interface SectorCardProps {
  name: string;
  icon?: string;
}

export const SectorCard: React.FC<SectorCardProps> = ({ name }) => {
  const entry = getSectorEntry(name);

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: entry.bg }]}>
        <MaterialCommunityIcons name={entry.icon} size={22} color={entry.color} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    minWidth: 150,
    height: 58,
  },
  iconBox: {
    borderRadius: 10,
    padding: 7,
    marginRight: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
    flexShrink: 1,
  },
});
