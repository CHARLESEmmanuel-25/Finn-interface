import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function CompanyProfile() {
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState("Last Week");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Récupérer les données passées en paramètres
  const companyData = {
    symbol: params.symbol as string || "AAPL",
    name: params.name as string || "Apple Inc.",
    price: params.price as string || "123.45",
    change: params.change as string || "+2.5",
    logo: params.logo as string || "https://logo.clearbit.com/apple.com",
    location: params.location as string || "Cupertino, CA, USA",
    website: params.website as string || "www.apple.com",
    about: params.about as string || "No description available.",
    marketCap: params.marketCap as string || "$0.0T",
    shares: params.shares as string || "0.0B",
    revenue: params.revenue as string || "$0.0B",
    eps: params.eps as string || "$0.00",
    peRatio: params.peRatio as string || "0.0",
    dividend: params.dividend as string || "0.00%",
  };

  // Données pour le graphique
  const chartData = {
    labels: ["Jul 12", "Jul 13", "Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18"],
    datasets: [
      {
        data: [50, 200, 150, 350, 600, 400, 550],
      },
    ],
  };

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
        <Text style={styles.headerTitle}>Company Profile</Text>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => setIsBookmarked(!isBookmarked)}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info */}
        <View style={styles.companyHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: companyData.logo }}
              style={styles.logo}
            />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyData.name} ({companyData.symbol})</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${companyData.price}</Text>
              <Ionicons 
                name={parseFloat(companyData.change) >= 0 ? "arrow-up" : "arrow-down"} 
                size={16} 
                color={parseFloat(companyData.change) >= 0 ? "#4CD964" : "#FF3B30"} 
              />
              <Text style={[
                styles.change, 
                { color: parseFloat(companyData.change) >= 0 ? "#4CD964" : "#FF3B30" }
              ]}>
                {parseFloat(companyData.change) >= 0 ? "+" : ""}{companyData.change}%
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About:</Text>
          <Text style={styles.aboutText}>
            {companyData.about}{" "}
            <Text style={styles.readMore}>Read More...</Text>
          </Text>

          {/* Location & Website */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color="#A9A9A9" />
              <Text style={styles.infoText}>{companyData.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="globe-outline" size={18} color="#A9A9A9" />
              <Text style={styles.infoText}>{companyData.website}</Text>
            </View>
          </View>
        </View>

        {/* Stock Graph */}
        <View style={styles.section}>
          <View style={styles.graphHeader}>
            <Text style={styles.sectionTitle}>Stock Graph</Text>
            <View style={styles.periodSelector}>
              <Text style={styles.periodText}>{selectedPeriod}</Text>
              <Ionicons name="chevron-down" size={16} color="#8B5CF6" />
            </View>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: "#1A1A1A",
                backgroundGradientFrom: "#1A1A1A",
                backgroundGradientTo: "#1A1A1A",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(169, 169, 169, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#8B5CF6",
                  fill: "#8B5CF6",
                },
                propsForBackgroundLines: {
                  strokeDasharray: "5,5",
                  stroke: "#333",
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
            />
          </View>
        </View>

        {/* Key Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard label="Market Cap" value={companyData.marketCap} />
              <StatCard label="Shares Stats" value={companyData.shares} />
              <StatCard label="Annual Revenue" value={companyData.revenue} />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="EPS (TTM)" value={companyData.eps} />
              <StatCard label="P/E Ratio" value={companyData.peRatio} />
              <StatCard label="Dividend Yield" value={companyData.dividend} />
            </View>
          </View>
        </View>

        {/* Recent & Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.eventsHeader}>
            <Text style={styles.sectionTitle}>Recent & Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventsScroll}
          >
            <EventCard
              title="Q3 Earnings Call"
              date="Aug 15, 2025"
              image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=200&fit=crop"
            />
            <EventCard
              title="Annual Meeting"
              date="Nov 20, 2025"
              image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop"
            />
          </ScrollView>
        </View>

        {/* Set Price Alerts */}
        <View style={styles.section}>
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="notifications" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Set Price Alerts</Text>
              <Text style={styles.alertDescription}>
                Get notified when {companyData.symbol} reaches a specific price.
              </Text>
            </View>
            <TouchableOpacity style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Set Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant StatCard
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// Composant EventCard
const EventCard = ({
  title,
  date,
  image,
}: {
  title: string;
  date: string;
  image: string;
}) => (
  <View style={styles.eventCard}>
    <Image source={{ uri: image }} style={styles.eventImage} />
    <View style={styles.eventOverlay}>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventDate}>{date}</Text>
    </View>
  </View>
);

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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  bookmarkButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },

  // Company Header
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#8B5CF6",
    marginRight: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#A9A9A9",
    marginRight: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CD964",
    marginLeft: 4,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
  },

  // About
  aboutText: {
    fontSize: 14,
    color: "#A9A9A9",
    lineHeight: 22,
    marginBottom: 16,
  },
  readMore: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  infoRow: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#A9A9A9",
  },

  // Graph
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  periodText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  chart: {
    borderRadius: 16,
  },

  // Key Stats
  statsContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  statLabel: {
    fontSize: 12,
    color: "#A9A9A9",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },

  // Events
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  eventsScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  eventCard: {
    width: 240,
    height: 160,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#A9A9A9",
  },

  // Alert Card
  alertCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: "#A9A9A9",
    lineHeight: 18,
  },
  alertButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },

  bottomSpacer: {
    height: 40,
  },
});