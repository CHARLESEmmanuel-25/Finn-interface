import { MaterialCommunityIcons } from "@expo/vector-icons";

export type SectorEntry = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
};

const SECTOR_ICONS: Record<string, SectorEntry> = {
  "technology":             { icon: "chip",                  color: "#6366F1", bg: "rgba(99,102,241,0.2)" },
  "services":               { icon: "briefcase-outline",     color: "#3B82F6", bg: "rgba(59,130,246,0.2)" },
  "consumer cyclical":      { icon: "shopping-outline",      color: "#EC4899", bg: "rgba(236,72,153,0.2)" },
  "communication services": { icon: "antenna",               color: "#06B6D4", bg: "rgba(6,182,212,0.2)" },
  "industrials":            { icon: "factory",               color: "#8B5CF6", bg: "rgba(139,92,246,0.2)" },
  "healthcare":             { icon: "heart-pulse",           color: "#EF4444", bg: "rgba(239,68,68,0.2)" },
  "financial services":     { icon: "bank-outline",          color: "#10B981", bg: "rgba(16,185,129,0.2)" },
  "consumer defensive":     { icon: "shield-home-outline",   color: "#F59E0B", bg: "rgba(245,158,11,0.2)" },
  "basic materials":        { icon: "molecule-co2",          color: "#F97316", bg: "rgba(249,115,22,0.2)" },
  // aliases conservés pour compatibilité
  "finance":                { icon: "bank-outline",          color: "#10B981", bg: "rgba(16,185,129,0.2)" },
  "energy":                 { icon: "lightning-bolt",        color: "#F59E0B", bg: "rgba(245,158,11,0.2)" },
  "real estate":            { icon: "home-city-outline",     color: "#14B8A6", bg: "rgba(20,184,166,0.2)" },
};

const DEFAULT_ENTRY: SectorEntry = {
  icon: "chart-donut",
  color: "#8B5CF6",
  bg: "rgba(139,92,246,0.2)",
};

export function getSectorEntry(name: string): SectorEntry {
  return SECTOR_ICONS[name.toLowerCase().trim()] ?? DEFAULT_ENTRY;
}
