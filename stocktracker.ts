import { StockData } from "./models/stock.model";
import { StockItem } from "./types/stock-items.type";

export interface StockDataWithChange extends StockData {
  volumeChangePct: number;
  baseRank: number;
  latestRank: number;
  rankChangePct: number;
}

export interface StockReport {
  id: number;
  symbol: string;
  avgInOI: number;
  changeInOI: number;
  latestOI:number;
  latestRank: number;
  rankChangePct: number;
  baseline: number;
  latest: number;
  changePct: number;
  volumeChangePct: number;
  score: number;
  baselineVolume: number;
  volume: number;
}

export interface StockWithScores extends StockReport {
  RC_norm: number;
  L_norm: number;
  C_norm: number;
  composite: number;
}

export class StockTracker {
  public baseline: StockData[];

  constructor(baseline: StockData[]) {
    baseline.forEach((item, index) => {
      item.id = index + 1;
    });

    this.baseline = baseline;
  }

  async compareWithBaseline(latest: StockData[]): Promise<StockDataWithChange[]> {
    if (latest.length <= 0) {
      console.log("Latest data not captured");
      return [];
    }
  
    if (this.baseline.length <= 0) {
      console.log("Baseline data not captured");
      return [];
    }
  
    latest.forEach((item, index) => {
      item.id = index + 1;
    });
  
    const result: StockDataWithChange[] = latest.map((latestStock) => {
      const baseStock = this.baseline.find(
        (b) => b.symbol === latestStock.symbol
      );
  
      let volumeChangePct = 0;
      if (baseStock && baseStock.volume > 0) {
        volumeChangePct =
          ((latestStock.volume - baseStock.volume) / baseStock.volume) * 100;
      }
  
      let baseRank = 0;
      let latestRank = 0;
      let rankChangePct = 0;
  
      if (baseStock?.id > 0 && latestStock.id > 0) {
        baseRank = baseStock.id;
        latestRank = latestStock.id;
  
        rankChangePct =
          ((latestStock.id - baseStock.id) / baseStock.id) * 100;
      }
  
      return {
        ...latestStock,
        volumeChangePct,
        baseRank,
        latestRank,
        rankChangePct,
      };
    });
  
    // Sort by rankChangePct (ascending)
    const sorted = result.sort(
      (a, b) => parseFloat(a.rankChangePct.toFixed(2)) - parseFloat(b.rankChangePct.toFixed(2))
    );
  
    return sorted;
  }

  calculateTopStocks(dataAll: StockReport[]): StockWithScores[] {
    const w1 = 0.10; // weight for rankChangePct
    const w2 = 0.60; // weight for latest
    const w3 = 0.30; // weight for changePct

    let data = dataAll.slice(0, 50)

    const rcMin = Math.min(...data.map(s => s.rankChangePct));
    const rcMax = Math.max(...data.map(s => s.rankChangePct));
    const latestMin = Math.min(...data.map(s => s.latest));
    const latestMax = Math.max(...data.map(s => s.latest));
    const chgMin = Math.min(...data.map(s => s.changePct));
    const chgMax = Math.max(...data.map(s => s.changePct));
  
    function normRankChange(rc: number) {
      return (rcMax - rc) / (rcMax - rcMin);
    }
  
    function normLatest(latest: number) {
      return (latest - latestMin) / (latestMax - latestMin);
    }
  
    function normChangePct(chg: number) {
      return (chg - chgMin) / (chgMax - chgMin);
    }
  
    const scoredData: StockWithScores[] = data.map(stock => {
      const RC_norm = normRankChange(stock.rankChangePct);
      const L_norm = normLatest(stock.latest);
      const C_norm = normChangePct(stock.changePct);
  
      const composite = w1 * RC_norm + w2 * L_norm + w3 * C_norm;
  
      return { ...stock, RC_norm, L_norm, C_norm, composite };
    });
  
    // Sort descending by composite score
    return scoredData.sort((a, b) => b.composite - a.composite).slice(0, 20);
  }
}
