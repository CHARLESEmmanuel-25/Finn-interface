import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Svg, Polyline } from 'react-native-svg'
import {
  glass,
  PURPLE,
  GREEN,
  RED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/glass'

interface PortfolioCardProps {
  totalValue: number
  dailyChange: number
  dailyChangePct: number
  currency?: string
}

const PERIODS = ['1S', '1M', '1A']

// Points décoratifs simulant une courbe de portefeuille
const CHART_POINTS = '0,60 40,52 80,58 120,38 160,44 200,28 240,34 280,18 320,22'

function formatValue(value: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  return `${symbol}${formatted}`
}

export function PortfolioCard({
  totalValue,
  dailyChange,
  dailyChangePct,
  currency = 'EUR',
}: PortfolioCardProps) {
  const isPositive = dailyChange >= 0
  const changeColor = isPositive ? GREEN : RED
  const changeArrow = isPositive ? '▲' : '▼'
  const changeSign = isPositive ? '+' : '−'

  return (
    <View style={[glass.cardStrong, styles.container]}>
      {/* Ligne haute */}
      <View style={styles.header}>
        <Text style={styles.label}>Mon portefeuille</Text>
        <View style={styles.pills}>
          {PERIODS.map((p, i) => (
            <View
              key={p}
              style={[
                styles.pill,
                i === 0
                  ? { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)', borderWidth: 1 }
                  : styles.pillInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  i === 0 && { color: PURPLE },
                ]}
              >
                {p}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Valeur principale */}
      <Text style={styles.totalValue}>{formatValue(totalValue, currency)}</Text>

      {/* Variation du jour */}
      <Text style={[styles.dailyChange, { color: changeColor }]}>
        {changeArrow} {changeSign}{formatValue(dailyChange, currency)} aujourd'hui{' '}
        <Text style={styles.pct}>
          ({changeSign}{Math.abs(dailyChangePct).toFixed(2)} %)
        </Text>
      </Text>

      {/* Séparateur */}
      <View style={styles.separator} />

      {/* Chart area */}
      <View style={styles.chartArea}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.25)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Svg
          width="100%"
          height={64}
          viewBox="0 0 320 64"
          preserveAspectRatio="none"
        >
          <Polyline
            points={CHART_POINTS}
            fill="none"
            stroke={PURPLE}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    letterSpacing: 0.3,
  },
  pills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  dailyChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  pct: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.75,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  chartArea: {
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
})
