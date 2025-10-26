import { ScrollView, StyleSheet, StatusBar, View, Text, Dimensions } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FrenchStocksHeader } from "@/components/french stocks/header";
import { FrenchStockFilter } from "@/components/french stocks/filter";

const FrenchStocks = () => {
  return (
    <SafeAreaView style={styles.SafeAreaView}>
      <StatusBar barStyle={"light-content"} />
      <View>
        <FrenchStocksHeader />
      </View>

      <ScrollView
        style={styles.scrollview}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <FrenchStockFilter />
          <View style={styles.table}>
            <Text style={{ color: "#FFF" }}>
              Tableau des actions/stocks à implementer...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FrenchStocks;

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollview: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: 16
  },
  table: {
    flex: 1,
    height: Dimensions.get("window").height - 300,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
});
