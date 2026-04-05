import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface SectorCardProps {
  name: string;
  icon: string;
}

export const SectorCard: React.FC<SectorCardProps> = ({ name, icon }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 16,
    minWidth: 80,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    color: "#FFF",
    textAlign: "center",
  },
});