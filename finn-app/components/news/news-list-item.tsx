import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'


export default function NewsListItem({ title, source }: any) {
    return (
        <View style={styles.newsListItem}>
            <View style={styles.newsListIcon}>
                <Ionicons name="newspaper" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.newsListContent}>
                <Text style={styles.newsListTitle}>{title}</Text>
                <Text style={styles.newsListSource}>{source}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    newsListItem: {
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    newsListIcon: {
        marginRight: 16,
    },
    newsListContent: {
        flex: 1,
    },
    newsListTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFF",
        marginBottom: 4,
        lineHeight: 18,
    },
    newsListSource: {
        fontSize: 12,
        color: "#A9A9A9",
    },
})