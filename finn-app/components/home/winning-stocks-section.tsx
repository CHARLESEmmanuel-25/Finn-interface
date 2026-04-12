import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { LogoImage } from '@/components/LogoImage'
import { Stock, formatPrice } from '@/services/api'
import {
  glass,
  GREEN,
  RED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/glass'

interface WinningStocksSectionProps {
  stocks: Stock[]
  loading?: boolean
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [opacity])

  return <Animated.View style={[styles.skeletonRow, { opacity }]} />
}

// ─── Stock row ────────────────────────────────────────────────────────────────

function StockRow({ stock }: { stock: Stock }) {
  const pct = stock.percentVar ?? 0
  const isPositive = pct >= 0
  const changeColor = isPositive ? GREEN : RED
  const arrow = isPositive ? '▲' : '▼'
  const sign = isPositive ? '+' : ''
  const price = formatPrice(stock.currentPrice, stock.currency)

  return (
    <View style={[glass.row, styles.row]}>
      <LogoImage
        logo={stock.logo}
        symbol={stock.symbol}
        name={stock.shortName}
        size={40}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{stock.shortName}</Text>
        <Text style={styles.sub}>{stock.symbol} · {price}</Text>
      </View>

      <Text style={[styles.perf, { color: changeColor }]}>
        {arrow} {sign}{pct.toFixed(2)} %
      </Text>
    </View>
  )
}

// ─── Section principale ───────────────────────────────────────────────────────

export function WinningStocksSection({ stocks, loading = false }: WinningStocksSectionProps) {
  return (
    <View style={styles.section}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Actions gagnantes</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* États */}
      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : stocks.length === 0 ? (
        <Text style={styles.empty}>Aucune donnée</Text>
      ) : (
        <View style={styles.list}>
          {stocks.map((stock) => (
            <StockRow key={stock._id} stock={stock} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  liveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: GREEN,
    letterSpacing: 0.5,
  },
  list: {
    gap: 6,
  },
  // Row stock
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sub: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  perf: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Skeleton
  skeletonRow: {
    height: 68,
    borderRadius: 14,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Empty
  empty: {
    marginHorizontal: 20,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
})
