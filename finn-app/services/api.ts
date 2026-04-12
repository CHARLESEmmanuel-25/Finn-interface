const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not set');
}

export interface Stock {
  _id: string;
  symbol: string;
  shortName: string;
  currentPrice: number;
  percentVar: number;
  marketCap: number;
  currency: string;
  sector: string;
  sectorId: string;
  country: string;
  marketState: string;
  PER: number | null;
  EPS: number | null;
  dividendYield: number | null;
  sharesStats: number;
  logo: string | null;
  website: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  _id: string;
  name: string;
  logo: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Récupère la liste de toutes les actions
 */
export async function fetchStocks(): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    throw error;
  }
}

/**
 * Récupère la liste de tous les secteurs
 */
export async function fetchSectors(): Promise<Sector[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sector/list`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des secteurs:', error);
    throw error;
  }
}

export interface MarketOverview {
  gainers: Stock[];
  losers: Stock[];
  totalStocks: number;
  avgPerf: number;
}

export interface SectorPerformance {
  _id: string;
  name: string;
  logo: string;
  avgPerf: number;
  totalMarketCap: number;
}

/**
 * Récupère l'aperçu du marché (gainers, losers, stats globales)
 */
export async function fetchMarketOverview(): Promise<MarketOverview> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/market/overview`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'aperçu du marché:', error);
    throw error;
  }
}

/**
 * Récupère les meilleures hausses du marché
 */
export async function fetchTopGainers(limit: number = 5): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/top/gainers?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des top gainers:', error);
    throw error;
  }
}

/**
 * Récupère les plus fortes baisses du marché
 */
export async function fetchTopLosers(limit: number = 5): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/top/losers?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des top losers:', error);
    throw error;
  }
}

/**
 * Récupère les meilleures performances (top 3 small caps)
 */
export async function fetchBestPerf(): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/best/perf`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleures performances:', error);
    throw error;
  }
}

/**
 * Récupère les grandes capitalisations
 */
export async function fetchBigCaps(): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/bigcapitalization`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des grandes capitalisations:', error);
    throw error;
  }
}

/**
 * Récupère les performances par secteur
 */
export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/sector/performance`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des performances sectorielles:', error);
    throw error;
  }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface Portfolio {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioPositionPerf {
  stockId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  currency: string;
}

export interface PortfolioPerformance {
  portfolioId: string;
  investedValue: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  positions: PortfolioPositionPerf[];
}

/**
 * Récupère la liste des portfolios d'un utilisateur
 */
export async function fetchUserPortfolios(userId: string): Promise<Portfolio[]> {
  const response = await fetch(`${API_BASE_URL}/portfolio?userId=${userId}`);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

/**
 * Récupère la performance (P&L) d'un portfolio
 */
export async function fetchPortfolioPerformance(portfolioId: string): Promise<PortfolioPerformance> {
  const response = await fetch(`${API_BASE_URL}/portfolio/${portfolioId}/performance`);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  return response.json();
}

/**
 * Formate le prix avec la devise
 */
export function formatPrice(price: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * Formate la capitalisation boursière
 */
export function formatMarketCap(marketCap: number, currency: string = 'USD'): string {
  const symbol = currency === 'EUR' ? '€' : '$';
  if (marketCap >= 1e12) {
    return `${symbol}${(marketCap / 1e12).toFixed(2)} T`;
  } else if (marketCap >= 1e9) {
    return `${symbol}${(marketCap / 1e9).toFixed(2)} B`;
  } else if (marketCap >= 1e6) {
    return `${symbol}${(marketCap / 1e6).toFixed(2)} M`;
  }
  return `${symbol}${marketCap.toFixed(2)}`;
}

/**
 * Formate le nombre d'actions
 */
export function formatShares(shares: number | undefined | null): string {
  if (shares == null || isNaN(shares)) return 'N/A';
  if (shares >= 1e9) {
    return `${(shares / 1e9).toFixed(1)}B`;
  } else if (shares >= 1e6) {
    return `${(shares / 1e6).toFixed(1)}M`;
  }
  return shares.toLocaleString();
}
