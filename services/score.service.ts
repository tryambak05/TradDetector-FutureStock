import { StockItem } from "../types/stock-items.type";
import { calculateMean, calculateStdDev, calculateZScore } from "../utils/stats";

export function getScoredStocks(stocks: StockItem[]): StockItem[] {
  const avgList = stocks.map(s => Number(s.avgInOI));
  const rankList = stocks.map(s => Number(s.rankChangePct));
  const changeList = stocks.map(s => Number(s.changePct));

  const mean_avg = calculateMean(avgList);
  const mean_rank = calculateMean(rankList);
  const mean_change = calculateMean(changeList);

  const std_avg = calculateStdDev(avgList, mean_avg);
  const std_rank = calculateStdDev(rankList, mean_rank);
  const std_change = calculateStdDev(changeList, mean_change);

  return stocks
    .map(s => {
      const z_avg = calculateZScore(Number(s.avgInOI), mean_avg, std_avg);

      // invert rank (lower is better)
      const z_rank = -1 * calculateZScore(Number(s.rankChangePct), mean_rank, std_rank);

      const z_change = calculateZScore(Number(s.changePct), mean_change, std_change);

      const score = (0.4 * z_avg) + (0.3 * z_rank) + (0.3 * z_change);

      return { ...s, score: Number(score.toFixed(2)) };
    })
    .sort((a, b) => (b.score! - a.score!));
}