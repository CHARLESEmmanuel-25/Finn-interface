import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  type ForumComment,
} from "../services/forum";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function ForumScreen() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [userData, setUserData] = useState<{ fullName: string; email: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const [forumPosts, userInfo] = await Promise.all([
        getForumPosts(),
        AsyncStorage.getItem("userData"),
      ]);
      setPosts(forumPosts);
      if (userInfo) setUserData(JSON.parse(userInfo));
    } catch (error) {
      console.error("Erreur chargement forum:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        content,
      });
      setPosts((prev) => [post, ...prev]);
      setNewPostContent("");
    } catch (error) {
      console.error("Erreur création post:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userData) return;
    const updated = await toggleLike(postId, userData.email);
    if (!updated) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: updated.likes } : p))
    );
  };

  const handleAddComment = async (postId: string) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content || !userData) return;
    const comment = await addComment(postId, {
      userId: userData.email,
      userName: userData.fullName,
      content,
    });
    if (!comment) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, comment] }
          : p
      )
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forum</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
          }
        >
          {/* Create post */}
          {userData && (
            <View style={styles.createPost}>
              <View style={styles.createPostAvatar}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                  }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.createPostInputRow}>
                <TextInput
                  style={styles.createPostInput}
                  placeholder="Partagez une idée, une analyse..."
                  placeholderTextColor="#666"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.postButton,
                    (!newPostContent.trim() || posting) && styles.postButtonDisabled,
                  ]}
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim() || posting}
                >
                  <Ionicons name="send" size={20} color="#FFF" />
                  <Text style={styles.postButtonText}>Publier</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Feed */}
          <View style={styles.feed}>
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={56} color="#8B5CF6" />
                <Text style={styles.emptyTitle}>Aucune publication</Text>
                <Text style={styles.emptyDesc}>
                  Soyez le premier à partager une idée ou une analyse avec la communauté !
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={userData?.email}
                  isLiked={userData ? post.likes.includes(userData.email) : false}
                  onLike={() => handleLike(post.id)}
                  commentInput={commentInputs[post.id] ?? ""}
                  onCommentInputChange={(v) =>
                    setCommentInputs((prev) => ({ ...prev, [post.id]: v }))
                  }
                  onAddComment={() => handleAddComment(post.id)}
                  isExpanded={!!expandedComments[post.id]}
                  onToggleComments={() => toggleComments(post.id)}
                  getInitials={getInitials}
                />
              ))
            )}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PostCard({
  post,
  currentUserId,
  isLiked,
  onLike,
  commentInput,
  onCommentInputChange,
  onAddComment,
  isExpanded,
  onToggleComments,
  getInitials,
}: {
  post: ForumPost;
  currentUserId?: string;
  isLiked: boolean;
  onLike: () => void;
  commentInput: string;
  onCommentInputChange: (v: string) => void;
  onAddComment: () => void;
  isExpanded: boolean;
  onToggleComments: () => void;
  getInitials: (n: string) => string;
}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{getInitials(post.userName)}</Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.postUserName}>{post.userName}</Text>
          <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      {post.stockSymbol && (
        <View style={styles.stockBadge}>
          <Text style={styles.stockBadgeText}>{post.stockSymbol}</Text>
          {post.stockName && (
            <Text style={styles.stockBadgeName} numberOfLines={1}>
              {post.stockName}
            </Text>
          )}
        </View>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#FF3B30" : "#A9A9A9"}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
            {post.likes.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onToggleComments}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color="#A9A9A9"
          />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.commentsSection}>
          <TouchableOpacity style={styles.collapseBtn} onPress={onToggleComments}>
            <Text style={styles.collapseBtnText}>Masquer les commentaires</Text>
            <Ionicons name="chevron-up" size={16} color="#8B5CF6" />
          </TouchableOpacity>
          {post.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentUser}>{c.userName}</Text>
              <Text style={styles.commentContent}>{c.content}</Text>
            </View>
          ))}
          {currentUserId && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor="#666"
                value={commentInput}
                onChangeText={onCommentInputChange}
                onSubmitEditing={onAddComment}
              />
              <TouchableOpacity
                style={[
                  styles.commentSend,
                  !commentInput.trim() && styles.commentSendDisabled,
                ]}
                onPress={onAddComment}
                disabled={!commentInput.trim()}
              >
                <Ionicons name="send" size={18} color={commentInput.trim() ? "#8B5CF6" : "#666"} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {!isExpanded && post.comments.length > 0 && (
        <TouchableOpacity style={styles.showComments} onPress={onToggleComments}>
          <Text style={styles.showCommentsText}>
            Voir les {post.comments.length} commentaire{post.comments.length > 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#8B5CF6" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  createPost: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    gap: 12,
  },
  createPostAvatar: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  createPostInputRow: {
    flex: 1,
    gap: 10,
  },
  createPostInput: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 15,
    maxHeight: 100,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#8B5CF6",
    paddingVertical: 10,
    borderRadius: 12,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  feed: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#A9A9A9",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  postCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  postAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  postHeaderInfo: { flex: 1, marginLeft: 12 },
  postUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  postTime: {
    fontSize: 12,
    color: "#A9A9A9",
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: "#FFF",
    lineHeight: 22,
    marginBottom: 12,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  stockBadgeName: {
    fontSize: 12,
    color: "#A9A9A9",
    marginLeft: 8,
    maxWidth: 120,
  },
  postActions: {
    flexDirection: "row",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#A9A9A9",
  },
  actionTextLiked: {
    color: "#FF3B30",
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  collapseBtnText: {
    fontSize: 13,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  comment: {
    marginBottom: 12,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  commentContent: {
    fontSize: 14,
    color: "#A9A9A9",
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 14,
  },
  commentSend: {
    padding: 10,
    marginLeft: 8,
  },
  commentSendDisabled: {},
  showComments: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  showCommentsText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "500",
  },
  bottomSpacer: { height: 40 },
});
