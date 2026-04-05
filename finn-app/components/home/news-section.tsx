import React from "react";
import { View, Text, StyleSheet } from "react-native";
import NewsListItem from "../news/news-list-item";

export const NewsSection = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Actualités</Text>

      <View style={styles.list}>
        <NewsListItem
          title="Tesla annonce une nouvelle usine en Europe"
          source="Reuters"
        />

        <NewsListItem
          title="Inflation en baisse aux États-Unis"
          source="Bloomberg"
        />

        <NewsListItem
          title="Apple lance de nouveaux produits"
          source="TechCrunch"
        />
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
  list: {
    gap: 12,
  },
  
});