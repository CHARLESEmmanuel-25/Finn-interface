import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import Svg, { Polyline, Path, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { router } from 'expo-router'
import { LogoImage } from '@/components/LogoImage'
import { Stock, formatPrice, formatMarketCap, formatShares } from '@/services/api'
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

// ─── Mini sparkline ───────────────────────────────────────────────────────────

const SPARK_W = 64
const SPARK_H = 36

function generateSparkPoints(pct: number, count = 20): number[] {
  const points: number[] = []
  let val = 50
  const seed = Math.abs((pct * 137.5) % 100)
  for (let i = 0; i < count; i++) {
    const trend = pct / count
    const noise = ((seed * (i + 1) * 7.3) % 12) - 6
    val += trend + noise * 0.5
    points.push(val)
  }
  return points
}

function MiniSparkline({ pct, color }: { pct: number; color: string }) {
  const pts = generateSparkPoints(pct)
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const PAD = 4

  const toXY = (v: number, i: number) => {
    const x = (i / (pts.length - 1)) * SPARK_W
    const y = SPARK_H - PAD - ((v - min) / range) * (SPARK_H - PAD * 2)
    return { x, y }
  }

  const coords = pts.map((v, i) => {
    const { x, y } = toXY(v, i)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  // area path: line + close to bottom
  const first = toXY(pts[0], 0)
  const last = toXY(pts[pts.length - 1], pts.length - 1)
  const areaPath = `M ${first.x.toFixed(1)},${first.y.toFixed(1)} ${
    pts.map((v, i) => { const p = toXY(v, i); return `L ${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
  } L ${last.x.toFixed(1)},${SPARK_H} L ${first.x.toFixed(1)},${SPARK_H} Z`

  const gradId = `sg_${pct > 0 ? 'pos' : 'neg'}`

  return (
    <Svg width={SPARK_W} height={SPARK_H}>
      <Defs>
        <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.45" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      {/* area fill */}
      <Path d={areaPath} fill={`url(#${gradId})`} />
      {/* baseline */}
      <Line
        x1="0" y1={SPARK_H - 1}
        x2={SPARK_W} y2={SPARK_H - 1}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3,3"
        strokeOpacity={0.4}
      />
      {/* line */}
      <Polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  )
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
  const pct = stock.perf_day ?? 0
  const isPositive = pct >= 0
  const changeColor = isPositive ? GREEN : RED
  const arrow = isPositive ? '▲' : '▼'
  const sign = isPositive ? '+' : ''
  const price = formatPrice(stock.currentPrice, stock.currency)

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
    <TouchableOpacity style={[glass.row, styles.row]} onPress={handlePress} activeOpacity={0.75}>
      <LogoImage
        logo={stock.logo}
        symbol={stock.symbol}
        name={stock.shortName}
        size={40}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{stock.symbol}</Text>
        <Text style={styles.sub} numberOfLines={2}>{stock.shortName}</Text>
      </View>

      <MiniSparkline pct={pct} color={changeColor} />

      <View style={styles.sparkWrap}>
        <Text style={styles.price}>{price}</Text>
        <Text style={[styles.perf, { color: changeColor, backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
          {arrow} {sign}{pct.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
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
    minWidth: 0,
    overflow: 'hidden',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    flexShrink: 1,
  },
  sub: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 1,
    flexShrink: 1,
  },
  sparkWrap: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
    minWidth: 70,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  perf: {
    fontSize: 12,
    fontWeight: '700',
    padding: 4,
    borderRadius: 4
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
