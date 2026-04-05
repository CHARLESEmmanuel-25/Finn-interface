import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

const periods = ["1S", "1M", "1A"];

const chartData = {
  labels: [],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43, 60],
      strokeWidth: 2,
    },
  ],
};

export const PortfolioCard = () => {
  const [activePeriod, setActivePeriod] = useState("1S");
  const [profit, setProfit] = useState(318);

  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setProfit((p) => p + Math.floor(Math.random() * 5));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const changePeriod = (period: string) => {
    setActivePeriod(period);

    scale.value = 0.95;
    scale.value = withTiming(1, { duration: 250 });
  };

  return (
    <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon portefeuille</Text>

          <View style={styles.periodContainer}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  activePeriod === period && styles.activePeriod,
                ]}
                onPress={() => changePeriod(period)}
              >
                <Text
                  style={[
                    styles.periodText,
                    activePeriod === period && styles.activePeriodText,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.amount}>€24 830</Text>

        <Text style={styles.growth}>+€{profit} aujourd&apos;hui</Text>

        <LineChart
          data={chartData}
          width={width - 80}
          height={120}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          chartConfig={{
            backgroundGradientFrom: "transparent",
            backgroundGradientTo: "transparent",
            color: () => "#6D5EF6",
            strokeWidth: 2,
          }}
          style={styles.chart}
        />
      </Animated.View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginVertical: 16,
  },

  container: {
    padding: 20,
    backgroundColor: "#1A1A1A",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: "#9E9E9E",
    fontSize: 14,
  },

  amount: {
    color: "white",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 10,
  },

  growth: {
    color: "#4ADE80",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
  },

  periodContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 3,
  },

  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },

  activePeriod: {
    backgroundColor: "#6D5EF6",
  },

  periodText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
  },

  activePeriodText: {
    color: "white",
  },

  chart: {
    marginTop: 16,
  },
});