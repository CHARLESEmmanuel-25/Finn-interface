import { Text, View, StyleSheet } from "react-native"
import { LogoImage } from "../LogoImage"

export default function FrenchStockCard({ symbol, name, price, logo }: any) {
    return (
        <View style={styles.frenchStockCard}>
            <View style={styles.frenchStockLogo}>
                <LogoImage logo={logo} symbol={symbol} name={name} size={32} />
            </View>
            <Text style={styles.frenchStockSymbol}>{symbol}</Text>
            <Text style={styles.frenchStockName}>{name}</Text>
            <Text style={styles.frenchStockPrice}>{price}</Text>
        </View>
    )

};


const styles = StyleSheet.create({
    frenchStockCard: {
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginRight: 16,
        width: 140,
    },
    frenchStockLogo: {
        marginBottom: 12,
    },
    frenchStockSymbol: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFF",
        marginBottom: 4,
    },
    frenchStockName: {
        fontSize: 12,
        color: "#A9A9A9",
        marginBottom: 8,
        textAlign: "center",
    },
    frenchStockPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4CD964",
    },
})