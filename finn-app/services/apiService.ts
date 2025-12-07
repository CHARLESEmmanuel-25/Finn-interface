import { Sector, Stock } from "./type";

const BASE_URL = "http://localhost:3000"; // IP de ton backend

// BIG CAP
export const getStocks = async (): Promise<Stock[]> => {
  try {
    const response = await fetch(`${BASE_URL}/stocks`);
    if (!response.ok) throw new Error("Erreur réseau");

    const data: Stock[] = await response.json();
    return data.slice(0, 3); // <- limite à 3 résultats
  } catch (error) {
    console.error("Erreur API getStocks:", error);
    return [];
  }
};


// SECTORS
export const getSectorList = async (): Promise<Sector[]> => {
  try {
    const response = await fetch(`${BASE_URL}/sector/list`);
    if (!response.ok) throw new Error("Erreur réseau");

    const data: Sector[] = await response.json();
    return data.slice(0, 4); // <- limite à 4 résultats
  } catch (error) {
    console.error("Erreur API getSectorList:", error); // corrigé ici
    return [];
  }
};

// BIG PERF

export const getWonShares = async (): Promise<Stock[]> => {
  try {
    const response = await fetch(`${BASE_URL}/stocks/best/perf`);
    if (!response.ok) throw new Error("Erreur réseau");

    const data: Stock[] = await response.json();
   
    return data.slice(0); // <- limite à 4 résultats
  } catch (error) {
    console.error("Erreur API getWonShares:", error); // corrigé ici
    return [];
  }
};