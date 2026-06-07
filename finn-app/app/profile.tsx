import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUser, User } from '@/services/api';

const PURPLE = '#8B5CF6';
const RED = '#EF4444';

function InitialsAvatar({ name, size = 100 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <View style={[avatarStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[avatarStyles.text, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    backgroundColor: 'rgba(139,92,246,0.25)',
    borderWidth: 2,
    borderColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#FFF', fontWeight: '700' },
});

export default function ProfileScreen() {
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const load = useCallback(async () => {
    try {
      const [[, userJson], [, userId], [, notifVal]] = await AsyncStorage.multiGet([
        'userData',
        'userId',
        'notificationsEnabled',
      ]);
      if (notifVal !== null) setNotificationsOn(notifVal === 'true');
      // Fallback immédiat depuis AsyncStorage
      if (userJson) {
        const parsed = JSON.parse(userJson);
        setLocalName(parsed.fullName ?? `${parsed.firstName ?? ''} ${parsed.lastName ?? ''}`.trim());
        setLocalEmail(parsed.email ?? '');
      }
      // Enrichissement via API
      if (userId) {
        fetchUser(userId).then(setApiUser).catch(() => {});
      }
    } catch {
      // silently continue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleNotifications = async (val: boolean) => {
    setNotificationsOn(val);
    await AsyncStorage.setItem('notificationsEnabled', String(val));
  };

  const handlePersonalInfo = () => {
    const joinDate = apiUser?.createdAt
      ? `\nCompte créé le : ${new Date(apiUser.createdAt).toLocaleDateString('fr-FR')}`
      : '';
    Alert.alert(
      'Informations personnelles',
      `Nom : ${displayName}\nEmail : ${displayEmail}${joinDate}`,
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Aide & Support',
      'Pour toute question, contactez-nous à support@finn-app.com\n\nVersion 1.0.0',
      [{ text: 'OK' }]
    );
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
            await AsyncStorage.multiRemove(['isLoggedIn', 'userData', 'userId']);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const displayName = apiUser
    ? `${apiUser.firstName} ${apiUser.lastName}`.trim()
    : localName || 'Utilisateur';
  const displayEmail = apiUser?.email ?? localEmail;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.userSection}>
            <InitialsAvatar name={displayName} size={96} />
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paramètres</Text>
            <View style={styles.settingsList}>
              <SettingsItem
                icon="person-outline"
                title="Informations personnelles"
                onPress={handlePersonalInfo}
              />
              <SettingsRow
                icon="notifications-outline"
                title="Notifications"
                right={
                  <Switch
                    value={notificationsOn}
                    onValueChange={toggleNotifications}
                    trackColor={{ false: '#2A2A2A', true: 'rgba(139,92,246,0.5)' }}
                    thumbColor={notificationsOn ? PURPLE : '#666'}
                  />
                }
              />
              <SettingsItem
                icon="help-circle-outline"
                title="Aide & Support"
                onPress={handleHelp}
              />
              <SettingsItem
                icon="log-out-outline"
                title="Déconnexion"
                onPress={handleLogout}
                isDestructive
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  title,
  value,
  onPress,
  isDestructive = false,
}: {
  icon: string;
  title: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsLeft}>
        <Ionicons name={icon as any} size={20} color={isDestructive ? RED : PURPLE} />
        <Text style={[styles.settingsTitle, isDestructive && { color: RED }]}>{title}</Text>
      </View>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
      </View>
    </TouchableOpacity>
  );
}

function SettingsRow({
  icon,
  title,
  right,
}: {
  icon: string;
  title: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingsItem}>
      <View style={styles.settingsLeft}>
        <Ionicons name={icon as any} size={20} color={PURPLE} />
        <Text style={styles.settingsTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  placeholder: { width: 40 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scrollView: { flex: 1 },

  userSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  profileName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },

  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  settingsList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsTitle: { color: '#FFF', fontSize: 15 },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsValue: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },

  bottomSpacer: { height: 60 },
});
