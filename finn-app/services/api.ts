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
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  return `$${marketCap.toFixed(2)}`;
}

/**
 * Formate le nombre d'actions
 */
export function formatShares(shares: number): string {
  if (shares >= 1e9) {
    return `${(shares / 1e9).toFixed(1)}B`;
  } else if (shares >= 1e6) {
    return `${(shares / 1e6).toFixed(1)}M`;
  }
  return shares.toLocaleString();
}
