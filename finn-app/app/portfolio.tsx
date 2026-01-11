import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PortfolioCompany {
  symbol: string;
  name: string;
  price: string;
  change: string;
  logo: string;
  location: string;
  website: string;
  about: string;
  marketCap: string;
  shares: string;
  revenue: string;
  eps: string;
  peRatio: string;
  dividend: string;
}

export default function Portfolio() {
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolio = async () => {
    try {
      const portfolioData = await AsyncStorage.getItem("portfolio");
      if (portfolioData) {
        setPortfolioCompanies(JSON.parse(portfolioData));
      } else {
        setPortfolioCompanies([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du portfolio:", error);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  }, []);

  const handleRemoveCompany = (symbol: string) => {
    Alert.alert(
      "Retirer du portfolio",
      `Êtes-vous sûr de vouloir retirer ${symbol} de votre portfolio ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedPortfolio = portfolioCompanies.filter(
                (company) => company.symbol !== symbol
              );
              await AsyncStorage.setItem("portfolio", JSON.stringify(updatedPortfolio));
              setPortfolioCompanies(updatedPortfolio);
            } catch (error) {
              console.error("Erreur lors de la suppression:", error);
              Alert.alert("Erreur", "Impossible de retirer l'entreprise du portfolio.");
            }
          },
        },
      ]
    );
  };

  const handleCompanyPress = (company: PortfolioCompany) => {
    router.push({
      pathname: "/company-profile",
      params: {
        symbol: company.symbol,
        name: company.name,
        price: company.price,
        change: company.change,
        logo: company.logo,
        location: company.location,
        website: company.website,
        about: company.about,
        marketCap: company.marketCap,
        shares: company.shares,
        revenue: company.revenue,
        eps: company.eps,
        peRatio: company.peRatio,
        dividend: company.dividend,
      },
    } as any);
  };

  const totalValue = portfolioCompanies.reduce((sum, company) => {
    const price = parseFloat(company.price.replace("$", "").replace(",", ""));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

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
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Valeur totale</Text>
          <Text style={styles.summaryValue}>${totalValue.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>
            {portfolioCompanies.length}{" "}
            {portfolioCompanies.length > 1 ? "entreprises" : "entreprise"}
          </Text>
        </View>

        {/* Portfolio Companies List */}
        {portfolioCompanies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="briefcase-outline" size={64} color="#666" />
            </View>
            <Text style={styles.emptyTitle}>Votre portfolio est vide</Text>
            <Text style={styles.emptyDescription}>
              Ajoutez des entreprises à votre portfolio depuis leur page de profil
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.exploreButtonText}>Explorer les marchés</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.companiesList}>
            {portfolioCompanies.map((company, index) => (
              <PortfolioCard
                key={`${company.symbol}-${index}`}
                company={company}
                onPress={() => handleCompanyPress(company)}
                onRemove={() => handleRemoveCompany(company.symbol)}
              />
            ))}
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant PortfolioCard
const PortfolioCard = ({
  company,
  onPress,
  onRemove,
}: {
  company: PortfolioCompany;
  onPress: () => void;
  onRemove: () => void;
}) => {
  const changeValue = parseFloat(company.change.replace("+", "").replace("%", ""));
  const isPositive = changeValue >= 0;

  return (
    <TouchableOpacity style={styles.portfolioCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.logoContainer}>
          {company.logo ? (
            <Image source={{ uri: company.logo }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="business" size={24} color="#8B5CF6" />
            </View>
          )}
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companySymbol}>{company.symbol}</Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Ionicons name="close-circle" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>${company.price}</Text>
        <View style={[styles.changeContainer, isPositive && styles.changePositive]}>
          <Ionicons
            name={isPositive ? "arrow-up" : "arrow-down"}
            size={14}
            color={isPositive ? "#4CD964" : "#FF3B30"}
          />
          <Text
            style={[
              styles.change,
              { color: isPositive ? "#4CD964" : "#FF3B30" },
            ]}
          >
            {isPositive ? "+" : ""}
            {company.change}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A9A9A9",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#A9A9A9",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Companies List
  companiesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  portfolioCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  companyInfo: {
    flex: 1,
  },
  companySymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 13,
    color: "#A9A9A9",
  },
  removeButton: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  changePositive: {
    backgroundColor: "rgba(76, 217, 100, 0.15)",
  },
  change: {
    fontSize: 14,
    fontWeight: "600",
  },

  bottomSpacer: {
    height: 40,
  },
});
