export type Stock = {
  _id : string;
  symbol: string;
  logo: string | null;
  shortName: string;
  currentPrice: number;
  currency: string;
  sharesStats: number;
  percentVar: number;
  marketState: string;
  PER: number;
  dividendYield: number | null;
  EPS: number | null;
  summary: string;
  marketCap: number;
  country: string;
  perf_day: number | null;
  sector: string;
  website: string;
};


export type Sector = {
  name: string;
  logo: string;
}