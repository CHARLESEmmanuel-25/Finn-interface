import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FinancialData() {
  const params = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<"annual" | "quarterly">("annual");
  const [selectedSection, setSelectedSection] = useState<"bilan" | "resultat" | "ratios">("resultat");

  const companySymbol = params.symbol as string || "AAPL";
  const companyName = params.name as string || "Apple Inc.";

  // Données financières par trimestre
  const quarterlyData = [
    {
      period: "Q1 '25",
      revenus: "125M €",
      revenusChange: "-13.61",
      ebitda: "-14.6M €",
      ebitdaChange: "+46.39",
      resultatNet: "-18.1M €",
      resultatNetChange: "+38.64",
    },
    {
      period: "Q2 '25",
      revenus: "186M €",
      revenusChange: "-32.00",
      ebitda: "-13.3M €",
      ebitdaChange: "-539.52",
      resultatNet: "-13.3M €",
      resultatNetChange: "-694.80",
    },
    {
      period: "Q3 '25",
      revenus: "239M €",
      revenusChange: "-12.03",
      ebitda: "5.02M €",
      ebitdaChange: "-24.68",
      resultatNet: "3.8M €",
      resultatNetChange: "-15.20",
    },
    {
      period: "Q4 '25",
      revenus: "272M €",
      revenusChange: "+8.50",
      ebitda: "6.7M €",
      ebitdaChange: "+12.45",
      resultatNet: "4.5M €",
      resultatNetChange: "+10.30",
    },
  ];

  // Données du bilan
  const bilanData = {
    actif: [
      { label: "Actifs courants", value: "$150.5B" },
      { label: "Actifs non courants", value: "$340.2B" },
      { label: "Total Actif", value: "$490.7B", bold: true },
    ],
    passif: [
      { label: "Passifs courants", value: "$120.3B" },
      { label: "Passifs non courants", value: "$180.1B" },
      { label: "Total Passif", value: "$300.4B", bold: true },
    ],
    equity: [
      { label: "Capitaux propres", value: "$190.3B", bold: true },
    ],
  };

  // Données du compte de résultat
  const resultatData = [
    { label: "Chiffre d'affaires", value: "$394.3B" },
    { label: "EBITDA", value: "$120.5B" },
    { label: "Résultat d'exploitation", value: "$110.2B" },
    { label: "Résultat net", value: "$96.8B" },
  ];

  // Ratios financiers
  const ratiosData = [
    { label: "PER (Price/Earnings)", value: "28.7" },
    { label: "P/B (Price/Book)", value: "45.2" },
    { label: "PEG", value: "2.3" },
    { label: "Marge Brute", value: "43.5%" },
    { label: "Marge d'Exploitation", value: "28.9%" },
    { label: "Marge Nette", value: "24.6%" },
    { label: "Dette LT/Equity", value: "1.8" },
    { label: "Dette/Equity", value: "2.1" },
    { label: "Cash Ratio", value: "0.85" },
    { label: "Quick Ratio", value: "1.2" },
    { label: "Current Ratio", value: "1.5" },
    { label: "ROIC", value: "42.5%" },
    { label: "RSI", value: "65" },
    { label: "ROE", value: "50.8%" },
    { label: "ROA", value: "19.7%" },
    { label: "Dividend Growth", value: "8.5%" },
    { label: "Dividend Yield", value: "0.55%" },
    { label: "Payout Ratio", value: "15.8%" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Données Financières</Text>
          <Text style={styles.headerSubtitle}>{companyName} ({companySymbol})</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs: Annuel / Trimestre */}
      <View style={styles.periodTabs}>
        <TouchableOpacity
          style={[styles.periodTab, selectedTab === "annual" && styles.periodTabActive]}
          onPress={() => setSelectedTab("annual")}
        >
          <Text style={[styles.periodTabText, selectedTab === "annual" && styles.periodTabTextActive]}>
            Annuellement
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodTab, selectedTab === "quarterly" && styles.periodTabActive]}
          onPress={() => setSelectedTab("quarterly")}
        >
          <Text style={[styles.periodTabText, selectedTab === "quarterly" && styles.periodTabTextActive]}>
            Trimestre
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Tabs: Bilan / Compte de résultat / Ratios */}
      <View style={styles.sectionTabs}>
        <TouchableOpacity
          style={[styles.sectionTab, selectedSection === "bilan" && styles.sectionTabActive]}
          onPress={() => setSelectedSection("bilan")}
        >
          <Text style={[styles.sectionTabText, selectedSection === "bilan" && styles.sectionTabTextActive]}>
            Bilan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, selectedSection === "resultat" && styles.sectionTabActive]}
          onPress={() => setSelectedSection("resultat")}
        >
          <Text style={[styles.sectionTabText, selectedSection === "resultat" && styles.sectionTabTextActive]}>
            Résultat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, selectedSection === "ratios" && styles.sectionTabActive]}
          onPress={() => setSelectedSection("ratios")}
        >
          <Text style={[styles.sectionTabText, selectedSection === "ratios" && styles.sectionTabTextActive]}>
            Ratios
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bilan Section */}
        {selectedSection === "bilan" && (
          <View style={styles.content}>
            <View style={styles.bilanSection}>
              <Text style={styles.bilanTitle}>Actif</Text>
              <View style={styles.bilanCard}>
                {bilanData.actif.map((item, index) => (
                  <View key={index} style={styles.bilanRow}>
                    <Text style={[styles.bilanLabel, item.bold && styles.bilanLabelBold]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.bilanValue, item.bold && styles.bilanValueBold]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bilanSection}>
              <Text style={styles.bilanTitle}>Passif</Text>
              <View style={styles.bilanCard}>
                {bilanData.passif.map((item, index) => (
                  <View key={index} style={styles.bilanRow}>
                    <Text style={[styles.bilanLabel, item.bold && styles.bilanLabelBold]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.bilanValue, item.bold && styles.bilanValueBold]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.bilanSection}>
              <Text style={styles.bilanTitle}>Equity</Text>
              <View style={styles.bilanCard}>
                {bilanData.equity.map((item, index) => (
                  <View key={index} style={styles.bilanRow}>
                    <Text style={[styles.bilanLabel, item.bold && styles.bilanLabelBold]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.bilanValue, item.bold && styles.bilanValueBold]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Compte de résultat Section */}
        {selectedSection === "resultat" && (
          <View style={styles.content}>
            {selectedTab === "quarterly" ? (
              quarterlyData.map((quarter, index) => (
                <View key={index} style={styles.quarterCard}>
                  <Text style={styles.quarterTitle}>{quarter.period}</Text>
                  
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Revenus</Text>
                    <View style={styles.financialRight}>
                      <Text style={styles.financialValue}>{quarter.revenus}</Text>
                      <View style={[ styles.changeBadge, parseFloat(quarter.revenusChange) >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
                        <Ionicons 
                          name={parseFloat(quarter.revenusChange) >= 0 ? "arrow-up" : "arrow-down"} 
                          size={12} 
                          color={parseFloat(quarter.revenusChange) >= 0 ? "#4CD964" : "#FF3B30"} 
                        />
                        <Text style={[styles.changeText, parseFloat(quarter.revenusChange) >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                          {Math.abs(parseFloat(quarter.revenusChange))}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>EBITDA</Text>
                    <View style={styles.financialRight}>
                      <Text style={styles.financialValue}>{quarter.ebitda}</Text>
                      <View style={[styles.changeBadge, parseFloat(quarter.ebitdaChange) >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
                        <Ionicons 
                          name={parseFloat(quarter.ebitdaChange) >= 0 ? "arrow-up" : "arrow-down"} 
                          size={12} 
                          color={parseFloat(quarter.ebitdaChange) >= 0 ? "#4CD964" : "#FF3B30"} 
                        />
                        <Text style={[styles.changeText, parseFloat(quarter.ebitdaChange) >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                          {Math.abs(parseFloat(quarter.ebitdaChange))}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Résultat net</Text>
                    <View style={styles.financialRight}>
                      <Text style={styles.financialValue}>{quarter.resultatNet}</Text>
                      <View style={[styles.changeBadge, parseFloat(quarter.resultatNetChange) >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
                        <Ionicons 
                          name={parseFloat(quarter.resultatNetChange) >= 0 ? "arrow-up" : "arrow-down"} 
                          size={12} 
                          color={parseFloat(quarter.resultatNetChange) >= 0 ? "#4CD964" : "#FF3B30"} 
                        />
                        <Text style={[styles.changeText, parseFloat(quarter.resultatNetChange) >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                          {Math.abs(parseFloat(quarter.resultatNetChange))}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.resultatCard}>
                {resultatData.map((item, index) => (
                  <View key={index} style={styles.resultatRow}>
                    <Text style={styles.resultatLabel}>{item.label}</Text>
                    <Text style={styles.resultatValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Ratios Section */}
        {selectedSection === "ratios" && (
          <View style={styles.content}>
            <View style={styles.ratiosCard}>
              {ratiosData.map((ratio, index) => (
                <View key={index} style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>{ratio.label}</Text>
                  <Text style={styles.ratioValue}>{ratio.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#A9A9A9",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },

  // Period Tabs
  periodTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    alignItems: "center",
  },
  periodTabActive: {
    backgroundColor: "#8B5CF6",
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A9A9A9",
  },
  periodTabTextActive: {
    color: "#FFF",
  },

  // Section Tabs
  sectionTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  sectionTabActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A9A9A9",
  },
  sectionTabTextActive: {
    color: "#8B5CF6",
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },

  // Bilan Styles
  bilanSection: {
    marginBottom: 24,
  },
  bilanTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },
  bilanCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  bilanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  bilanLabel: {
    fontSize: 14,
    color: "#A9A9A9",
  },
  bilanLabelBold: {
    fontWeight: "bold",
    color: "#FFF",
  },
  bilanValue: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  bilanValueBold: {
    fontWeight: "bold",
    color: "#8B5CF6",
  },

  // Quarter Card Styles
  quarterCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quarterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  financialLabel: {
    fontSize: 14,
    color: "#A9A9A9",
  },
  financialRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  financialValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  changeBadgePositive: {
    backgroundColor: "rgba(76, 217, 100, 0.15)",
  },
  changeBadgeNegative: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  changeTextPositive: {
    color: "#4CD964",
  },
  changeTextNegative: {
    color: "#FF3B30",
  },

  // Resultat Card
  resultatCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  resultatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  resultatLabel: {
    fontSize: 14,
    color: "#A9A9A9",
  },
  resultatValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },

  // Ratios Styles
  ratiosCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
  },
  ratioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  ratioLabel: {
    fontSize: 14,
    color: "#A9A9A9",
  },
  ratioValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B5CF6",
  },

  bottomSpacer: {
    height: 40,
  },
});