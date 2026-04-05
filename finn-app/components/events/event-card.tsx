import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EventCardProps {
  title: string;
  date: string;
}

export const EventCard: React.FC<EventCardProps> = ({ title, date }) => {
  return (
    <View style={styles.card}>
      <Ionicons name="calendar" size={20} color="#8B5CF6" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: "#A9A9A9",
  },
});