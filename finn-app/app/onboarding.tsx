import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const {height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const handleGetStarted = async () => {
    try {
      // Marquer l'onboarding comme terminé
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      // Navigation vers l'écran principal
      router.replace("/");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      router.replace("/");
    }
  };

  const handleLogin = () => {
    // Navigation vers l'écran de connexion
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" /> 
      
      {/* 1. Zone de l'illustration (prend environ 50% de l'écran) */}
      <View style={styles.illustrationContainer}>
        {/* L'image réelle que vous avez besoin d'importer */}
        {/* J'ai utilisé l'URL de l'image que vous avez fournie comme source pour cet exemple, 
           mais vous DEVEZ la remplacer par require('./chemin/vers/votre/image.png') */}
        <Image 
          source={require('../assets/images/onboarding.png')} 
          style={styles.illustration} 
          resizeMode="contain" 
        />
      </View>

      {/* 2. Contenu Texte et Boutons */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Stay Ahead of the Market
        </Text>

        <Text style={styles.subtitle}>
          Track stocks, set alerts, follow trends, and make smarter financial decisions — all in one place.
        </Text>
        
        {/* Indicateurs de page (les deux petits points) */}
        <View style={styles.dotContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        {/* Bouton "Get Started" (Principal) */}
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleGetStarted}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Bouton "Login" (Secondaire) */}
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleLogin}
        >
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fond noir
        paddingHorizontal: 16,
        paddingTop: 16,
      },
      
      // 1. Illustration
      illustrationContainer: {
        // Prend environ 50% de l'écran pour l'image
        height: height * 0.4, 
        justifyContent: 'center',
        alignItems: 'center',
        // Le dégradé sombre peut être réalisé avec un composant LinearGradient d'Expo, 
        // mais on le simplifie ici.
      },
      illustration: {
        width: '100%', // S'étale sur toute la largeur
        height: '100%', // S'étale sur toute la hauteur de son conteneur
      },
       // 2. Contenu Texte et Boutons
  contentContainer: {
    flex: 1, // Prend le reste de l'espace
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 15,
    // Pour un look plus fin, vous auriez besoin d'une police comme 'Poppins-SemiBold'
  },
  subtitle: {
    fontSize: 16,
    color: '#A9A9A9', // Gris clair pour le texte secondaire
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  
  // Indicateurs de page
  dotContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3A',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#936AFE', // La couleur violette de l'app
    width: 32,
    height: 8,
  },

  // Boutons
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  // Bouton Principal (Get Started)
  primaryButton: {
    backgroundColor: '#936AFE', // Violet principal
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Bouton Secondaire (Login)
  secondaryButton: {
    backgroundColor: 'transparent', // Transparent, juste pour l'espace et la bordure invisible
    // Si vous voulez une bordure légère comme le design original:
    borderWidth: 1,
    borderColor: '#936AFE', 
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  textSection: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    alignItems: "center",
  },
  headline: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    gap: 8,
  },
  getStartedButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#8B5CF6",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  getStartedText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  loginButton: {
    width: "100%",
    height: 56,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
