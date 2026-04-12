import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { LogoImage } from '@/components/LogoImage'
import { Stock, formatPrice, formatMarketCap, formatShares } from '@/services/api'
import {
  glass,
  PURPLE,
  GREEN,
  RED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/constants/glass'

interface LargeCapSectionProps {
  stocks: Stock[]
  loading?: boolean
  onPressMore?: () => void
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]} />
  )
}

// ─── Stock card ───────────────────────────────────────────────────────────────

interface StockCardProps {
  stock: Stock
  rank: number
}

function StockCard({ stock, rank }: StockCardProps) {
  const pct = stock.percentVar ?? 0
  const isPositive = pct >= 0
  const changeColor = isPositive ? GREEN : RED
  const changeArrow = isPositive ? '▲' : '▼'
  const absChange = Math.abs(pct).toFixed(2)

  const handlePress = () => {
    router.push({
      pathname: '/company-profile',
      params: {
        symbol: stock.symbol,
        name: stock.shortName || stock.symbol,
        price: stock.currentPrice?.toString() ?? 'N/A',
        change: stock.percentVar?.toString() ?? 'N/A',
        logo: stock.logo || '',
        location: stock.country ?? '',
        website: stock.website ?? '',
        about: stock.summary ?? '',
        marketCap: formatMarketCap(stock.marketCap, stock.currency),
        shares: formatShares(stock.sharesStats),
        revenue: 'N/A',
        eps: stock.EPS?.toString() || 'N/A',
        peRatio: stock.PER?.toString() || 'N/A',
        dividend: stock.dividendYield
          ? `${(stock.dividendYield * 100).toFixed(2)}%`
          : '0.00%',
        currency: stock.currency,
      },
    } as any)
  }

  return (
    <TouchableOpacity style={[glass.card, styles.card]} onPress={handlePress} activeOpacity={0.75}>
      {/* Rang */}
      <Text style={styles.rank}>#{rank}</Text>

      {/* Logo */}
      <LogoImage
        logo={stock.logo}
        symbol={stock.symbol}
        name={stock.shortName}
        size={36}
      />

      {/* Nom */}
      <Text style={styles.stockName} numberOfLines={2}>
        {stock.shortName}
      </Text>

      {/* Performance */}
      <Text style={[styles.perf, { color: changeColor }]}>
        {changeArrow} {absChange} %
      </Text>
    </TouchableOpacity>
  )
}

// ─── Section principale ───────────────────────────────────────────────────────

export function LargeCapSection({ stocks, loading = false, onPressMore }: LargeCapSectionProps) {
  // Découper en rangées de 2
  const rows: Stock[][] = []
  for (let i = 0; i < stocks.length; i += 2) {
    rows.push(stocks.slice(i, i + 2))
  }

  return (
    <View style={styles.section}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Grandes capitalisations</Text>
        <TouchableOpacity onPress={onPressMore}>
          <Text style={styles.seeMore}>voir plus →</Text>
        </TouchableOpacity>
      </View>

      {/* États */}
      {loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : stocks.length === 0 ? (
        <Text style={styles.empty}>Aucune donnée</Text>
      ) : (
        <View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((stock, colIndex) => (
                <StockCard
                  key={stock._id}
                  stock={stock}
                  rank={rowIndex * 2 + colIndex + 1}
                />
              ))}
              {/* Cellule vide si rangée impaire */}
              {row.length === 1 && <View style={styles.cardPlaceholder} />}
            </View>
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
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  seeMore: {
    fontSize: 14,
    color: PURPLE,
  },
  // Grille
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 0,
  },
  // Card stock
  card: {
    flex: 1,
    margin: 5,
    padding: 14,
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  cardPlaceholder: {
    flex: 1,
    margin: 5,
  },
  rank: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: 12,
    color: TEXT_TERTIARY,
  },
  stockName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 8,
    lineHeight: 18,
  },
  perf: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  // Skeleton
  skeletonCard: {
    flex: 1,
    margin: 5,
    height: 110,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  // Empty
  empty: {
    marginHorizontal: 20,
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
})
