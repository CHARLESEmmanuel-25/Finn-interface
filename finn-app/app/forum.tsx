import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getForumPosts,
  createForumPost,
  toggleLike,
  addComment,
  type ForumPost,
  type ForumCategory,
} from "../services/forum";

const PURPLE = "#8B5CF6";
const GREEN  = "#22C55E";
const RED    = "#EF4444";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const words = name.trim().split(" ");
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function avatarBg(name: string): string {
  const palette = ["#1B4F72", "#1A5276", "#4A235A", "#145A32", "#7B241C", "#1F618D"];
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
  return palette[idx];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(dateStr);
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: {
  key: ForumCategory;
  label: string;
  sub: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconColor: string;
}[] = [
  { key: "analyses",   label: "Analyses",            sub: "études et avis sur des actions", count: 126, icon: "bar-chart",              iconBg: "rgba(139,92,246,0.2)",  iconColor: PURPLE },
  { key: "debutants",  label: "Questions débutants",  sub: "pour bien démarrer en bourse",  count: 94,  icon: "time-outline",            iconBg: "rgba(6,182,212,0.2)",   iconColor: "#06B6D4" },
  { key: "actualites", label: "Actualités marché",    sub: "macro, taux, événements",       count: 76,  icon: "warning-outline",         iconBg: "rgba(239,68,68,0.2)",   iconColor: RED },
  { key: "general",    label: "Discussion générale",  sub: "tout le reste",                 count: 52,  icon: "chatbubble-ellipses-outline", iconBg: "rgba(34,197,94,0.2)", iconColor: GREEN },
];

const CATEGORY_TAG: Record<ForumCategory, { label: string; color: string }> = {
  analyses:   { label: "Analyse",   color: PURPLE },
  debutants:  { label: "Débutants", color: "#F59E0B" },
  actualites: { label: "Actualité", color: GREEN },
  general:    { label: "Général",   color: "#06B6D4" },
};

// ── Initials avatar ───────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarBg(name) },
      ]}
    >
      <Text style={[avatarStyles.text, { fontSize: size * 0.35 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { justifyContent: "center", alignItems: "center" },
  text: { color: "#FFF", fontWeight: "700" },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ForumScreen() {
  const [posts, setPosts]           = useState<ForumPost[]>([]);
  const [userData, setUserData]     = useState<{ fullName: string; email: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replyText, setReplyText]   = useState("");
  const [posting, setPosting]       = useState(false);
  const [newPostTitle, setNewPostTitle]   = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [forumPosts, userInfo] = await Promise.all([
        getForumPosts(),
        AsyncStorage.getItem("userData"),
      ]);
      setPosts(forumPosts);
      if (userInfo) setUserData(JSON.parse(userInfo));
    } catch {
      // silently continue
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreatePost = async () => {
    const content = newPostContent.trim();
    if (!content || !userData) return;
    setPosting(true);
    try {
      const post = await createForumPost({
        userId: userData.email,
        userName: userData.fullName,
        title: newPostTitle.trim() || undefined,
        content,
        category: "general",
      });
      setPosts((prev) => [post, ...prev]);
      setNewPostTitle("");
      setNewPostContent("");
      setShowNewPost(false);
    } catch {
      // silently continue
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userData) return;
    const updated = await toggleLike(postId, userData.email);
    if (!updated) return;
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: updated.likes } : p)));
    if (selectedPost?.id === postId) setSelectedPost((p) => p ? { ...p, likes: updated.likes } : p);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !userData || !selectedPost) return;
    const comment = await addComment(selectedPost.id, {
      userId: userData.email,
      userName: userData.fullName,
      content: replyText,
    });
    if (!comment) return;
    const updated = { ...selectedPost, comments: [...selectedPost.comments, comment] };
    setSelectedPost(updated);
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setReplyText("");
  };

  const popularPosts = posts
    .filter((p) => !search || (p.title ?? p.content).toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selectedPost) {
    const cat = selectedPost.category ? CATEGORY_TAG[selectedPost.category] : null;
    const isLiked = userData ? selectedPost.likes.includes(userData.email) : false;
    const displayName = userData?.fullName ?? "Utilisateur";

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.headerBackBtn}>
            <Ionicons name="chevron-back" size={18} color={PURPLE} />
            <Text style={styles.headerBackText}>Sujets</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discussion</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Post card */}
            <View style={styles.detailCard}>
              {cat && (
                <View style={[styles.catTag, { backgroundColor: cat.color + "22", borderColor: cat.color + "44" }]}>
                  <Text style={[styles.catTagText, { color: cat.color }]}>{cat.label}</Text>
                </View>
              )}
              <Text style={styles.detailTitle}>
                {selectedPost.title ?? selectedPost.content}
              </Text>

              {selectedPost.stockSymbol && (
                <View style={styles.stockChip}>
                  <View style={styles.stockChipLeft}>
                    <Text style={styles.stockChipSymbol}>{selectedPost.stockSymbol}</Text>
                    {selectedPost.stockName && (
                      <Text style={styles.stockChipName}>{selectedPost.stockName}</Text>
                    )}
                  </View>
                  {selectedPost.stockPrice != null && (
                    <Text style={styles.stockChipPrice}>
                      {selectedPost.stockPrice.toFixed(2)} $
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.detailMeta}>
                <View style={styles.detailMetaItem}>
                  <Ionicons name="person-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.detailMetaText}>{selectedPost.userName.split(" ")[0]} {selectedPost.userName.split(" ")[1]?.[0]}.</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.detailMetaText}>{formatDate(selectedPost.createdAt)}</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Ionicons name="chatbubble-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.detailMetaText}>{selectedPost.comments.length} réponses</Text>
                </View>
              </View>

              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={styles.disclaimerText}>
                  Les avis partagés sont personnels, pas des conseils financiers
                </Text>
              </View>
            </View>

            {/* Comments */}
            <View style={styles.commentsList}>
              {selectedPost.comments.map((c) => (
                <View key={c.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Avatar name={c.userName} size={38} />
                    <View style={styles.commentHeaderInfo}>
                      <Text style={styles.commentUserName}>{c.userName}</Text>
                      <Text style={styles.commentTime}>{formatTime(c.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentBody}>{c.content}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Ionicons name="heart-outline" size={16} color="rgba(255,255,255,0.45)" />
                      <Text style={styles.commentActionText}>{c.likes ?? 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Ionicons name="return-down-forward-outline" size={16} color="rgba(255,255,255,0.45)" />
                      <Text style={styles.commentActionText}>Répondre</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Reply input */}
          <View style={styles.replyBar}>
            <Avatar name={displayName} size={34} />
            <TextInput
              style={styles.replyInput}
              placeholder="Ajouter une réponse..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={replyText}
              onChangeText={setReplyText}
              returnKeyType="send"
              onSubmitEditing={handleReply}
            />
            <TouchableOpacity
              style={[styles.replySend, !replyText.trim() && { opacity: 0.5 }]}
              onPress={handleReply}
              disabled={!replyText.trim()}
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={18} color={PURPLE} />
          <Text style={styles.headerBackText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forum</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="notifications-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
      >
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un sujet, une action..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
        </View>
        <View style={styles.categoriesList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryRow}
              activeOpacity={0.7}
              onPress={() => {
                /* filter by category — future feature */
              }}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: cat.iconBg }]}>
                <Ionicons name={cat.icon} size={20} color={cat.iconColor} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categorySub}>{cat.count} sujets · {cat.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular posts */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Sujets populaires</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.postsList}>
          {popularPosts.map((post) => {
            const cat = post.category ? CATEGORY_TAG[post.category] : null;
            const firstName = post.userName.split(" ")[0];
            const lastInitial = post.userName.split(" ")[1]?.[0] ?? "";
            return (
              <TouchableOpacity
                key={post.id}
                style={styles.postRow}
                onPress={() => setSelectedPost(post)}
                activeOpacity={0.75}
              >
                {/* Tags row */}
                <View style={styles.postTagRow}>
                  {cat && (
                    <View style={[styles.catTag, { backgroundColor: cat.color + "22", borderColor: cat.color + "44" }]}>
                      <Text style={[styles.catTagText, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                  )}
                  {post.pinned && (
                    <View style={styles.pinnedBadge}>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text style={styles.pinnedText}>Épinglé</Text>
                    </View>
                  )}
                </View>
                {/* Title */}
                <Text style={styles.postRowTitle} numberOfLines={2}>
                  {post.title ?? post.content}
                </Text>
                {/* Footer */}
                <View style={styles.postRowFooter}>
                  <View style={styles.postRowStats}>
                    <Ionicons name="chatbubble-outline" size={13} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.postRowStatText}>{post.comments.length}</Text>
                    <Ionicons name="heart-outline" size={13} color="rgba(255,255,255,0.4)" style={{ marginLeft: 8 }} />
                    <Text style={styles.postRowStatText}>{post.likes.length}</Text>
                  </View>
                  <Text style={styles.postRowMeta}>
                    {firstName} {lastInitial}. · {formatDate(post.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* New post button */}
        {userData && (
          <TouchableOpacity
            style={styles.newPostFab}
            onPress={() => setShowNewPost((v) => !v)}
            activeOpacity={0.85}
          >
            <Ionicons name={showNewPost ? "close" : "add"} size={20} color="#FFF" />
            <Text style={styles.newPostFabText}>{showNewPost ? "Annuler" : "Nouveau sujet"}</Text>
          </TouchableOpacity>
        )}

        {/* Inline new post form */}
        {showNewPost && userData && (
          <View style={styles.newPostForm}>
            <TextInput
              style={styles.newPostTitleInput}
              placeholder="Titre du sujet"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />
            <TextInput
              style={styles.newPostBodyInput}
              placeholder="Partagez une idée, une analyse..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.publishBtn, (!newPostContent.trim() || posting) && { opacity: 0.5 }]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || posting}
            >
              <Ionicons name="send" size={16} color="#FFF" />
              <Text style={styles.publishBtnText}>Publier</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerBackBtn: { flexDirection: "row", alignItems: "center", gap: 2, minWidth: 70 },
  headerBackText: { fontSize: 15, color: PURPLE, fontWeight: "500" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerIconBtn: { padding: 4, minWidth: 32, alignItems: "flex-end" },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: "#FFF" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  seeAll: { fontSize: 13, color: PURPLE, fontWeight: "500" },

  // Categories
  categoriesList: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 14,
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: { flex: 1 },
  categoryLabel: { fontSize: 15, fontWeight: "600", color: "#FFF", marginBottom: 2 },
  categorySub: { fontSize: 12, color: "rgba(255,255,255,0.4)" },

  // Post list (popular)
  postsList: { marginHorizontal: 16, gap: 8 },
  postRow: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    gap: 8,
  },
  postTagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  catTagText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  pinnedText: { fontSize: 11, color: "#F59E0B", fontWeight: "600" },
  postRowTitle: { fontSize: 15, fontWeight: "600", color: "#FFF", lineHeight: 21 },
  postRowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  postRowStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  postRowStatText: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  postRowMeta: { fontSize: 12, color: "rgba(255,255,255,0.35)" },

  // New post
  newPostFab: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    backgroundColor: PURPLE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  newPostFabText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  newPostForm: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 10,
  },
  newPostTitleInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  newPostBodyInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: PURPLE,
    paddingVertical: 11,
    borderRadius: 12,
  },
  publishBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },

  // ── Detail view ─────────────────────────────────────────────────────────────

  detailCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 12,
  },
  detailTitle: { fontSize: 18, fontWeight: "700", color: "#FFF", lineHeight: 26 },
  stockChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  stockChipLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  stockChipSymbol: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  stockChipName: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  stockChipPrice: { fontSize: 13, fontWeight: "600", color: PURPLE },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 14 },
  detailMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailMetaText: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  disclaimerText: { fontSize: 11, color: "rgba(255,255,255,0.3)", flex: 1 },

  // Comments list
  commentsList: {
    marginHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  commentCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
    gap: 10,
  },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentHeaderInfo: { flex: 1 },
  commentUserName: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  commentTime: { fontSize: 11, color: PURPLE, marginTop: 1 },
  commentBody: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 },
  commentActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  commentActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  commentActionText: { fontSize: 13, color: "rgba(255,255,255,0.45)" },

  // Reply bar
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#0A0A0F",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  replySend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },
});
