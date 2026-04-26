import { Text, View, StyleSheet } from "react-native"
import { LogoImage } from "../LogoImage"
import { glass } from "@/constants/glass"

export default function FrenchStockCard({ symbol, name, price, logo }: any) {
    return (
        <View style={[glass.card, styles.frenchStockCard]}>
            <View style={styles.frenchStockLogo}>
                <LogoImage logo={logo} symbol={symbol} name={name} size={28} />
            </View>
            <Text style={styles.frenchStockSymbol}>{symbol}</Text>
            <Text style={styles.frenchStockName} numberOfLines={2}>{name}</Text>
            <Text style={styles.frenchStockPrice}>{price}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    frenchStockCard: {
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        marginRight: 10,
        width: 100,
    },
    frenchStockLogo: {
        marginBottom: 8,
    },
    frenchStockSymbol: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 2,
    },
    frenchStockName: {
        fontSize: 10,
        color: "#A9A9A9",
        marginBottom: 6,
        textAlign: "center",
    },
    frenchStockPrice: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4CD964",
    },
})