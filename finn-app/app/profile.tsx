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
import { fetchUser, fetchFavorites, User, Stock } from '@/services/api';

const PURPLE = '#8B5CF6';
const GREEN = '#22C55E';
const RED = '#EF4444';

function InitialsAvatar({ name, size = 72 }: { name: string; size?: number }) {
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
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderWidth: 2.5,
    borderColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#FFF', fontWeight: '700' },
});

const HIGHLIGHTS = [
  { id: 'new',    label: 'Nouveau',    icon: 'add' as const,                  bg: 'rgba(255,255,255,0.08)', iconColor: '#FFF' },
  { id: 'theses', label: 'Mes thèses', icon: 'bar-chart' as const,            bg: '#0D2B3E',               iconColor: '#4EC9F8' },
  { id: 'gains',  label: 'Gains 2026', icon: 'trophy' as const,               bg: '#2B1A00',               iconColor: '#F6A623' },
  { id: 'qa',     label: 'Q&A',        icon: 'chatbubble-ellipses' as const,   bg: '#1A2B1A',               iconColor: '#A8D5A2' },
];

const MOCK_POSTS = [
  { id: '1', tag: 'ANALYSE',   tagColor: '#3B82F6', text: "AAPL franchit les 280$ aujourd'hui...", likes: 12, comments: 3  },
  { id: '2', tag: 'QUESTION',  tagColor: '#8B5CF6', text: "Quelqu'un suit les small caps tech ?",  likes: 0,  comments: 3  },
  { id: '3', tag: 'ACTUALITÉ', tagColor: '#22C55E', text: 'Inflation US en baisse, impact Fed ?',  likes: 31, comments: 18 },
];

const MOCK_STATS = { posts: 12, abonnes: 248, abonnements: 93 };

type ProfileTab = 'grid' | 'card' | 'chart' | 'bookmark';

export default function ProfileScreen() {
  const [apiUser, setApiUser]             = useState<User | null>(null);
  const [localName, setLocalName]         = useState('');
  const [localEmail, setLocalEmail]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [favorites, setFavorites]         = useState<Stock[]>([]);
  const [watchlistVisible, setWatchlistVisible] = useState(true);
  const [activeTab, setActiveTab]         = useState<ProfileTab>('grid');
  const [userId, setUserId]               = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [[, userJson], [, uid], [, notifVal]] = await AsyncStorage.multiGet([
        'userData', 'userId', 'notificationsEnabled',
      ]);
      if (notifVal !== null) setNotificationsOn(notifVal === 'true');
      let parsed: any = null;
      if (userJson) {
        parsed = JSON.parse(userJson);
        setLocalName(parsed.fullName ?? `${parsed.firstName ?? ''} ${parsed.lastName ?? ''}`.trim());
        setLocalEmail(parsed.email ?? '');
      }
      const cleanId =
        (uid && uid !== 'undefined') ? uid :
        (parsed?.userId && parsed.userId !== 'undefined') ? parsed.userId : null;
      setUserId(cleanId);
      if (cleanId) {
        fetchUser(cleanId).then(setApiUser).catch(() => {});
        fetchFavorites(cleanId).then(setFavorites).catch(() => {});
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

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['isLoggedIn', 'userData', 'userId']);
          router.replace('/login');
        },
      },
    ]);
  };

  const displayName = apiUser
    ? `${apiUser.firstName} ${apiUser.lastName}`.trim()
    : localName || 'Utilisateur';
  const displayEmail = apiUser?.email ?? localEmail;

  const handle = '@' + displayName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 14);

  const watchlistData = favorites.length > 0 ? favorites.slice(0, 5) : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.topIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topIcon}
            onPress={() =>
              Alert.alert('Paramètres', '', [
                { text: 'Notifications : ' + (notificationsOn ? 'activées' : 'désactivées'),
                  onPress: () => toggleNotifications(!notificationsOn) },
                { text: 'Aide & Support',
                  onPress: () => Alert.alert('Support', 'support@finn-app.com') },
                { text: 'Déconnexion', style: 'destructive', onPress: handleLogout },
                { text: 'Annuler', style: 'cancel' },
              ])
            }
          >
            <Ionicons name="menu" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.profileLeft}>
            {/* Name */}
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.handleText}>{handle}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: 'Posts',         value: MOCK_STATS.posts },
                { label: 'Abonnés',       value: MOCK_STATS.abonnes },
                { label: 'Abonnements',   value: MOCK_STATS.abonnements },
              ].map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <InitialsAvatar name={displayName} size={72} />
            <View style={styles.avatarPlusBtn}>
              <Ionicons name="add" size={12} color="#FFF" />
            </View>
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>
            Passionné des marchés financiers · Analyse & stratégie · Je partage mes thèses, pas des conseils.
          </Text>
          <View style={styles.badgeRow}>
            <Ionicons name="star" size={13} color={PURPLE} />
            <Text style={styles.badgeText}>Investisseur débutant</Text>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnPrimary} activeOpacity={0.75}>
            <Text style={styles.actionBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnSecondary} activeOpacity={0.75}>
            <Text style={styles.actionBtnText}>Partager le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.75}>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* ── Highlights ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.highlightsScroll}
          contentContainerStyle={styles.highlightsContent}
        >
          {HIGHLIGHTS.map((h) => (
            <TouchableOpacity key={h.id} style={styles.highlightItem} activeOpacity={0.75}>
              <View style={[styles.highlightCircle, { backgroundColor: h.bg }]}>
                <Ionicons name={h.icon} size={22} color={h.iconColor} />
              </View>
              <Text style={styles.highlightLabel}>{h.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Content tabs ── */}
        <View style={styles.tabBar}>
          {([
            { key: 'grid',     icon: 'grid-outline' },
            { key: 'card',     icon: 'albums-outline' },
            { key: 'chart',    icon: 'bar-chart-outline' },
            { key: 'bookmark', icon: 'bookmark-outline' },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={t.icon}
                size={22}
                color={activeTab === t.key ? '#FFF' : 'rgba(255,255,255,0.3)'}
              />
              {activeTab === t.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Watchlist publique ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Watchlist publique</Text>
            <View style={styles.visibleRow}>
              <Text style={styles.visibleLabel}>Visible</Text>
              <Switch
                value={watchlistVisible}
                onValueChange={setWatchlistVisible}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: PURPLE }}
                thumbColor="#FFF"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>

          {watchlistData.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.watchlistRow}>
                {watchlistData.map((stock) => {
                  const pct = stock.percentVar ?? 0;
                  const isPos = pct >= 0;
                  return (
                    <TouchableOpacity
                      key={stock._id}
                      style={styles.watchCard}
                      onPress={() =>
                        router.push({
                          pathname: '/company-profile',
                          params: {
                            stockId: stock._id,
                            symbol: stock.symbol,
                            name: stock.shortName,
                            price: String(stock.currentPrice),
                            change: String(pct.toFixed(2)),
                            currency: stock.currency,
                          },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.watchCardIcon}>
                        <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.3)" />
                      </View>
                      <Text style={styles.watchSymbol}>{stock.symbol}</Text>
                      <Text style={[styles.watchPct, { color: isPos ? GREEN : RED }]}>
                        {isPos ? '+' : ''}{pct.toFixed(2)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.watchlistEmpty}>
              <Ionicons name="star-outline" size={28} color="rgba(255,255,255,0.2)" />
              <Text style={styles.watchlistEmptyText}>Aucun favori pour l'instant</Text>
            </View>
          )}
        </View>

        {/* ── Posts ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.postsGrid}>
            {MOCK_POSTS.map((post) => (
              <TouchableOpacity key={post.id} style={styles.postCard} activeOpacity={0.8}>
                <View style={[styles.postTag, { backgroundColor: post.tagColor + '22', borderColor: post.tagColor + '44' }]}>
                  <Text style={[styles.postTagText, { color: post.tagColor }]}>{post.tag}</Text>
                </View>
                <Text style={styles.postText} numberOfLines={2}>{post.text}</Text>
                <View style={styles.postFooter}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={12} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.postStatText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={12} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.postStatText}>{post.comments}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:    { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  topLeft:  { flexDirection: 'row', alignItems: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  topIcon:  { padding: 8 },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  profileLeft: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PURPLE,
    marginTop: 2,
  },
  handleText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  statsRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  statItem: { alignItems: 'flex-start' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  avatarWrap: { position: 'relative', marginLeft: 16 },
  avatarPlusBtn: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0F',
  },

  // Bio
  bioSection: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  bioText: { fontSize: 13.5, color: '#FFF', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  badgeText: {
    fontSize: 13, color: PURPLE, fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  actionIconBtn: {
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Highlights
  highlightsScroll:   { marginBottom: 8 },
  highlightsContent:  { paddingHorizontal: 20, gap: 14 },
  highlightItem: { alignItems: 'center', gap: 6 },
  highlightCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  highlightLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  // Content tabs
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 8,
    marginBottom: 0,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    position: 'relative',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0, left: '20%', right: '20%',
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },

  // Sections
  sectionBlock: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  visibleRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  visibleLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  // Watchlist
  watchlistRow: { flexDirection: 'row', gap: 10 },
  watchCard: {
    width: 84,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  watchCardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchSymbol: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  watchPct:    { fontSize: 12, fontWeight: '600' },

  watchlistEmpty: {
    alignItems: 'center', paddingVertical: 28, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  watchlistEmptyText: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },

  // Posts grid
  postsGrid: { flexDirection: 'row', gap: 8 },
  postCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    gap: 8,
    minHeight: 100,
  },
  postTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  postTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  postText: { fontSize: 12, color: '#FFF', lineHeight: 17, flex: 1 },
  postFooter: { flexDirection: 'row', gap: 8, marginTop: 4 },
  postStat:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  postStatText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
