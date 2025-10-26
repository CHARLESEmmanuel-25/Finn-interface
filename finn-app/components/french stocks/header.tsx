import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
  } from "react-native";
  import React from "react";
  import { Ionicons } from "@expo/vector-icons";
  import { router } from "expo-router";

export const FrenchStocksHeader = () => {
 
    return (
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={"#FFF"}
          />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Ionicons
            name="bookmark-outline"
            size={24}
            color={"#FFF"}
          />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionsBPrimaryBtn}>
            <Text style={{ color: "#FFF" }}>Mes screeners</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }


const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 8,
      borderRadius: 8,
    },
    headerActions: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    headerActionsBPrimaryBtn: {
      borderColor: "#8B5CF6",
      borderWidth: 1,
      borderRadius: 4,
      paddingBlock: 8,
      paddingInline: 16,
    },
  });
  