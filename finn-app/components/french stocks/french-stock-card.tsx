import { Text, View, StyleSheet, TouchableOpacity } from "react-native"
import { glass, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/glass"

export default function FrenchStockCard({ symbol, name, price, change, onPress }: {
    symbol: string; name: string; price: string; change: number; onPress?: () => void;
}) {
    const isPositive = change >= 0
    const arrow = isPositive ? "↑" : "↓"
    const changeColor = isPositive ? GREEN : RED
    const changeBg = isPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
    const sign = isPositive ? "+" : ""

    const Container = onPress ? TouchableOpacity : View

    return (
        <Container style={[glass.card, styles.card]} onPress={onPress}>
            <View style={styles.logoBox}>
                <Text style={styles.logoText}>{symbol}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.price}>{price}</Text>
            <View style={[styles.changeBadge, { backgroundColor: changeBg }]}>
                <Text style={[styles.changeText, { color: changeColor }]}>
                    {arrow} {sign}{Math.abs(change).toFixed(2)}%
                </Text>
            </View>
        </Container>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
        marginRight: 12,
        width: 120,
    },
    logoBox: {
        borderRadius: 10,
        backgroundColor: "rgba(139, 92, 246, 0.2)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    logoText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#8B5CF6",
    },
    name: {
        fontSize: 13,
        fontWeight: "700",
        color: TEXT_PRIMARY,
        marginBottom: 4,
        textAlign: "center",
    },
    price: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginBottom: 8,
        textAlign: "center",
    },
    changeBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    changeText: {
        fontSize: 12,
        fontWeight: "700",
    },
})
