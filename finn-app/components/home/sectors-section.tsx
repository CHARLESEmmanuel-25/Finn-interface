import { Sector } from "@/services/api";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SectorCard } from "../market/sector-card";

interface Props {
  sectors: Sector[];
  onPressMore: () => void;
}

export const SectorsSection: React.FC<Props> = ({
  sectors,
  onPressMore,
}) => {
  const topSectors = sectors.slice(0, 4);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Secteurs</Text>

        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.more}>voir plus</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {topSectors.map((sector) => (
          <SectorCard
            key={sector._id}
            name={sector.name}
            icon={sector.logo || "📊"}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  more: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
});