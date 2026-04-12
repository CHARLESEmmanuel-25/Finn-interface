import React, { useEffect, useState, useRef } from "react"
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
  Modal,
} from "react-native"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { fetchSectors, fetchBigCaps, fetchTopGainers, formatPrice, formatMarketCap, formatShares, type Stock, type Sector } from "../services/api"
import { WinningStockCard } from "@/components/stocks/winning-stock-card"
import { SectorsSection } from "@/components/home/sectors-section"
import { EventsSection } from "@/components/home/events-section"
import { FrenchStocksSection } from "@/components/home/french-stocks-section"
import { NewsSection } from "@/components/home/news-section"
import { WinningStocksSection } from "@/components/home/winning-stocks-section"
import { LargeCapSection } from "@/components/home/large-cap-section"
import { PortfolioCard } from "@/components/home/portfolio-card"
import { ForumSection } from "@/components/home/forum-section"

// Nouvelle fonction utilitaire pour faire la recherche via l'API
async function searchStocksApi(query: string): Promise<Stock[]> {
  if (!query.trim()) return []
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL || ""}/stocks/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    )

    if (!response.ok) throw new Error("API error")
    const results = await response.json()

    return Array.isArray(results.data) ? results.data : []
  } catch (e) {
    console.error("Erreur lors de la recherche d'actions :", e)
    return []
  }
}

// const { width } = Dimensions.get('window'); // Utilisé dans les styles

export default function Index() {
  const [userData, setUserData] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [bigCaps, setBigCaps] = useState<Stock[]>([])
  const [topGainers, setTopGainers] = useState<Stock[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Stock[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // -- Modal search state fixes --
  const [showSearchModal, setShowSearchModal] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
    checkUserLoginStatus()
    loadData()
  }, [])

  // Gestion du debounce et de la requête API recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current as any)
    }
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    // Use window.setTimeout to ensure we get a number for React Native env
    searchTimeoutRef.current = setTimeout(() => {
      (async () => {
        try {
          const results = await searchStocksApi(searchQuery.trim())
          console.log(results)
          setSearchResults(results.slice(0, 10))
        } catch {
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      })()
    }, 350) as any // debounce de 350ms
    // Clean-up
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current as any)
    }
  }, [searchQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const sectorsData = await fetchSectors()
      setSectors(sectorsData)

      const [bigCapsRes, gainersRes] = await Promise.allSettled([
        fetchBigCaps(),
        fetchTopGainers(5),
      ])
      if (bigCapsRes.status === 'fulfilled') setBigCaps(bigCapsRes.value)
      if (gainersRes.status === 'fulfilled') setTopGainers(gainersRes.value)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      Alert.alert('Erreur', 'Impossible de charger les données. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const checkUserLoginStatus = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem("isLoggedIn")
      const userInfo = await AsyncStorage.getItem("userData")

      if (loggedIn === "true" && userInfo) {
        setUserData(JSON.parse(userInfo))
        setIsLoggedIn(true)
      } else {
        // Rediriger vers LoginScreen si pas d'utilisateur connecté
        router.replace("/login")
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du statut de connexion:",
        error
      )
      // Rediriger vers LoginScreen en cas d'erreur
      router.replace("/login")
    }
  }

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding")
      if (!hasSeenOnboarding) {
        // Première fois - rediriger vers l'onboarding
        router.replace("/onboarding" as any)
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'onboarding:", error)
    }
  }

  // const handleGoToOnboarding = () => {
  //   router.push("/onboarding" as any);
  // };

  // const handleResetOnboarding = async () => {
  //   try {
  //     await AsyncStorage.removeItem("hasSeenOnboarding");
  //     router.replace("/onboarding" as any);
  //   } catch (error) {
  //     console.error("Erreur lors de la réinitialisation:", error);
  //   }
  // };

  // const handleLogout = () => {
  //   Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
  //     { text: "Annuler", style: "cancel" },
  //     {
  //       text: "Déconnexion",
  //       style: "destructive",
  //       onPress: async () => {
  //         try {
  //           await AsyncStorage.removeItem("isLoggedIn");
  //           await AsyncStorage.removeItem("userData");
  //           setUserData(null);
  //           setIsLoggedIn(false);
  //         } catch (error) {
  //           console.error("Erreur lors de la déconnexion:", error);
  //         }
  //       },
  //     },
  //   ]);
  // };

  // Actions françaises (aperçu pour l'écran d'accueil)
  const frenchStocksPreview = [
    {
      symbol: "MC",
      name: "LVMH",
      price: "532,80 €",
      logo: "https://logo.clearbit.com/lvmh.com",
    },
    {
      symbol: "OR",
      name: "L'Oréal",
      price: "368,50 €",
      logo: "https://logo.clearbit.com/loreal.com",
    },
    {
      symbol: "AIR",
      name: "Airbus",
      price: "140,20 €",
      logo: "https://logo.clearbit.com/airbus.com",
    },
    {
      symbol: "RMS",
      name: "Hermès",
      price: "2 026,00 €",
      logo: "https://logo.clearbit.com/hermes.com",
    },
  ]

  // Si pas d'utilisateur connecté, ne rien afficher (redirection en cours)
  if (!isLoggedIn || !userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

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

          {/* Barre de recherche améliorée avec affichage plein écran des résultats dans un Modal */}
          <View style={styles.searchSection}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.searchBar}
              onPress={() => setShowSearchModal(true)}
            >
              <Ionicons name="search" size={20} color="#666" />
              <Text style={[styles.searchInput, { color: searchQuery ? "#000" : "#666" }]}>
                {searchQuery || "Search stocks, symbols, or companies..."}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal plein écran pour la recherche et les résultats */}
          <Modal
            animationType="slide"
            transparent={false}
            visible={showSearchModal}
            onRequestClose={() => setShowSearchModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search stocks, symbols, or companies..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoFocus
                  underlineColorAndroid="transparent"

                  clearButtonMode="while-editing"
                  selectionColor="#8B5CF6"
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color="#bbb" />
                  </TouchableOpacity>
                )}
              </View>
              {/* Résultats de recherche plein écran */}
              <View style={styles.modalResultsSection}>
                {searchQuery.trim().length > 0 ? (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        Résultats pour &quot;{searchQuery.trim()}&quot;
                      </Text>
                    </View>
                    {searchLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8B5CF6" />
                      </View>
                    ) : searchResults.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          Aucune action ne correspond à votre recherche
                        </Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.winningStocksList}>
                        {searchResults.map((stock) => (
                          <WinningStockCard
                            key={`search-${stock._id ? stock._id : stock.symbol}`}
                            symbol={stock.symbol}
                            name={stock.shortName || stock.symbol}
                            price={formatPrice(stock.currentPrice, stock.currency)}
                            percentVar={stock.percentVar}
                            logo={stock.logo ?? undefined}
                            onPress={() => {
                              setShowSearchModal(false)
                              router.push({
                                pathname: "/company-profile",
                                params: {
                                  symbol: stock.symbol,
                                  name: stock.shortName || stock.symbol,
                                  price: stock.currentPrice?.toString() ?? "N/A",
                                  change: stock.percentVar?.toString() ?? "N/A",
                                  logo: stock.logo || "",
                                  location: stock.country ?? "",
                                  website: stock.website ?? "",
                                  about: stock.summary ?? "",
                                  marketCap: formatMarketCap(stock.marketCap, stock.currency),
                                  shares: formatShares(stock.sharesStats),
                                  revenue: "N/A",
                                  eps: stock.EPS?.toString() || "N/A",
                                  peRatio: stock.PER?.toString() || "N/A",
                                  dividend: stock.dividendYield
                                    ? `${(stock.dividendYield * 100).toFixed(2)}%`
                                    : "0.00%",
                                  currency: stock.currency,
                                },
                              } as any)
                            }}
                          />
                        ))}
                      </ScrollView>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Commencez à taper pour rechercher</Text>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </Modal>
        </View>


        {/* Section information (carrousel) */}
        {/* <View style={styles.infoSection}>
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
        </View> */}
        <PortfolioCard
          totalValue={24830}
          dailyChange={367}
          dailyChangePct={1.5}
        />

        {/* Section Grandes capitalisation (Large Cap) */}
        <LargeCapSection
          stocks={bigCaps}
          loading={loading}
          // onPressMore={() => router.push('/financial-data' as any)}
        />

        {/* Section Action gagnantes (Winning Stocks) */}
        <WinningStocksSection
          stocks={topGainers}
          loading={loading}
        />

        {/* Section Secteurs */}
        <SectorsSection
          sectors={sectors}
          onPressMore={() => router.push("/market-sectors")}
        />

        {/* Section Evenement à venir (Upcoming Events) */}
        <EventsSection />

        {/* Section actions françaises (French Stocks) */}
        <FrenchStocksSection
          stocks={frenchStocksPreview}
          onPressMore={() => router.push("/french-stocks")}
        />

        <View style={{ padding: 20 }}>
          <ForumSection />
        </View>

        {/* Section Actualités (News) */}
        <NewsSection />

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Navigation en bas */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color="#8B5CF6" />
          <Text style={[styles.navText, styles.activeNavText]}>Markets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/portfolio" as any)}
        >
          <Ionicons name="briefcase-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/forum" as any)}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Forum</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/profile" as any)}>
          <Ionicons name="person-outline" size={24} color="#FFF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
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
    backgroundColor: "#0A0A0F",
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
  // Modal-specific styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    paddingTop: 16,
    paddingHorizontal: 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#0A0A0F",
  },
  modalSearchInput: {
    flex: 1,
    color: "#F1F1F1",
    fontSize: 16,
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  modalResultsSection: {
    flex: 1,
    gap: 4,
    backgroundColor: "#0A0A0F",
    padding: 16
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  winningStocksList: {
    flex: 1,
  },
})
