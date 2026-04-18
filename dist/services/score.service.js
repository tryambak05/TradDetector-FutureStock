"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScoredStocks = getScoredStocks;
const stats_1 = require("../utils/stats");
function getScoredStocks(stocks) {
    const avgList = stocks.map(s => Number(s.avgInOI));
    const rankList = stocks.map(s => Number(s.rankChangePct));
    const changeList = stocks.map(s => Number(s.changePct));
    const mean_avg = (0, stats_1.calculateMean)(avgList);
    const mean_rank = (0, stats_1.calculateMean)(rankList);
    const mean_change = (0, stats_1.calculateMean)(changeList);
    const std_avg = (0, stats_1.calculateStdDev)(avgList, mean_avg);
    const std_rank = (0, stats_1.calculateStdDev)(rankList, mean_rank);
    const std_change = (0, stats_1.calculateStdDev)(changeList, mean_change);
    return stocks
        .map(s => {
        const z_avg = (0, stats_1.calculateZScore)(Number(s.avgInOI), mean_avg, std_avg);
        // invert rank (lower is better)
        const z_rank = -1 * (0, stats_1.calculateZScore)(Number(s.rankChangePct), mean_rank, std_rank);
        const z_change = (0, stats_1.calculateZScore)(Number(s.changePct), mean_change, std_change);
        const score = (0.4 * z_avg) + (0.3 * z_rank) + (0.3 * z_change);
        return Object.assign(Object.assign({}, s), { score: Number(score.toFixed(2)) });
    })
        .sort((a, b) => (b.score - a.score));
}
