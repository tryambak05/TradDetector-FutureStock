"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockTracker = void 0;
class StockTracker {
    constructor(baseline) {
        baseline.forEach((item, index) => {
            item.id = index + 1;
        });
        this.baseline = baseline;
    }
    compareWithBaseline(latest) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const result = latest.map((latestStock) => {
                const baseStock = this.baseline.find((b) => b.symbol === latestStock.symbol);
                let volumeChangePct = 0;
                if (baseStock && baseStock.volume > 0) {
                    volumeChangePct =
                        ((latestStock.volume - baseStock.volume) / baseStock.volume) * 100;
                }
                let baseRank = 0;
                let latestRank = 0;
                let rankChangePct = 0;
                if ((baseStock === null || baseStock === void 0 ? void 0 : baseStock.id) > 0 && latestStock.id > 0) {
                    baseRank = baseStock.id;
                    latestRank = latestStock.id;
                    rankChangePct =
                        ((latestStock.id - baseStock.id) / baseStock.id) * 100;
                }
                return Object.assign(Object.assign({}, latestStock), { volumeChangePct,
                    baseRank,
                    latestRank,
                    rankChangePct });
            });
            // Sort by rankChangePct (ascending)
            const sorted = result.sort((a, b) => parseFloat(a.rankChangePct.toFixed(2)) - parseFloat(b.rankChangePct.toFixed(2)));
            return sorted;
        });
    }
    calculateTopStocks(dataAll) {
        const w1 = 0.10; // weight for rankChangePct
        const w2 = 0.60; // weight for latest
        const w3 = 0.30; // weight for changePct
        let data = dataAll.slice(0, 50);
        const rcMin = Math.min(...data.map(s => s.rankChangePct));
        const rcMax = Math.max(...data.map(s => s.rankChangePct));
        const latestMin = Math.min(...data.map(s => s.latest));
        const latestMax = Math.max(...data.map(s => s.latest));
        const chgMin = Math.min(...data.map(s => s.changePct));
        const chgMax = Math.max(...data.map(s => s.changePct));
        function normRankChange(rc) {
            return (rcMax - rc) / (rcMax - rcMin);
        }
        function normLatest(latest) {
            return (latest - latestMin) / (latestMax - latestMin);
        }
        function normChangePct(chg) {
            return (chg - chgMin) / (chgMax - chgMin);
        }
        const scoredData = data.map(stock => {
            const RC_norm = normRankChange(stock.rankChangePct);
            const L_norm = normLatest(stock.latest);
            const C_norm = normChangePct(stock.changePct);
            const composite = w1 * RC_norm + w2 * L_norm + w3 * C_norm;
            return Object.assign(Object.assign({}, stock), { RC_norm, L_norm, C_norm, composite });
        });
        // Sort descending by composite score
        return scoredData.sort((a, b) => b.composite - a.composite).slice(0, 20);
    }
}
exports.StockTracker = StockTracker;
