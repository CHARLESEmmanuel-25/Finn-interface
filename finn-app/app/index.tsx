import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoImage } from "../components/LogoImage";
import { fetchStocks, fetchSectors, formatPrice, formatMarketCap, formatShares, type Stock, type Sector } from "../services/api";

// const { width } = Dimensions.get('window'); // Utilisé dans les styles

export default function Index() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
    checkUserLoginStatus();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stocksData, sectorsData] = await Promise.all([
        fetchStocks(),
        fetchSectors(),
      ]);
      setStocks(stocksData);
      setSectors(sectorsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserLoginStatus = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem("isLoggedIn");
      const userInfo = await AsyncStorage.getItem("userData");

      if (loggedIn === "true" && userInfo) {
        setUserData(JSON.parse(userInfo));
        setIsLoggedIn(true);
      } else {
        // Rediriger vers LoginScreen si pas d'utilisateur connecté
        router.replace("/login");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du statut de connexion:",
        error
      );
      // Rediriger vers LoginScreen en cas d'erreur
      router.replace("/login");
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!hasSeenOnboarding) {
        // Première fois - rediriger vers l'onboarding
        router.replace("/onboarding" as any);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'onboarding:", error);
    }
  };

  const handleGoToOnboarding = () => {
    router.push("/onboarding" as any);
  };

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem("hasSeenOnboarding");
      router.replace("/onboarding" as any);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("isLoggedIn");
            await AsyncStorage.removeItem("userData");
            setUserData(null);
            setIsLoggedIn(false);
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
          }
        },
      },
    ]);
  };

  // Si pas d'utilisateur connecté, ne rien afficher (redirection en cours)
  if (!isLoggedIn || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Obtenir les grandes capitalisations (top 2 par marketCap)
  const largeCaps = stocks
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 2);

  // Obtenir les actions gagnantes (top 3 par percentVar positif)
  const winningStocks = stocks
    .filter(stock => stock.percentVar > 0)
    .sort((a, b) => b.percentVar - a.percentVar)
    .slice(0, 3);

  // Obtenir les secteurs principaux (top 4)
  const topSectors = sectors.slice(0, 4);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête avec avatar et barre de recherche */}
        <View style={styles.header}>
          {/* Avatar et nom de l'utilisateur */}
          <View style={styles.userHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => router.push("/profile" as any)}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                }}
                style={styles.avatar}
                // The corrected Image component should come from 'react-native'
                // If 'Image' is not imported from 'react-native', update the import elsewhere:
                // import { Image } from 'react-native';
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hello, welcome!</Text>
              <Text style={styles.userName}>{userData.fullName}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stocks, symbols, or companies..."
                placeholderTextColor="#666"
              />
            </View>
            {/* <TouchableOpacity
              style={styles.filterButton}
              onPress={() => router.push("/filter" as any)}
            >
              <Ionicons name="options-outline" size={20} color="#FFF" />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Section information (carrousel) */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="trending-up" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.infoDots}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>

        {/* Section Grandes capitalisation (Large Cap) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grandes capitalisation</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          ) : largeCaps.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune donnée disponible</Text>
            </View>
          ) : (
            <View style={styles.largeCapGrid}>
              {largeCaps.map((stock) => (
                <LargeCapCard
                  key={stock._id}
                  symbol={stock.symbol}
                  name={stock.shortName}
                  price={formatPrice(stock.currentPrice, stock.currency)}
                  logo={stock.logo}
                  onPress={() =>
                    router.push({
                      pathname: "/company-profile",
                      params: {
                        symbol: stock.symbol,
                        name: stock.shortName,
                        price: stock.currentPrice.toString(),
                        change: stock.percentVar.toString(),
                        logo: stock.logo || "",
                        location: stock.country,
                        website: stock.website,
                        about: stock.summary,
                        marketCap: formatMarketCap(stock.marketCap),
                        shares: formatShares(stock.sharesStats),
                        revenue: "N/A",
                        eps: stock.EPS?.toString() || "N/A",
                        peRatio: stock.PER?.toString() || "N/A",
                        dividend: stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : "0.00%",
                      },
                    } as any)
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Section Action gagnantes (Winning Stocks) */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action gagnantes</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          ) : winningStocks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune action gagnante disponible</Text>
            </View>
          ) : (
            <View style={styles.winningStocksList}>
              {winningStocks.map((stock) => (
                <WinningStockCard
                  key={stock._id}
                  symbol={stock.symbol}
                  name={stock.shortName}
                  price={formatPrice(stock.currentPrice, stock.currency)}
                  change={`${stock.percentVar >= 0 ? '+' : ''}${stock.percentVar.toFixed(2)}%`}
                  logo={stock.logo}
                  onPress={() =>
                    router.push({
                      pathname: "/company-profile",
                      params: {
                        symbol: stock.symbol,
                        name: stock.shortName,
                        price: stock.currentPrice.toString(),
                        change: stock.percentVar.toString(),
                        logo: stock.logo || "",
                        location: stock.country,
                        website: stock.website,
                        about: stock.summary,
                        marketCap: formatMarketCap(stock.marketCap),
                        shares: formatShares(stock.sharesStats),
                        revenue: "N/A",
                        eps: stock.EPS?.toString() || "N/A",
                        peRatio: stock.PER?.toString() || "N/A",
                        dividend: stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : "0.00%",
                      },
                    } as any)
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Section Secteurs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Secteurs</Text>
            <TouchableOpacity
              onPress={() => router.push("/market-sectors" as any)}
            >
              <Text style={styles.viewMoreText}>voir plus</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          ) : topSectors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun secteur disponible</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sectorsScroll}
            >
              {topSectors.map((sector) => (
                <SectorCard key={sector._id} name={sector.name} icon={sector.logo || "📊"} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Section Evenement à venir (Upcoming Events) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evenement à venir</Text>
          <View style={styles.eventsGrid}>
            <EventCard title="Q3 Earnings Call" date="15 Oct" />
            <EventCard title="Annual Meeting" date="20 Nov" />
          </View>
        </View>

        {/* Section actions françaises (French Stocks) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>actions françaises</Text>
            <TouchableOpacity onPress={() => router.push("/french-stocks")}>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.frenchStocksGrid}>
            <FrenchStockCard symbol="LVMH" name="LVMH" price="€685.20" />
            <FrenchStockCard symbol="ASML" name="ASML" price="€425.80" />
          </View>
        </View>

        {/* Section Actualités (News) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actualités</Text>
          <View style={styles.newsList}>
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

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Navigation en bas */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color="#8B5CF6" />
          <Text style={[styles.navText, styles.activeNavText]}>Markets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="compass-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/portfolio" as any)}
        >
          <Ionicons name="briefcase-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/profile" as any)}>
          <Ionicons name="person-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Composant pour les grandes capitalisations
const LargeCapCard = ({ symbol, name, price, logo, onPress }: any) => (
  <TouchableOpacity style={styles.largeCapCard} onPress={onPress}>
    <View style={styles.largeCapIconContainer}>
      <LogoImage logo={logo} symbol={symbol} name={name} size={48} />
    </View>
    <Text style={styles.largeCapSymbol}>{symbol}</Text>
    <Text style={styles.largeCapName}>{name}</Text>
    <Text style={styles.largeCapPrice}>{price}</Text>
    <View style={styles.largeCapDots}>
      <View style={styles.smallDot} />
      <View style={styles.smallDot} />
      <View style={styles.smallDot} />
    </View>
  </TouchableOpacity>
);

// Composant pour les actions gagnantes avec logo
// Composant pour les actions gagnantes avec logo - Design optimisé
const WinningStockCard = ({ symbol, name, price, change, logo, onPress }: any) => (
  <TouchableOpacity style={styles.winningStockCard} onPress={onPress}>
    <View style={styles.winningStockLogoContainer}>
      <LogoImage logo={logo} symbol={symbol} name={name} size={48} />
    </View>
    <View style={styles.winningStockContent}>
      <View style={styles.winningStockLeft}>
        <Text style={styles.winningStockSymbol}>{symbol}</Text>
        <Text style={styles.winningStockName}>{name}</Text>
      </View>
      <View style={styles.winningStockRight}>
        <Text style={styles.winningStockPrice}>{price}</Text>
        <View style={styles.changeContainer}>
          <Ionicons 
            name="arrow-up" 
            size={14} 
            color="#4CD964" 
            style={styles.changeIcon}
          />
          <Text style={styles.winningStockChange}>{change}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// Composant pour les secteurs
const SectorCard = ({ name, icon }: any) => (
  <View style={styles.sectorCard}>
    <View style={styles.sectorIcon}>
      <Text style={styles.sectorEmoji}>{icon}</Text>
    </View>
    <Text style={styles.sectorName}>{name}</Text>
  </View>
);

// Composant pour les événements
const EventCard = ({ title, date }: any) => (
  <View style={styles.eventCard}>
    <View style={styles.eventIcon}>
      <Ionicons name="calendar" size={20} color="#8B5CF6" />
    </View>
    <Text style={styles.eventTitle}>{title}</Text>
    <Text style={styles.eventDate}>{date}</Text>
  </View>
);

// Composant pour les actions françaises
const FrenchStockCard = ({ symbol, name, price }: any) => (
  <View style={styles.frenchStockCard}>
    <View style={styles.frenchStockIcon}>
      <Text style={styles.frenchFlag}>🇫🇷</Text>
    </View>
    <Text style={styles.frenchStockSymbol}>{symbol}</Text>
    <Text style={styles.frenchStockName}>{name}</Text>
    <Text style={styles.frenchStockPrice}>{price}</Text>
  </View>
);

// Composant pour les actualités en liste
const NewsListItem = ({ title, source }: any) => (
  <View style={styles.newsListItem}>
    <View style={styles.newsListIcon}>
      <Ionicons name="newspaper" size={16} color="#8B5CF6" />
    </View>
    <View style={styles.newsListContent}>
      <Text style={styles.newsListTitle}>{title}</Text>
      <Text style={styles.newsListSource}>{source}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#FFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#A9A9A9",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  resetButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },

  // Interface principale
  scrollView: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    width: "100%",
  },

  // En-tête utilisateur
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 2,
  },
  userName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8B5CF6",
  },

  // Barre de recherche
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 12,
  },

  // Section information (carrousel)
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  infoIcon: {
    marginBottom: 16,
  },
  infoDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  activeDot: {
    backgroundColor: "#8B5CF6",
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  arrow: {
    fontSize: 18,
    color: "#8B5CF6",
  },

  // Grandes capitalisations
  largeCapIconContainer: {
    marginBottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  largeCapLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  // Modifiez largeCapCard pour ajouter l'effet de pression
  largeCapCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    // Ajoutez ces propriétés pour un meilleur effet visuel
    borderWidth: 1,
    borderColor: "transparent",
  },
  largeCapGrid: {
    flexDirection: "row",
    gap: 16,
  },
  largeCapIcon: {
    marginBottom: 12,
  },
  largeCapSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  largeCapName: {
    fontSize: 12,
    color: "#A9A9A9",
    marginBottom: 8,
    textAlign: "center",
  },
  largeCapPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CD964",
    marginBottom: 12,
  },
  largeCapDots: {
    flexDirection: "row",
    gap: 4,
  },
  smallDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
  },

  // Actions gagnantes
  // Actions gagnantes - Styles optimisés
winningStocksList: {
  gap: 12,
},
winningStockCard: {
  backgroundColor: '#1A1A1A',
  borderRadius: 12,
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'transparent',
},
winningStockLogoContainer: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#2A2A2A',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  overflow: 'hidden',
},
winningStockLogo: {
  width: 48,
  height: 48,
  borderRadius: 24,
},
winningStockIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(76, 217, 100, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
},
winningStockContent: {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
winningStockLeft: {
  flex: 1,
},
winningStockRight: {
  alignItems: 'flex-end',
},
winningStockSymbol: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#FFF',
  marginBottom: 4,
},
winningStockName: {
  fontSize: 13,
  color: '#A9A9A9',
},
winningStockPrice: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFF',
  marginBottom: 4,
},
changeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(76, 217, 100, 0.15)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},
changeIcon: {
  marginRight: 2,
},
winningStockChange: {
  fontSize: 13,
  fontWeight: '600',
  color: '#4CD964',
},

  // Secteurs
  sectorsScroll: {
    paddingLeft: 0,
  },
  sectorCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 16,
    minWidth: 80,
  },
  sectorIcon: {
    marginBottom: 8,
  },
  sectorEmoji: {
    fontSize: 24,
  },
  sectorName: {
    fontSize: 12,
    color: "#FFF",
    textAlign: "center",
  },

  // Événements
  eventsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  eventCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  eventIcon: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: "#A9A9A9",
  },

  // Actions françaises
  frenchStocksGrid: {
    flexDirection: "row",
    gap: 16,
  },
  frenchStockCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  frenchStockIcon: {
    marginBottom: 12,
  },
  frenchFlag: {
    fontSize: 24,
  },
  frenchStockSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  frenchStockName: {
    fontSize: 12,
    color: "#A9A9A9",
    marginBottom: 8,
    textAlign: "center",
  },
  frenchStockPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CD964",
  },

  // Actualités en liste
  newsList: {
    gap: 12,
  },
  newsListItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  newsListIcon: {
    marginRight: 16,
  },
  newsListContent: {
    flex: 1,
  },
  newsListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
    lineHeight: 18,
  },
  newsListSource: {
    fontSize: 12,
    color: "#A9A9A9",
  },

  // Navigation en bas
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    justifyContent: "space-around",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: "#A9A9A9",
    marginTop: 4,
  },
  activeNavText: {
    color: "#8B5CF6",
  },
  bottomSpacer: {
    height: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#A9A9A9',
    fontSize: 14,
  },
});
