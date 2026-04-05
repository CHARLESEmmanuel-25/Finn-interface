import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";

export const ForumSection = () => {
  return (
    <BlurView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Forum</Text>
          <Text style={styles.subtitle}>
            Discussions entre investisseurs
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/forum")}>
          <Text style={styles.joinButton}>Rejoindre →</Text>
        </TouchableOpacity>
      </View>

      {/* AVATARS GROUPÉS */}
      <View style={styles.avatarsRow}>
        <View style={[styles.avatar, { backgroundColor: "#6366F1" }]}>
          <Text style={styles.avatarText}>JD</Text>
        </View>

        <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: "#10B981" }]}>
          <Text style={styles.avatarText}>SM</Text>
        </View>

        <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: "#F59E0B" }]}>
          <Text style={styles.avatarText}>AL</Text>
        </View>

        <Text style={styles.replyText}>+21 réponses</Text>
      </View>

      {/* EXEMPLE DE DISCUSSION */}
      <View style={styles.post}>
        <Text style={styles.postTitle}>
          Proagro va-t-elle dépasser les prévisions ?
        </Text>

        <Text style={styles.postPreview}>
          Certains traders pensent que la hausse actuelle pourrait
          continuer après les résultats trimestriels…
        </Text>
      </View>

    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    overflow: "hidden",
    backgroundColor: "#1A1A1A"
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },

  joinButton: {
    color: "#6366F1",
    fontWeight: "600",
    fontSize: 14,
  },

  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarOverlap: {
    marginLeft: -10,
  },

  avatarText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  replyText: {
    color: "#9CA3AF",
    marginLeft: 10,
    fontSize: 13,
  },

  post: {
    marginTop: 14,
  },

  postTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },

  postPreview: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
});