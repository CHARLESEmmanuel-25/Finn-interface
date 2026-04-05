import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const periods = ["1S", "1M", "1A"];

export const PortfolioCard = () => {
  const [activePeriod, setActivePeriod] = useState("1S");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon portefeuille</Text>

        <View style={styles.periodContainer}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                activePeriod === period && styles.activePeriod,
              ]}
              onPress={() => setActivePeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  activePeriod === period && styles.activePeriodText,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.amount}>€24 830</Text>

      <Text style={styles.growth}>+€318 aujourd&apos;hui</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#9E9E9E",
    fontSize: 14,
  },

  amount: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 10,
  },

  growth: {
    color: "#4ADE80",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },

  periodContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 3,
  },

  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },

  activePeriod: {
    backgroundColor: "#6D5EF6",
  },

  periodText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },

  activePeriodText: {
    color: "white",
  },
});