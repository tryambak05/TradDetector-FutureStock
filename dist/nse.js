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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NseScraper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
class NseScraper {
    fetchGainersAndLosers() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const browser = yield puppeteer_1.default.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            try {
                const page = yield browser.newPage();
                yield page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/114 Safari/537.36");
                // --- Losers listener
                const losersPromise = new Promise((resolve, reject) => {
                    page.on("response", (response) => __awaiter(this, void 0, void 0, function* () {
                        const url = response.url();
                        if (url.includes("/api/live-analysis-variations?index=loosers")) {
                            try {
                                const json = yield response.json();
                                resolve(json);
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    }));
                });
                // --- Gainers listener
                const gainersPromise = new Promise((resolve, reject) => {
                    page.on("response", (response) => __awaiter(this, void 0, void 0, function* () {
                        const url = response.url();
                        if (url.includes("/api/live-analysis-variations?index=gainers")) {
                            try {
                                const json = yield response.json();
                                resolve(json);
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    }));
                });
                // Navigate to NSE page
                yield page.goto("https://www.nseindia.com/market-data/top-gainers-losers", {
                    waitUntil: "domcontentloaded",
                    timeout: 60000,
                });
                // Wait max 15s for losers and gainers
                const losersData = yield Promise.race([
                    losersPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: losers API not captured")), 15000)),
                ]);
                const gainersData = yield Promise.race([
                    gainersPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: gainers API not captured")), 15000)),
                ]);
                console.log("✅ Losers JSON:", losersData);
                console.log("✅ Gainers JSON:", gainersData);
                // Combine both arrays (assuming data is inside `data` field)
                const losersArr = ((_a = losersData === null || losersData === void 0 ? void 0 : losersData.FOSec) === null || _a === void 0 ? void 0 : _a.data) || [];
                const gainersArr = ((_b = gainersData === null || gainersData === void 0 ? void 0 : gainersData.FOSec) === null || _b === void 0 ? void 0 : _b.data) || [];
                const combined = [...losersArr, ...gainersArr];
                return combined;
            }
            catch (err) {
                console.error("❌ Error fetching market data:", err);
                return [];
            }
            finally {
                yield browser.close();
            }
        });
    }
    fetchUnderlyingsOI() {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer_1.default.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            try {
                const page = yield browser.newPage();
                yield page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/114 Safari/537.36");
                // --- underlyings OI listener
                const underlyingsOIPromise = new Promise((resolve, reject) => {
                    page.on("response", (response) => __awaiter(this, void 0, void 0, function* () {
                        const url = response.url();
                        if (url.includes("/api/live-analysis-oi-spurts-underlyings")) {
                            try {
                                const json = yield response.json();
                                resolve(json);
                            }
                            catch (err) {
                                reject(err);
                            }
                        }
                    }));
                });
                // Navigate to NSE page
                yield page.goto("https://www.nseindia.com/market-data/oi-spurts", {
                    waitUntil: "domcontentloaded",
                    timeout: 60000,
                });
                const underlyingsOIData = yield Promise.race([
                    underlyingsOIPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: underlyingsOI API not captured")), 15000)),
                ]);
                console.log("✅ Underlyings OI JSON:", underlyingsOIData);
                // Combine both arrays (assuming data is inside `data` field)
                const underlyingsOIArr = (underlyingsOIData === null || underlyingsOIData === void 0 ? void 0 : underlyingsOIData.data) || [];
                return underlyingsOIArr;
            }
            catch (err) {
                console.error("❌ Error fetching market data:", err);
                return [];
            }
            finally {
                yield browser.close();
            }
        });
    }
}
exports.NseScraper = NseScraper;
// Example usage
// (async () => {
//   const scraper = new NseScraper();
//   let marcketStock: MarketStock[] = await scraper.fetchGainersAndLosers();
//   console.log("📊 Final Combined Result:", marcketStock);
// })();
// (async () => {
//   const scraper = new NseScraper();
//   let marcketStock: StockData[] = await scraper.fetchUnderlyingsOI();
//   console.log("📊 Final Result:", marcketStock);
// })();
