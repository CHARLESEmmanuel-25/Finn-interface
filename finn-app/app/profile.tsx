import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userData');
      if (userInfo) {
        setUserData(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('isLoggedIn');
              await AsyncStorage.removeItem('userData');
              router.replace('/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Informations utilisateur */}
        <View style={styles.userSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userData.fullName}</Text>
          <Text style={styles.profileType}>Individual Investor</Text>
        </View>

        {/* Tracked Stocks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracked Stocks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trackedStocksScroll}>
            <TrackedStockCard symbol="AAPL" name="Apple" price="$191.12" />
            <TrackedStockCard symbol="GOOGL" name="Google" price="$142.50" />
            <TrackedStockCard symbol="AMZN" name="Amazon" price="$139.83" />
          </ScrollView>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          <View style={styles.settingsList}>
            <SettingsItem 
              icon="person-outline" 
              title="Personal Information" 
              onPress={() => console.log('Personal Information')} 
            />
            <SettingsItem 
              icon="shield-checkmark-outline" 
              title="Security" 
              onPress={() => console.log('Security')} 
            />
            <SettingsItem 
              icon="language-outline" 
              title="Language" 
              value="English" 
              onPress={() => console.log('Language')} 
            />
            <SettingsItem 
              icon="location-outline" 
              title="Location" 
              value="Pakistan" 
              onPress={() => console.log('Location')} 
            />
            <SettingsItem 
              icon="notifications-outline" 
              title="Notifications" 
              value="On" 
              onPress={() => console.log('Notifications')} 
            />
            <SettingsItem 
              icon="alert-circle-outline" 
              title="My Alerts" 
              onPress={() => console.log('My Alerts')} 
            />
            <SettingsItem 
              icon="moon-outline" 
              title="Theme" 
              value="Dark" 
              onPress={() => console.log('Theme')} 
            />
            <SettingsItem 
              icon="help-circle-outline" 
              title="Help & Support" 
              onPress={() => console.log('Help & Support')} 
            />
            <SettingsItem 
              icon="log-out-outline" 
              title="Logout" 
              onPress={handleLogout}
              isDestructive={true}
            />
          </View>
        </View>

        {/* Espace pour la navigation en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour les stocks suivis
const TrackedStockCard = ({ symbol, name, price }: any) => (
  <View style={styles.trackedStockCard}>
    <View style={styles.stockIcon}>
      <Text style={styles.stockSymbol}>{symbol}</Text>
    </View>
    <Text style={styles.stockName}>{name}</Text>
    <Text style={styles.stockPrice}>{price}</Text>
  </View>
);

// Composant pour les éléments de paramètres
const SettingsItem = ({ icon, title, value, onPress, isDestructive = false }: any) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemLeft}>
      <Ionicons 
        name={icon} 
        size={20} 
        color={isDestructive ? "#FF3B30" : "#8B5CF6"} 
      />
      <Text style={[styles.settingsItemTitle, isDestructive && styles.destructiveText]}>
        {title}
      </Text>
    </View>
    <View style={styles.settingsItemRight}>
      {value && (
        <Text style={[styles.settingsItemValue, isDestructive && styles.destructiveText]}>
          {value}
        </Text>
      )}
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color="#666" 
      />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  
  // Section utilisateur
  userSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  profileName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileType: {
    color: '#A9A9A9',
    fontSize: 16,
  },
  
  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Stocks suivis
  trackedStocksScroll: {
    paddingLeft: 0,
  },
  trackedStockCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 100,
  },
  stockIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#8B5CF620',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockSymbol: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stockPrice: {
    color: '#4CD964',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Paramètres
  settingsList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemTitle: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemValue: {
    color: '#A9A9A9',
    fontSize: 14,
    marginRight: 8,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 100,
  },
});
