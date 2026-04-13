import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";
import { exec } from "node:child_process";

import { AngleOne } from "./angleone";
import { StockReport, StockTracker } from "./stocktracker";
import { OptionChain } from "./models/optionchain.model";
import { GetCandleDataRequest } from "./models/getCandleData.request.model";
import { GetLTPDataRequest } from "./models/getLtpData.request.model";
import { TradBook } from "./models/tradbook.model";
import { CandleTimeFrame } from "./models/candleTimeFrame.model";
import { Candle, CandlestickAnatomy } from "./models/candle.model";
import { TradConfig } from "./models/tradconfig.model";
import { TOTP } from "totp-generator";
import { json } from "node:stream/consumers";
import { GainersLosersEnum } from "./models/gainersLosersEnum.model";
import { GainersLosers, TradingSideEnum } from "./models/gainersLosers.model";
import { Console } from "node:console";
import { NseScraper } from "./nse";
import { MarketStock } from "./models/market-data.model";
import { StockData } from "./models/stock.model";
import { updateFixedStockLogHTML } from "./htmllog";
import { logDataToDailyFile } from "./logger";

var cron = require("node-cron");
// var EventLogger = require("node-windows").EventLogger;
// var log = new EventLogger("Trad Detector");

// log.info('Basic information.');
// log.warn('Watch out!');
// log.error('Something went wrong.');

var LocalStorage = require("node-localstorage").LocalStorage,
  localStorage = new LocalStorage("./scratch");
var angleOne = new AngleOne();
var stockTracker = null;

var TOTPTOKEN = 0;
const twoPm = new Date();
twoPm.setHours(14, 0, 0, 0);

let timeCount = 0;

var openingCE = "";
var openingPE = "";

var bigSpikeDobleStar = "";
var prevMinTimeScan = "";

var isRun = true;

//================================================
// ONLY CHANGE BELOW SETTING FOR TESTING
//================================================

var isTest = false;
var strikeTest = 24000; // | 10500 | 47100
var fromdate = "2025-09-05 10:35";
var todate = "2025-09-05 10:50";
var isBankex = false;

//==================================================

const wss = new WebSocket.Server({ port: isTest ? 226 : 503 });

// create web socket server to send trad signal
createWebSocketServer();

var marketOpeningSignal = "09:01"; // Need to change 09:01
var marketClosing = "15:59"; // Need to change 15:31

var allTimeRunCronJob = "*/2 * * * *";
var marketTimeRunCronJob = "*/5 9-15 * * 1-5";
var diwaliTradingRunCronJob = "*/5 18-19 * * 1-5"; // Need to change

cron.schedule(
  isTest ? allTimeRunCronJob : marketTimeRunCronJob,
  async () => {
    // GENERATE TOKEN EVERY DAY AT ONCE
    if (!localStorage.getItem("FirstRun")) {
      angleOne.firstRun();
      AngleOne.clearToken();
      timeCount = 0;
      // END
    } else if (
      angleOne.getDateFormat(new Date().toString()) !=
      localStorage.getItem("FirstRun")
    ) {
      AngleOne.clearToken();
      timeCount = 0;
      localStorage.removeItem("FirstRun");
      localStorage.removeItem("TradSignal");
      angleOne.firstRun();
    }

    // END GENERATE TOKEN EVERY DAY AT ONCE

    //run();
    let isRunMarketTime = runMarketTime();

    if (isRunMarketTime) {
      await runUnderlyingOI();
    }

    // creates a server by passing the port number
    console.log(
      "Running trad bot " +
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
  },
  {
    timezone: "Asia/Kolkata", // Set IST timezone
  }
);

//run();

function run() {
  var candleTimeFrame: CandleTimeFrame = new CandleTimeFrame();
  candleTimeFrame = AngleOne.customFormatDateIST(5, 15);

  if (isTest) {
    candleTimeFrame.fromdate = fromdate;
    candleTimeFrame.todate = todate;
  }

  console.log(candleTimeFrame);

  var setTimeoutTime = 0;

  //================================= START FUTURE STOCK SCAN ALL INDICES =========================================================

  if (isRun) {
    setTimeoutTime = setTimeoutTime == 0 ? 1000 : setTimeoutTime + 1000;
    setTimeout(() => {
      // FutureStockNSEScan(candleTimeFrame).then(() => {});
    }, setTimeoutTime);
  }

  //================================= END FUTURE STOCK SCAN ALL INDICES =========================================================
}

async function runUnderlyingOI() {
  const scraper = new NseScraper();
  let latestStock: StockData[] = await scraper.fetchUnderlyingsOI();

  if (latestStock as StockData[]) {
    if ((!AngleOne.localStorageGet("StockOIData") && timeCount == 0) || timeCount == 1) {
      AngleOne.localStorageClear("StockOIData");

      let latestStockJson = JSON.stringify(latestStock);
      AngleOne.localStorageSet("StockOIData", latestStockJson);
    }

    timeCount = timeCount + 1;

    let baseStockData = JSON.parse(
      AngleOne.localStorageGet("StockOIData")
    ) as StockData[];

    const outputDir = "/var/www/html/tradingviewui/assets/";
    const stockTracker = new StockTracker(baseStockData);

    const sorted = await stockTracker.compareWithBaseline(latestStock);

    const mappedData: StockReport[] = sorted.map((s) => ({
      id: s.baseRank,
      symbol: s.symbol,
      avgInOI: parseFloat(s.avgInOI.toFixed(2)),
      changeInOI: parseFloat(s.changeInOI.toFixed(2)),
      latestOI: parseFloat(s.latestOI.toFixed(2)),
      latestRank: parseFloat(s.latestRank.toFixed(2)),
      rankChangePct: parseFloat(s.rankChangePct.toFixed(2)),
      baseline: baseStockData.find((b) => b.symbol === s.symbol)?.volume || 0,
      latest: s.volume,
      changePct: parseFloat(s.volumeChangePct.toFixed(2)),
      score: s.rankChangePct * 1 + s.volumeChangePct * 0.01, // initial placeholder
      baselineVolume: baseStockData.find((b) => b.symbol === s.symbol)?.volume,
      volume: s.volume,
      volumeChangePct: s.volumeChangePct,
    }));

    const scoredStocks = stockTracker.calculateTopStocks(mappedData);
    console.table(scoredStocks); // top 20

    let stockItems = sorted
      .map((s) => ({
        id: s.baseRank,
        symbol: s.symbol,
        avgInOI: s.avgInOI,
        changeInOI: s.changeInOI,
        latestOI: s.latestOI,
        latestRank: s.latestRank,
        rankChangePct: parseFloat(s.rankChangePct.toFixed(2)),
        baseline: baseStockData.find((b) => b.symbol === s.symbol)?.volume || 0,
        latest: s.volume,
        changePct: parseFloat(s.volumeChangePct.toFixed(2)),
        score: parseFloat(
          (s.rankChangePct * 1 + s.volumeChangePct * 0.01).toFixed(2)
        ),
      }))
      .sort((a: any, b: any) => a.rankChangePct - b.rankChangePct);

    if (stockItems.length > 0) {
      await updateFixedStockLogHTML(stockItems, scoredStocks, outputDir);

      try {
        logDataToDailyFile(stockItems);
      } catch (error) {
        console.log("error in log file");
      }
    }
  }
}

// function FutureStockNSEScan(candleTimeFrame: CandleTimeFrame): Promise<string> {
//   return new Promise(async function (resolve, reject) {
//     //
//     // AngleOne.clearToken();
//     if (!localStorage.getItem("TradToken")) {
//       const { otp } = TOTP.generate("TMH5PBEMKAVXEH7RJZPR6GE36A", {
//         digits: 6,
//       });
//       TOTPTOKEN = parseInt(otp);
//       console.log(`TOTP ${TOTPTOKEN}`);
//     }

//     var tradConfig = AngleOne.getTradConfig(TOTPTOKEN);
//     angleOne.generateToken(tradConfig);
//     angleOne.getSymbolByStocks();

//     let allSymbol = JSON.parse(localStorage.getItem("AllSymbol")) as TradBook[];

//     const scraper = new NseScraper();
//     let latestStock: StockData[] = await scraper.fetchUnderlyingsOI();

//     if (latestStock as StockData[]) {
//       if (!AngleOne.localStorageGet("StockOIData")) {
//         AngleOne.localStorageClear("StockOIData");
//         AngleOne.localStorageSet("StockOIData", latestStock);
//       }

//       let baseStockData = JSON.parse(
//         AngleOne.localStorageGet("StockOIData")
//       ) as StockData[];
//       const sorted = new StockTracker(baseStockData).compareWithBaseline(
//         latestStock
//       );

//       console.table(
//         sorted.map((s) => ({
//           symbol: s.symbol,
//           baseline: baseStockData.find((b) => b.symbol === s.symbol)?.volume,
//           latest: s.volume,
//           changePct: s.volumeChangePct.toFixed(2) + "%",
//         }))
//       );

//       const outputDir = "/var/www/html/tradingviewui/assets/";

//       await updateFixedStockLogHTML(
//         sorted.map((s) => ({
//           symbol: s.symbol,
//           baseline: baseStockData.find((b) => b.symbol === s.symbol)?.volume,
//           latest: s.volume,
//           changePct: s.volumeChangePct.toFixed(2) + "%",
//         })),
//         outputDir
//       );

//       // TODO - Trupti factor calculation
//       // await processMarketStocks(
//       //   tradConfig,
//       //   candleTimeFrame,
//       //   allSymbol,
//       //   latestStock
//       // );
//     } else {
//       console.log("Nse data not found.");
//     }
//   });
// }

function FutureStockNSEScanByGainerAndLosser(
  candleTimeFrame: CandleTimeFrame
): Promise<string> {
  return new Promise(async function (resolve, reject) {
    //
    // AngleOne.clearToken();
    if (!localStorage.getItem("TradToken")) {
      const { otp } = TOTP.generate("TMH5PBEMKAVXEH7RJZPR6GE36A", {
        digits: 6,
      });
      TOTPTOKEN = parseInt(otp);
      console.log(`TOTP ${TOTPTOKEN}`);
    }

    var tradConfig = AngleOne.getTradConfig(TOTPTOKEN);
    angleOne.generateToken(tradConfig);
    angleOne.getSymbolByStocks();

    let percPriceGainers = await angleOne.gainersLosers(
      localStorage.getItem("TradToken"),
      tradConfig,
      GainersLosersEnum.PercPriceGainers
    );

    let percPriceLosers = await angleOne.gainersLosers(
      localStorage.getItem("TradToken"),
      tradConfig,
      GainersLosersEnum.PercPriceLosers
    );

    angleOne.getFutureStocks().then((tradBooks: any) => {
      if (tradBooks as TradBook[]) {
        var tradBookCollection = tradBooks as TradBook[];

        var value = 500;
        var count = 0;
        while (value <= tradBookCollection.length * 500) {
          loopCashTrad(
            value,
            count,
            tradConfig,
            candleTimeFrame,
            tradBookCollection,
            percPriceGainers,
            percPriceLosers
          );
          value = value + 500;
          count = count + 1;
        }
      }
    });
  });
}

function loopCashTrad(
  value: number,
  count: number,
  tradConfig: TradConfig,
  candleTimeFrame: CandleTimeFrame,
  tradBook: TradBook[],
  percPriceGainers: any,
  percPriceLosers: any
) {
  setTimeout(() => {
    // Declare
    var selectedTreadBookStrik: TradBook = new TradBook();

    // Select Strick Price From Option Chain
    selectedTreadBookStrik.symbol = tradBook[count].symbol;
    selectedTreadBookStrik.token = tradBook[count].token;
    var exch_seg = tradBook[count].exch_seg;
    var stockName = tradBook[count].name;

    console.log(count + " " + selectedTreadBookStrik.symbol);

    var getCandleDataStrikeRequest = new GetCandleDataRequest();
    getCandleDataStrikeRequest.exchange = exch_seg;
    getCandleDataStrikeRequest.symboltoken = selectedTreadBookStrik.token;
    getCandleDataStrikeRequest.interval = "FIVE_MINUTE";
    getCandleDataStrikeRequest.fromdate = candleTimeFrame.fromdate;
    getCandleDataStrikeRequest.todate = candleTimeFrame.todate;

    angleOne
      .readCandleData(
        localStorage.getItem("TradToken"),
        tradConfig,
        getCandleDataStrikeRequest
      )
      .then((candleData: any) => {
        try {
          if (candleData[0] != undefined) {
            const nineFifteenCandles = candleData.filter((candle) =>
              candle[0].endsWith("T09:15:00+05:30")
            );

            if (nineFifteenCandles.length > 0) {
              var candleDayFirst5min = new Candle();
              candleDayFirst5min.date = nineFifteenCandles[0][0];
              candleDayFirst5min.open = nineFifteenCandles[0][1];
              candleDayFirst5min.high = nineFifteenCandles[0][2];
              candleDayFirst5min.low = nineFifteenCandles[0][3];
              candleDayFirst5min.close = nineFifteenCandles[0][4];
              candleDayFirst5min.volume = nineFifteenCandles[0][5];
              candleDayFirst5min.candlestickAnatomy = Candle.setCandleAnatomy(
                candleDayFirst5min.open,
                candleDayFirst5min.close
              );
            }

            var candleFirst = new Candle();
            candleFirst.date = candleData[candleData.length - 4][0];
            candleFirst.open = candleData[candleData.length - 4][1];
            candleFirst.high = candleData[candleData.length - 4][2];
            candleFirst.low = candleData[candleData.length - 4][3];
            candleFirst.close = candleData[candleData.length - 4][4];
            candleFirst.volume = candleData[candleData.length - 4][5];
            candleFirst.candlestickAnatomy = Candle.setCandleAnatomy(
              candleFirst.open,
              candleFirst.close
            );

            var candleSecond = new Candle();
            candleSecond.date = candleData[candleData.length - 3][0];
            candleSecond.open = candleData[candleData.length - 3][1];
            candleSecond.high = candleData[candleData.length - 3][2];
            candleSecond.low = candleData[candleData.length - 3][3];
            candleSecond.close = candleData[candleData.length - 3][4];
            candleSecond.volume = candleData[candleData.length - 3][5];
            candleSecond.candlestickAnatomy = Candle.setCandleAnatomy(
              candleSecond.open,
              candleSecond.close
            );

            var candleThird = new Candle();
            candleThird.date = candleData[candleData.length - 2][0];
            candleThird.open = candleData[candleData.length - 2][1];
            candleThird.high = candleData[candleData.length - 2][2];
            candleThird.low = candleData[candleData.length - 2][3];
            candleThird.close = candleData[candleData.length - 2][4];
            candleThird.volume = candleData[candleData.length - 2][5];
            candleThird.candlestickAnatomy = Candle.setCandleAnatomy(
              candleThird.open,
              candleThird.close
            );

            var candleFourth = new Candle();
            candleFourth.date = candleData[candleData.length - 1][0];
            candleFourth.open = candleData[candleData.length - 1][1];
            candleFourth.high = candleData[candleData.length - 1][2];
            candleFourth.low = candleData[candleData.length - 1][3];
            candleFourth.close = candleData[candleData.length - 1][4];
            candleFourth.volume = candleData[candleData.length - 1][5];
            candleFourth.candlestickAnatomy = Candle.setCandleAnatomy(
              candleFourth.open,
              candleFourth.close
            );

            // Strategy 1 :
            if (
              candleFourth.candlestickAnatomy == CandlestickAnatomy.Bullish &&
              candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
              candleSecond.candlestickAnatomy == CandlestickAnatomy.Bullish
            ) {
              if (
                candleSecond.volume < candleThird.volume &&
                candleThird.volume < candleFourth.volume &&
                (candleThird.close == candleThird.high ||
                  candleThird.open == candleThird.low)
              ) {
                sendCustomMessage(
                  `104  ↥ Buy | *** | ${stockName} | [${candleTimeFrame.todate}]`
                );
              }
            }

            if (
              candleFourth.candlestickAnatomy == CandlestickAnatomy.Bearish &&
              candleThird.candlestickAnatomy == CandlestickAnatomy.Bearish &&
              candleSecond.candlestickAnatomy == CandlestickAnatomy.Bearish
            ) {
              if (
                candleSecond.volume < candleThird.volume &&
                candleThird.volume < candleFourth.volume &&
                (candleThird.close == candleThird.low ||
                  candleThird.open == candleThird.high)
              ) {
                sendCustomMessage(
                  `104  ↧ Sell | *** | ${stockName} | [${candleTimeFrame.todate}]`
                );
              }
            }

            // Strategy 2:
            // if (
            //   ((candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
            //     candleThird.close == candleThird.high) ||
            //     (candleThird.candlestickAnatomy == CandlestickAnatomy.Bearish &&
            //       candleThird.open == candleThird.high)) &&
            //   candleFourth.candlestickAnatomy == CandlestickAnatomy.Bullish &&
            //   candleFourth.close + candleFourth.open / 2 >= candleThird.high
            // ) {
            //   sendCustomMessage(
            //     `2     ↥ Buy | ${stockName} | [${candleTimeFrame.todate}]`
            //   );
            // } else if (
            //   ((candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
            //     candleThird.open == candleThird.low) ||
            //     (candleThird.candlestickAnatomy == CandlestickAnatomy.Bearish &&
            //       candleThird.close == candleThird.low)) &&
            //   candleFourth.candlestickAnatomy == CandlestickAnatomy.Bearish &&
            //   candleFourth.open + candleFourth.close / 2 <= candleThird.low
            // ) {
            //   sendCustomMessage(
            //     `2     ↧ Sell | ${stockName} | [${candleTimeFrame.todate}]`
            //   );
            // }

            // Strategy 3:
            // Buy 50 % candleFourth.close + candleFourth.open / 2 >= candleThird.high

            var bullishThreShold =
              candleFourth.close +
              0.786 * (candleFourth.open - candleFourth.close);

            var bearishThreShold =
              candleFourth.close +
              (candleFourth.open - candleFourth.close) * 0.786;

            if (
              candleFourth.candlestickAnatomy == CandlestickAnatomy.Bullish &&
              candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
              candleSecond.candlestickAnatomy == CandlestickAnatomy.Bullish &&
              bullishThreShold >= candleThird.close &&
              candleFourth.volume > candleThird.volume &&
              candleThird.volume > candleSecond.volume
            ) {
              console.log(`Signal:43 Buy Stock name : ${stockName}`);
              console.log(JSON.stringify(percPriceGainers));

              const isStockExists = includesAny(stockName, percPriceGainers);

              if (isStockExists) {
                sendCustomMessage(
                  `43    ↥ Buy | ${stockName} | ${isStockExists}| [${candleTimeFrame.todate}]`
                );
              }
            } else if (
              ((candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
                bearishThreShold <= candleThird.open) ||
                (candleThird.candlestickAnatomy == CandlestickAnatomy.Bearish &&
                  bearishThreShold <= candleThird.close)) &&
              candleFourth.candlestickAnatomy == CandlestickAnatomy.Bearish &&
              candleFourth.volume > candleThird.volume &&
              candleThird.volume > candleSecond.volume
            ) {
              console.log(`Signal:43 Sell Stock name : ${stockName}`);
              console.log(JSON.stringify(percPriceGainers));
              const isStockExists = includesAny(stockName, percPriceLosers);
              if (isStockExists) {
                sendCustomMessage(
                  `43    ↧ Sell | ${stockName} | ${isStockExists}| [${candleTimeFrame.todate}]`
                );
              }
            }
          } else {
            console.log("Candle data not found.");
          }
        } catch (e) {
          console.log(e);
        }

        // END
      })
      .catch((reason: any) => {
        console.log("ERROR FOUND: loop() method");
        //console.log(reason);
      });
  }, value);
}

async function loopStockScanner(
  count: number,
  tradConfig: TradConfig,
  candleTimeFrame: CandleTimeFrame,
  tradBook: TradBook[],
  gainersLosersCollection: StockData[]
): Promise<void> {
  // Selected book
  let selectedTreadBookStrik = new TradBook();

  const stockName = gainersLosersCollection[count].symbol;
  const tradingSide =
    gainersLosersCollection[count].volume > 0
      ? TradingSideEnum.Buy
      : TradingSideEnum.Sell;

  console.log(
    `${
      tradingSide === TradingSideEnum.Buy ? "BUY" : "SELL"
    } | ${count} ${stockName}`
  );

  // prepare candle data request
  const getCandleDataStrikeRequest = new GetCandleDataRequest();

  // try match TradBook
  const tradBookMatch = tradBook.find(
    (item) => item.symbol === `${stockName}-EQ`
  );

  if (tradBookMatch) {
    selectedTreadBookStrik.token = tradBookMatch.token;
    selectedTreadBookStrik.exch_seg = tradBookMatch.exch_seg;
  } else {
    console.log("No match found.");
  }

  getCandleDataStrikeRequest.exchange = selectedTreadBookStrik.exch_seg;
  getCandleDataStrikeRequest.symboltoken = selectedTreadBookStrik.token;
  getCandleDataStrikeRequest.interval = "FIVE_MINUTE";
  getCandleDataStrikeRequest.fromdate = candleTimeFrame.fromdate;
  getCandleDataStrikeRequest.todate = candleTimeFrame.todate;

  try {
    const candleData: any = await angleOne.readCandleData(
      localStorage.getItem("TradToken"),
      tradConfig,
      getCandleDataStrikeRequest
    );

    if (!candleData || candleData.length < 4) {
      console.log("Candle data not found.");
      return;
    }

    // helper to convert array → Candle
    const makeCandle = (data: any[]): Candle => {
      const candle = new Candle();
      candle.date = data[0];
      candle.open = data[1];
      candle.high = data[2];
      candle.low = data[3];
      candle.close = data[4];
      candle.volume = data[5];
      candle.candlestickAnatomy = Candle.setCandleAnatomy(
        candle.open,
        candle.close
      );
      return candle;
    };

    const candleFirst = makeCandle(candleData[candleData.length - 4]);
    const candleSecond = makeCandle(candleData[candleData.length - 3]);
    const candleThird = makeCandle(candleData[candleData.length - 2]);
    const candleFourth = makeCandle(candleData[candleData.length - 1]);

    // ✅ here put all your trading logic checks exactly as before
    // Example:
    if (
      tradingSide === TradingSideEnum.Buy &&
      candleThird.candlestickAnatomy === CandlestickAnatomy.Bullish &&
      candleFourth.candlestickAnatomy === CandlestickAnatomy.Bullish &&
      candleFourth.close >= candleThird.high
    ) {
      console.log(`Signal:102 Buy Stock name : ${stockName}`);
      sendCustomMessage(
        `102 ↥ Buy | ${stockName} | [${candleTimeFrame.todate}]`
      );
    }

    // 👉 repeat/optimize other conditions similarly
  } catch (err) {
    console.error("ERROR FOUND: loop() method", err);
  }
}

async function processMarketStocks(
  tradConfig: TradConfig,
  candleTimeFrame: CandleTimeFrame,
  allSymbol: TradBook[],
  marcketStock: StockData[]
): Promise<void> {
  const delay = 500; // 500ms between calls

  for (let count = 0; count < marcketStock.length; count++) {
    await loopStockScanner(
      count,
      tradConfig,
      candleTimeFrame,
      allSymbol,
      marcketStock
    );

    // wait 500ms before next iteration
    if (count < marcketStock.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

const fetchAllGainersLosers = async (
  token: string,
  tradConfig: TradConfig,
  types: GainersLosersEnum[]
): Promise<GainersLosers[]> => {
  const finalList: GainersLosers[] = [];

  for (let type of types) {
    try {
      const result = await angleOne.gainersLosers(token, tradConfig, type);

      // Set tradingSide based on type
      const updated = result.map((item) => {
        if (type === GainersLosersEnum.PercPriceGainers) {
          item.tradingSide = TradingSideEnum.Buy;
        } else if (type === GainersLosersEnum.PercPriceLosers) {
          item.tradingSide = TradingSideEnum.Sell;
        }
        return item;
      });

      finalList.push(...updated);
      console.log(
        `Fetched ${GainersLosersEnum[type]}: ${updated.length} entries`
      );
    } catch (err) {
      console.error(`Failed for ${GainersLosersEnum[type]}:`, err);
    }

    await wait(1000); // Respect API threshold
  }

  return finalList;
};

// Websocket methods
function sendCustomMessage(message) {
  if (message) {
    var currentTradSignal = localStorage.getItem("TradSignal");
    angleOne.setTradSignal(message + "\n" + currentTradSignal);
  } else {
    message = localStorage.getItem("TradSignal");
  }

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function createWebSocketServer() {
  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    sendCustomMessage("");

    ws.on("message", (message: string) => {
      console.log(`Received message: ${message}`);
      ws.send(`Server received your message: ${message}`);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

function CandleBelow9EMA(candleData: any, candleIndex: any) {
  var close = 0;
  var tillScan = 9 + candleIndex;
  for (var i = candleIndex; i < tillScan; i++) {
    close = close + candleData[candleData.length - i][4];
  }

  close = close / 9;

  return close;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function includesAny(searchString: string, items: string[]): boolean {
  for (const item of items) {
    if (searchString.includes(item)) {
      return true; // return early if a match is found
    }
  }
  return false; // no match found
}

function comment() {
  // var bullishThreShold =
  //   candleThird.close + 0.786 * (candleThird.open - candleThird.close);
  // var bearishThreShold =
  //   candleThird.close + (candleThird.open - candleThird.close) * 0.786;
  // if (
  //   candleFourth.candlestickAnatomy == CandlestickAnatomy.Bullish &&
  //   candleThird.candlestickAnatomy == CandlestickAnatomy.Bullish &&
  //   candleSecond.candlestickAnatomy == CandlestickAnatomy.Bullish &&
  //   Number(bullishThreShold.toFixed(2)) >= candleSecond.high &&
  //   candleThird.open >= candleSecond.high &&
  //   candleFourth.volume > candleThird.volume &&
  //   candleThird.volume > candleSecond.volume
  // ) {
  //   let isStrong =
  //     candleSecond.high == candleSecond.close &&
  //     candleThird.open >= candleSecond.close;
  //   console.log(`Signal:43 Buy Stock name : ${stockName}`);
  //   sendCustomMessage(
  //     `${isStrong ? 104 : 43}    ↥ Buy | ${stockName} | [${
  //       candleTimeFrame.todate
  //     }]`
  //   );
  // } else if (
  //   candleFourth.candlestickAnatomy == CandlestickAnatomy.Bearish &&
  //   candleThird.candlestickAnatomy == CandlestickAnatomy.Bearish &&
  //   candleSecond.candlestickAnatomy == CandlestickAnatomy.Bearish &&
  //   Number(bearishThreShold.toFixed(2)) <= candleSecond.low &&
  //   candleThird.open <= candleSecond.low &&
  //   candleFourth.volume > candleThird.volume &&
  //   candleThird.volume > candleSecond.volume
  // ) {
  //   let isStrong =
  //     candleSecond.low == candleSecond.close &&
  //     candleThird.open <= candleSecond.close;
  //   console.log(`Signal:43 Sell Stock name : ${stockName}`);
  //   sendCustomMessage(
  //     `${isStrong ? 104 : 43}    ↧ Sell | ${stockName} | [${
  //       candleTimeFrame.todate
  //     }]`
  //   );
  // }
}
// End Websocket methods
function runMarketTime(): boolean {
  const now = new Date();

  // Convert to IST manually
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();

  const startMinutes = 9 * 60 + 15; // 09:15
  const endMinutes = 15 * 60 + 30; // 15:30

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    console.log("✅ Running function:", istTime);
    return true;
  } else {
    console.log("⛔ Outside allowed time:", istTime);
    return false;
  }
}
