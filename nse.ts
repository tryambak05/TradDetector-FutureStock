import puppeteer from "puppeteer";
import { MarketStock } from "./models/market-data.model";
import { StockData, StockDataResponse } from "./models/stock.model";

export class NseScraper {
  async fetchGainersAndLosers(): Promise<MarketStock[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/114 Safari/537.36"
      );

      // --- Losers listener
      const losersPromise = new Promise<any>((resolve, reject) => {
        page.on("response", async (response) => {
          const url = response.url();
          if (url.includes("/api/live-analysis-variations?index=loosers")) {
            try {
              const json = await response.json();
              resolve(json);
            } catch (err) {
              reject(err);
            }
          }
        });
      });

      // --- Gainers listener
      const gainersPromise = new Promise<any>((resolve, reject) => {
        page.on("response", async (response) => {
          const url = response.url();
          if (url.includes("/api/live-analysis-variations?index=gainers")) {
            try {
              const json = await response.json();
              resolve(json);
            } catch (err) {
              reject(err);
            }
          }
        });
      });

      // Navigate to NSE page
      await page.goto(
        "https://www.nseindia.com/market-data/top-gainers-losers",
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      );

      // Wait max 15s for losers and gainers
      const losersData = await Promise.race([
        losersPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: losers API not captured")),
            15000
          )
        ),
      ]);

      const gainersData = await Promise.race([
        gainersPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: gainers API not captured")),
            15000
          )
        ),
      ]);

      console.log("✅ Losers JSON:", losersData);
      console.log("✅ Gainers JSON:", gainersData);

      // Combine both arrays (assuming data is inside `data` field)
      const losersArr: MarketStock[] = losersData?.FOSec?.data || [];
      const gainersArr: MarketStock[] = gainersData?.FOSec?.data || [];
      const combined = [...losersArr, ...gainersArr];

      return combined;
    } catch (err) {
      console.error("❌ Error fetching market data:", err);
      return [];
    } finally {
      await browser.close();
    }
  }

  async fetchUnderlyingsOI(): Promise<StockData[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/114 Safari/537.36"
      );

      // --- underlyings OI listener
      const underlyingsOIPromise = new Promise<any>((resolve, reject) => {
        page.on("response", async (response) => {
          const url = response.url();
          if (url.includes("/api/live-analysis-oi-spurts-underlyings")) {
            try {
              const json = await response.json();
              resolve(json);
            } catch (err) {
              reject(err);
            }
          }
        });
      });

      // Navigate to NSE page
      await page.goto(
        "https://www.nseindia.com/market-data/oi-spurts",
        {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }
      );

      const underlyingsOIData = await Promise.race([
        underlyingsOIPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: underlyingsOI API not captured")),
            15000
          )
        ),
      ]);

      console.log("✅ Underlyings OI JSON:", underlyingsOIData);

      // Combine both arrays (assuming data is inside `data` field)
      const underlyingsOIArr: StockData[] = underlyingsOIData?.data || [];

      return underlyingsOIArr;
    } catch (err) {
      console.error("❌ Error fetching market data:", err);
      return [];
    } finally {
      await browser.close();
    }
  }
}

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
