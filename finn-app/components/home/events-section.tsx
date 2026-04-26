import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EventCard } from "../events/event-card";

export const EventsSection = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Evenements à venir</Text>

      <View style={styles.grid}>
        <EventCard title="Q3 Earnings Call" date="15 Oct" symbol="AAPL" />
        <EventCard title="Annual Meeting" date="20 Nov" symbol="MSFT" />
      </View>
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
    gap: 16,
  },
});