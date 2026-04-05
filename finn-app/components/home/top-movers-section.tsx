import React from "react"
import { View, Text, StyleSheet } from "react-native"

interface Props {
  name: string
  price: string
  change: string
}

export const TopMoversSection: React.FC<Props> = ({ name, price, change }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>{price}</Text>
      <Text style={styles.change}>{change}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 10
  },

  name: {
    fontWeight: "600",
    fontSize: 16
  },

  price: {
    fontSize: 14,
    marginTop: 4
  },

  change: {
    color: "green",
    marginTop: 4
  }
})