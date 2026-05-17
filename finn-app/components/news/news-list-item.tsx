import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { glass, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/glass'

export default function NewsListItem({ title, source, time }: any) {
    return (
        <View style={[glass.row, styles.item]}>
            <View style={styles.iconBox}>
                <Ionicons name="newspaper-outline" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <View style={styles.meta}>
                    <Text style={styles.source}>{source}</Text>
                    {time && <Text style={styles.dot}>·</Text>}
                    {time && <Text style={styles.time}>{time}</Text>}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    iconBox: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: 10,
        padding: 8,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_PRIMARY,
        lineHeight: 18,
        marginBottom: 4,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    source: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    dot: {
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
    time: {
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
})
