import axios from "axios";

import { GetCandleDataResponse } from "./models/getCandleData.response.model";
import { CandleTimeFrame } from "./models/candleTimeFrame.model";
import { CandlePatternTrad } from "./models/candlePatternTrad";
import { GetCandleDataRequest } from "./models/getCandleData.request.model";
import { Candle } from "./models/candle.model";
import { GetLTPDataRequest } from "./models/getLtpData.request.model";
import { TradBook } from "./models/tradbook.model";
import { TradConfig } from "./models/tradconfig.model";
import { Ltp } from "./models/ltp.model";
import { AmxIndex } from "./models/amxindex.model";
import { OptionChain } from "./models/optionchain.model";
import { GainersLosersEnum } from "./models/gainersLosersEnum.model";
import { GainersLosers } from "./models/gainersLosers.model";

var LocalStorage = require("node-localstorage").LocalStorage,
  localStorage = new LocalStorage("./scratch");

export class AngleOne {
  //
  static clearToken(): void {
    localStorage.removeItem("TradToken");
    localStorage.removeItem("AllSymbol");
    localStorage.removeItem("StockOIData");
  }

  static getTradConfig(totp: number): TradConfig {
    if (!localStorage.getItem("TradConfig")) {
      return {
        clientCode: "AAAB139125",
        pin: "2810",
        localIP: "192.168.1.11",
        publicIP: "106.201.122.2",
        macAddress: "00-FF-39-0A-6B-9D",
        privateKey: "8uFHorRo", // CieY8lat
        totp: totp, // totp Need to pass
      };
    }

    return new TradConfig();
  }

  generateToken(treadingConfig: TradConfig) {
    if (!localStorage.getItem("TradToken")) {
      console.log("generating new token");
      var data = JSON.stringify({
        clientcode: treadingConfig.clientCode,
        password: treadingConfig.pin,
        totp: treadingConfig.totp,
      });

      var config = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": treadingConfig.localIP,
          "X-ClientPublicIP": treadingConfig.publicIP,
          "X-MACAddress": treadingConfig.macAddress,
          "X-PrivateKey": treadingConfig.privateKey,
        },
        data: data,
      };

      axios(config)
        .then((response: any) => {
          console.log(response.data);
          if (response.data.data) {
            localStorage.setItem("TradToken", response.data.data.jwtToken);
          }
        })
        .catch((error: any) => {
          console.log(error);
        });
    } else {
      localStorage.getItem("TradToken");
    }
  }

  firstRun() {
    if (!localStorage.getItem("FirstRun")) {
      localStorage.setItem(
        "FirstRun",
        this.getDateFormat(new Date().toString())
      );
      console.log("create first run flag");
    }
  }

  setTradSignal(signal: string) {
    localStorage.setItem("TradSignal", signal);
  }

  static localStorageClear(key: string) {
    localStorage.removeItem(key);
  }

  static localStorageSet(key: string, value: any) {
    localStorage.setItem(key, value);
  }

  static localStorageGet(key: string): any {
    return localStorage.getItem(key);
  }

  isDateInPast(dateString: string): boolean {
    // Parse the date string (dd-mm-yyyy)
    const [day, month, year] = dateString.split("-").map(Number);

    // Create a date object from parsed values
    const inputDate = new Date(year, month - 1, day); // month is zero-indexed in JavaScript Date

    // Get today's date (only the date, without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compare dates
    return inputDate < today;
  }

  getAllSymbol() {
    if (!localStorage.getItem("AllSymbol")) {
      var config = {
        method: "get",
        url: "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
      };

      axios(config)
        .then((response: any) => {
          var data = response.data as TradBook[];
          var found = data.filter((record: TradBook) => {
            return (
              record.name === "BANKNIFTY" ||
              record.name === "NIFTY" ||
              record.name === "FINNIFTY" ||
              record.name === "MIDCPNIFTY" ||
              record.name === "SENSEX" ||
              record.name === "BANKEX"
            );
          });

          var symbols = JSON.stringify(found);
          localStorage.setItem("AllSymbol", symbols);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }

  getSymbolByStocks() {
    if (!localStorage.getItem("AllSymbol")) {
      var config = {
        method: "get",
        url: "https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json",
      };

      axios(config)
        .then((response: any) => {
          var data = response.data as TradBook[];
          var found = data.filter((record: TradBook) => {
            return (
              record.expiry == "" &&
              record.exch_seg == "NSE" &&
              record.instrumenttype == ""
            );
          });

          var symbols = JSON.stringify(found);
          localStorage.setItem("AllSymbol", symbols);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }

  static AMXIndexInit(optionChainCount: number): AmxIndex[] {
    var amxIndexData: AmxIndex[] = [];

    var nifty = new AmxIndex();
    nifty.symbol = "Nifty 50";
    nifty.perlotquantity = 25;
    nifty.strikeChange = 50;
    nifty.strikeMoveNumber = (optionChainCount * 50) / 2;
    nifty.name = "NIFTY";
    amxIndexData.push(nifty);

    var banknifty = new AmxIndex();
    banknifty.symbol = "Nifty Bank";
    banknifty.perlotquantity = 15;
    banknifty.strikeChange = 100;
    banknifty.strikeMoveNumber = (optionChainCount * 100) / 2;
    banknifty.name = "BANKNIFTY";
    amxIndexData.push(banknifty);

    var finnifty = new AmxIndex();
    finnifty.symbol = "Nifty Fin Service";
    finnifty.perlotquantity = 40;
    finnifty.strikeChange = 50;
    finnifty.strikeMoveNumber = (optionChainCount * 50) / 2;
    finnifty.name = "FINNIFTY";
    amxIndexData.push(finnifty);

    var midcapnifty = new AmxIndex();
    midcapnifty.symbol = "NIFTY MID SELECT";
    midcapnifty.perlotquantity = 75;
    midcapnifty.strikeChange = 25;
    midcapnifty.strikeMoveNumber = (optionChainCount * 25) / 2;
    midcapnifty.name = "MIDCPNIFTY";
    amxIndexData.push(midcapnifty);

    return amxIndexData;
  }

  static OPTIDXIndexInit(optionChainCount: number): AmxIndex[] {
    var amxIndexData: AmxIndex[] = [];

    var sensex = new AmxIndex();
    sensex.symbol = "SENSEX";
    sensex.perlotquantity = 10;
    sensex.strikeChange = 100;
    sensex.strikeMoveNumber = (optionChainCount * 100) / 2;
    sensex.name = "SENSEX";
    amxIndexData.push(sensex);

    var bankex = new AmxIndex();
    bankex.symbol = "BANKEX";
    bankex.perlotquantity = 10;
    bankex.strikeChange = 100;
    bankex.strikeMoveNumber = (optionChainCount * 100) / 2;
    bankex.name = "BANKEX";
    amxIndexData.push(bankex);

    return amxIndexData;
  }

  getExpiryDate(amxIndexData: AmxIndex[]): Promise<OptionChain[]> {
    return new Promise((resolve, reject) => {
      var expiryDate: Date[] = [];
      var amxIndex: TradBook = new TradBook();
      var selectedCurrentExpiry: Date;

      const monthChar = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      var allSymbol = JSON.parse(localStorage.getItem("AllSymbol")!);
      let symbols = allSymbol as TradBook[];
      if (symbols) {
        var option = "NIFTY";
        var result = amxIndexData.find(
          (x: AmxIndex) => x.name == option
        ) as AmxIndex;

        allSymbol.find((value: TradBook) => {
          if (
            value.name === option &&
            value.exch_seg === "NSE" &&
            value.instrumenttype === "AMXIDX" &&
            value.symbol == result?.symbol
          ) {
            amxIndex = value;
          }
        });

        allSymbol.forEach((value: TradBook) => {
          if (
            //$$ ADD ALL INDEX
            (value.name === option &&
              value.exch_seg === "NFO" &&
              value.expiry.match("2024")) ||
            value.expiry.match("2025") ||
            value.expiry.match("2026")
          ) {
            var month = value.expiry.substring(2, 5);
            var date = new Date(
              Number(value.expiry.substring(5, 9)),
              monthChar.findIndex((element) => element == month),
              Number(value.expiry.substring(0, 2))
            );

            var found = expiryDate.find(
              (x: any) => x.toDateString() === date.toDateString()
            );

            if (!found) {
              expiryDate.push(date);
            }
          }
        });

        expiryDate.sort((a, b) => a.getTime() - b.getTime());

        if (expiryDate.length > 0) {
          selectedCurrentExpiry = expiryDate[0];
        }

        // GET AMX INDEX LTP
        var getLTPDataRequest = new GetLTPDataRequest();
        getLTPDataRequest.exchange = amxIndex.exch_seg;
        getLTPDataRequest.symboltoken = amxIndex.token;
        getLTPDataRequest.tradingsymbol = amxIndex.symbol;

        var token = localStorage.getItem("TradToken");

        AngleOne.getLTPData(
          token,
          AngleOne.getTradConfig(1234),
          getLTPDataRequest
        ).then((ltp: number) => {
          var amxLTP = ltp;

          // This is expiry "22FEB2024",
          var expiryDateFormat =
            expiryDate[0].toString().substring(8, 10) +
            selectedCurrentExpiry
              .toString()
              .substring(4, 7)
              .toLocaleUpperCase() +
            selectedCurrentExpiry.getFullYear();

          // Strike Price Symbol name "NIFTY22FEB2421100CE" | "NIFTY22FEB2421100CE"
          var expiryDateFormat2 =
            expiryDate[0].toString().substring(8, 10) +
            selectedCurrentExpiry
              .toString()
              .substring(4, 7)
              .toLocaleUpperCase() +
            selectedCurrentExpiry.getFullYear().toString().substring(2, 4);

          var optionChainData: TradBook[] = [];
          var optionChain: OptionChain[] = [];

          allSymbol.forEach((value: TradBook) => {
            if (
              value.name === option &&
              value.exch_seg === "NFO" &&
              value.expiry === expiryDateFormat
            ) {
              optionChainData.push(value);
            }
          });

          var roundStrike =
            Math.ceil(amxLTP / result.strikeChange) * result.strikeChange;

          if (roundStrike > 0) {
            // var startpoint = (result.name == "MIDCPNIFTY") ? 100 : result.strikeMoveNumber;
            var latest = roundStrike - result.strikeMoveNumber;

            for (let i = 0; i <= 10; i++) {
              let ce = new TradBook();
              let pe = new TradBook();

              optionChainData.find((value: TradBook) => {
                if (
                  value.name == option &&
                  value.exch_seg == "NFO" &&
                  value.symbol == option + expiryDateFormat2 + latest + "CE"
                ) {
                  ce = value;
                }
                if (
                  value.name == option &&
                  value.exch_seg == "NFO" &&
                  value.symbol == option + expiryDateFormat2 + latest + "PE"
                ) {
                  pe = value;
                }
              });

              var optionChainObj = new OptionChain();
              optionChainObj.ce = ce;
              optionChainObj.pe = pe;
              optionChainObj.strike = latest;
              optionChain.push(optionChainObj);

              latest = latest + result.strikeChange;
            }

            return resolve(optionChain);
          }
        });
      }
    });
  }

  getExpiryDateOptions(
    amxIndexData: AmxIndex[],
    option: string,
    expiryMidStrike: number,
    isExpiry: boolean
  ): Promise<OptionChain[]> {
    return new Promise((resolve, reject) => {
      var expiryDate: Date[] = [];
      var amxIndex: TradBook = new TradBook();
      var selectedCurrentExpiry: Date;

      const monthChar = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      var allSymbol = JSON.parse(localStorage.getItem("AllSymbol")!);
      let symbols = allSymbol as TradBook[];
      if (symbols) {
        //var option = "NIFTY";
        var result = amxIndexData.find(
          (x: AmxIndex) => x.name == option
        ) as AmxIndex;

        allSymbol.find((value: TradBook) => {
          if (
            value.name === option &&
            value.exch_seg === "NSE" &&
            value.instrumenttype === "AMXIDX" &&
            value.symbol == result?.symbol
          ) {
            amxIndex = value;
          }
        });

        allSymbol.forEach((value: TradBook) => {
          if (
            //$$ ADD ALL INDEX
            value.name === option &&
            value.exch_seg === "NFO" &&
            (value.expiry.match("2025") || value.expiry.match("2026"))
          ) {
            var month = value.expiry.substring(2, 5);
            var date = new Date(
              Number(value.expiry.substring(5, 9)),
              monthChar.findIndex((element) => element == month),
              Number(value.expiry.substring(0, 2))
            );

            var found = expiryDate.find(
              (x: any) => x.toDateString() === date.toDateString()
            );

            if (!found) {
              expiryDate.push(date);
            }
          }
        });

        expiryDate.sort((a, b) => a.getTime() - b.getTime());

        if (expiryDate.length > 0) {
          selectedCurrentExpiry = expiryDate[0];
          console.log("Expiry pick ", selectedCurrentExpiry);
        }

        // GET AMX INDEX LTP
        var getLTPDataRequest = new GetLTPDataRequest();
        getLTPDataRequest.exchange = amxIndex.exch_seg;
        getLTPDataRequest.symboltoken = amxIndex.token;
        getLTPDataRequest.tradingsymbol = amxIndex.symbol;

        var token = localStorage.getItem("TradToken");

        AngleOne.getLTPData(
          token,
          AngleOne.getTradConfig(1234),
          getLTPDataRequest
        )
          .then((ltp: number) => {
            var amxLTP = 0;
            if (isExpiry) {
              amxLTP = expiryMidStrike;
            } else {
              amxLTP = ltp;
            }

            // This is expiry "22FEB2024",
            var expiryDateFormat =
              expiryDate[0].toString().substring(8, 10) +
              selectedCurrentExpiry
                .toString()
                .substring(4, 7)
                .toLocaleUpperCase() +
              selectedCurrentExpiry.getFullYear();

            // Strike Price Symbol name "NIFTY22FEB2421100CE" | "NIFTY22FEB2421100CE"
            var expiryDateFormat2 =
              expiryDate[0].toString().substring(8, 10) +
              selectedCurrentExpiry
                .toString()
                .substring(4, 7)
                .toLocaleUpperCase() +
              selectedCurrentExpiry.getFullYear().toString().substring(2, 4);

            var optionChainData: TradBook[] = [];
            var optionChain: OptionChain[] = [];

            allSymbol.forEach((value: TradBook) => {
              if (
                value.name === option &&
                value.exch_seg === "NFO" &&
                value.expiry === expiryDateFormat
              ) {
                optionChainData.push(value);
              }
            });

            var roundStrike =
              Math.ceil(amxLTP / result.strikeChange) * result.strikeChange;

            if (roundStrike > 0) {
              var latest = roundStrike - result.strikeMoveNumber;

              var count = isExpiry ? 60 : 30;

              for (let i = 0; i <= count; i++) {
                let ce = new TradBook();
                let pe = new TradBook();

                optionChainData.find((value: TradBook) => {
                  if (
                    value.name == option &&
                    value.exch_seg == "NFO" &&
                    value.symbol == option + expiryDateFormat2 + latest + "CE"
                  ) {
                    ce = value;
                  }
                  if (
                    value.name == option &&
                    value.exch_seg == "NFO" &&
                    value.symbol == option + expiryDateFormat2 + latest + "PE"
                  ) {
                    pe = value;
                  }
                });

                var optionChainObj = new OptionChain();
                optionChainObj.ce = ce;
                optionChainObj.pe = pe;
                optionChainObj.strike = latest;
                optionChainObj.ltp = amxLTP;
                optionChain.push(optionChainObj);

                latest = latest + result.strikeChange;
              }

              return resolve(optionChain);
            }
          })
          .catch((err: any) => console.log(err));
      }
    });
  }

  getExpiryDateOptionsSENSEX(
    amxIndexData: AmxIndex[],
    option: string,
    isLastMonthFriday: boolean,
    expiryMidStrike: number,
    isExpiry: boolean
  ): Promise<OptionChain[]> {
    return new Promise((resolve, reject) => {
      var expiryDate: Date[] = [];
      var amxIndex: TradBook = new TradBook();
      var selectedCurrentExpiry: Date;

      const monthChar = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      var allSymbol = JSON.parse(localStorage.getItem("AllSymbol")!);
      let symbols = allSymbol as TradBook[];
      if (symbols) {
        //var option = "NIFTY";
        var result = amxIndexData.find(
          (x: AmxIndex) => x.name == option
        ) as AmxIndex;

        allSymbol.find((value: TradBook) => {
          if (
            value.name === option &&
            value.exch_seg === "BSE" &&
            value.instrumenttype === "AMXIDX" &&
            value.symbol == result?.symbol
          ) {
            amxIndex = value;
          }
        });

        allSymbol.forEach((value: TradBook) => {
          if (
            //$$ ADD ALL INDEX
            (value.name === option &&
              value.exch_seg === "BFO" &&
              value.expiry.match("2024")) ||
            value.expiry.match("2025") ||
            value.expiry.match("2026")
          ) {
            var month = value.expiry.substring(2, 5);
            var date = new Date(
              Number(value.expiry.substring(5, 9)),
              monthChar.findIndex((element) => element == month),
              Number(value.expiry.substring(0, 2))
            );

            var found = expiryDate.find(
              (x: any) => x.toDateString() === date.toDateString()
            );

            if (!found) {
              expiryDate.push(date);
            }
          }
        });

        expiryDate.sort((a, b) => a.getTime() - b.getTime());

        if (expiryDate.length > 0) {
          selectedCurrentExpiry = expiryDate[0];
        }

        // GET AMX INDEX LTP
        var getLTPDataRequest = new GetLTPDataRequest();
        getLTPDataRequest.exchange = amxIndex.exch_seg;
        getLTPDataRequest.symboltoken = amxIndex.token;
        getLTPDataRequest.tradingsymbol = amxIndex.symbol;

        var token = localStorage.getItem("TradToken");

        AngleOne.getLTPData(
          token,
          AngleOne.getTradConfig(1234),
          getLTPDataRequest
        )
          .then((ltp: number) => {
            var amxLTP = 0;
            if (isExpiry) {
              amxLTP = expiryMidStrike;
            } else {
              amxLTP = ltp;
            }

            // This is expiry "22FEB2024",
            var expiryDateFormat =
              expiryDate[0].toString().substring(8, 10) +
              selectedCurrentExpiry
                .toString()
                .substring(4, 7)
                .toLocaleUpperCase() +
              selectedCurrentExpiry.getFullYear();

            // Strike Price Symbol name "SENSEX2441274100CE" | "SENSEX2441274100CE"

            var month = selectedCurrentExpiry
              .toString()
              .substring(4, 7)
              .toLocaleUpperCase();

            var monthIndex = monthChar.findIndex((element) => element == month);

            // Monthly expiry format SENSEX24JUL79600CE [YY{MONTH_SHORT_FORM}]
            var expiryDateFormat2 =
              selectedCurrentExpiry.toString().substring(13, 15) +
              selectedCurrentExpiry
                .toString()
                .substring(4, 7)
                .toLocaleUpperCase();

            // Weekly expiry format SENSEX2441275100CE [YYMD]
            // SENSEX2490675100CE
            // (monthIndex + 1).toString() +
            var expiryDateFormat3 =
              selectedCurrentExpiry.toString().substring(13, 15) +
              selectedCurrentExpiry.toString().substring(4, 5) +
              selectedCurrentExpiry.toString().substring(8, 10);

            //

            // Weekly expiry format BANKEX24N1165300PE [YYMD]
            // BANKEX24N1165300PE
            // (monthIndex + 1).toString() +
            var expiryDateFormat4 =
              selectedCurrentExpiry.toString().substring(13, 15) +
              selectedCurrentExpiry.toString().substring(4, 5) +
              selectedCurrentExpiry.toString().substring(8, 10);

            //

            var optionChainData: TradBook[] = [];
            var optionChain: OptionChain[] = [];

            allSymbol.forEach((value: TradBook) => {
              if (
                value.name === option &&
                value.exch_seg === "BFO" &&
                value.expiry === expiryDateFormat
              ) {
                optionChainData.push(value);
              }
            });

            var roundStrike =
              Math.ceil(amxLTP / result.strikeChange) * result.strikeChange;

            if (roundStrike > 0) {
              var latest = roundStrike - result.strikeMoveNumber;

              var count = isExpiry ? 60 : 30;

              for (let i = 0; i <= count; i++) {
                let ce = new TradBook();
                let pe = new TradBook();

                var expiryDateFormat = isLastMonthFriday
                  ? expiryDateFormat3
                  : expiryDateFormat2;

                var CE = option + expiryDateFormat + latest + "CE";
                var PE = option + expiryDateFormat + latest + "PE";

                console.log(CE);
                console.log(PE);

                optionChainData.find((value: TradBook) => {
                  if (
                    value.name == option &&
                    value.exch_seg == "BFO" &&
                    value.symbol ==
                      option + expiryDateFormat.trim() + latest + "CE"
                  ) {
                    ce = value;
                  }
                  if (
                    value.name == option &&
                    value.exch_seg == "BFO" &&
                    value.symbol ==
                      option + expiryDateFormat.trim() + latest + "PE"
                  ) {
                    pe = value;
                  }
                });

                var optionChainObj = new OptionChain();
                optionChainObj.ce = ce;
                optionChainObj.pe = pe;
                optionChainObj.strike = latest;
                optionChainObj.ltp = amxLTP;
                optionChain.push(optionChainObj);

                latest = latest + result.strikeChange;
              }

              return resolve(optionChain);
            }
          })
          .catch((err: any) => console.log(err));
      }
    });
  }

  getFutureStocks(): Promise<TradBook[]> {
    return new Promise((resolve, reject) => {
      var allSymbol = JSON.parse(localStorage.getItem("AllSymbol")!);
      const stockList: string[] = [
        "AARTIIND",
        "ABB",
        "ABCAPITAL",
        "ABFRL",
        "ACC",
        "ADANIENT",
        "ADANIPORTS",
        "ALKEM",
        "AMBUJACEM",
        "APLAPOLLO",
        "APOLLOHOSP",
        "APOLLOTYRE",
        "ASHOKLEY",
        "ASIANPAINT",
        "ASTRAL",
        "AUBANK",
        "AUROPHARMA",
        "AXISBANK",
        "BAJAJ-AUTO",
        "BAJAJFINSV",
        "BAJFINANCE",
        "BALKRISIND",
        "BANDHANBNK",
        "BANKBARODA",
        "BATAINDIA",
        "BEL",
        "BERGEPAINT",
        "BHARATFORG",
        "BHARTIARTL",
        "BHEL",
        "BIOCON",
        "BOSCHLTD",
        "BPCL",
        "BRITANNIA",
        "BSOFT",
        "BSE",
        "CANBK",
        "CDSL",
        "CESC",
        "CGPOWER",
        "CHAMBLFERT",
        "CHOLAFIN",
        "CIPLA",
        "COALINDIA",
        "COFORGE",
        "COLPAL",
        "CONCOR",
        "CROMPTON",
        "CUMMINSIND",
        "CYIENT",
        "DABUR",
        "DALBHARAT",
        "DELHIVERY",
        "DEEPAKNTR",
        "DIVISLAB",
        "DIXON",
        "DLF",
        "DMART",
        "DRREDDY",
        "EICHERMOT",
        "EMBDL",
        "ESCORTS",
        "ETERNAL",
        "EXIDEIND",
        "FEDERALBNK",
        "FSL",
        "GAIL",
        "GLENMARK",
        "GODREJCP",
        "GODREJPROP",
        "GRANULES",
        "GRASIM",
        "BRIGADE",
        "GMRAIRPORT",
        "HAL",
        "HAVELLS",
        "HCLTECH",
        "HDFC",
        "HDFCAMC",
        "HDFCBANK",
        "HDFCLIFE",
        "HEROMOTOCO",
        "HFCL",
        "HINDALCO",
        "HINDCOPPER",
        "HINDPETRO",
        "HINDUNILVR",
        "HINDZINC",
        "HUDCO",
        "ICICIBANK",
        "ICICIGI",
        "ICICIPRULI",
        "IDEA",
        "IDFC",
        "IDFCFIRSTB",
        "IEX",
        "IGL",
        "IIFL",
        "IREDA",
        "INDHOTEL",
        "INDIANB",
        "INDIACEM",
        "INDIGO",
        "INDUSINDBK",
        "INDUSTOWER",
        "INFY",
        "INOXWIND",
        "IOC",
        "IRB",
        "IRCTC",
        "IRFC",
        "ITC",
        "JINDALSTEL",
        "JIOFIN",
        "JKCEMENT",
        "JSL",
        "JSWENERGY",
        "JSWSTEEL",
        "JUBLFOOD",
        "KALYANKJIL",
        "KEI",
        "KPITTECH",
        "KOTAKBANK",
        "LTF",
        "LAURUSLABS",
        "LICHSGFIN",
        "LICI",
        "LT",
        "LTIM",
        "LUPIN",
        "LODHA",
        "MAXHEALTH",
        "M&M",
        "M&MFIN",
        "MANAPPURAM",
        "MARICO",
        "MARUTI",
        "MCX",
        "METROPOLIS",
        "MFSL",
        "MGL",
        "MINDTREE",
        "MOTHERSON",
        "MPHASIS",
        "MRF",
        "MUTHOOTFIN",
        "NATIONALUM",
        "NAUKRI",
        "NAVINFLUOR",
        "NBCC",
        "NCC",
        "NHPC",
        "NESTLEIND",
        "NMDC",
        "NTPC",
        "NYKAA",
        "OBEROIRLTY",
        "OFSS",
        "ONGC",
        "OIL",
        "PAGEIND",
        "PATANJALI",
        "PAYTM",
        "PEL",
        "PERSISTENT",
        "PETRONET",
        "PFC",
        "PHOENIXLTD",
        "PIDILITIND",
        "PIIND",
        "PNB",
        "PNBHOUSING",
        "POLYCAB",
        "POLICYBZR",
        "POWERGRID",
        "POONAWALLA",
        "PRESTIGE",
        "RAMCOCEM",
        "RBLBANK",
        "RECLTD",
        "RELIANCE",
        "SAIL",
        "SBICARD",
        "SBILIFE",
        "SBIN",
        "SHREECEM",
        "SHRIRAMFIN",
        "SIEMENS",
        "SRF",
        "SUNPHARMA",
        "SYNGENE",
        "SJVN",
        "SOBHA",
        "SOLARINDS",
        "SONACOMS",
        "SUNTECK",
        "SUPREMEIND",
        "TATACHEM",
        "TATACOMM",
        "TATACONSUM",
        "TATAELXSI",
        "TATAMOTORS",
        "TATAPOWER",
        "TATASTEEL",
        "TCS",
        "TECHM",
        "TIINDIA",
        "TITAN",
        "TITAGARH",
        "TORNTPHARM",
        "TORNTPOWER",
        "TRENT",
        "TVSMOTOR",
        "UBL",
        "ULTRACEMCO",
        "UPL",
        "UNIONBANK",
        "VBL",
        "VEDL",
        "VOLTAS",
        "WHIRLPOOL",
        "WIPRO",
        "YESBANK",
        "ZYDUSLIFE",
      ];
      let symbols = allSymbol as TradBook[];
      if (symbols) {
        var tradBookData: TradBook[] = [];

        allSymbol.forEach((value: TradBook) => {
          if (
            value.exch_seg === "NSE" &&
            value.expiry === "" &&
            value.instrumenttype === "" &&
            stockList.includes(value.name)
          ) {
            tradBookData.push(value);
          }
        });

        return resolve(tradBookData);
      }
    });
  }

  static getLTPData(
    token: string,
    tradingConfig: TradConfig,
    getLTPDataRequest: GetLTPDataRequest
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      var getLtpJson = JSON.stringify({
        exchange: getLTPDataRequest.exchange,
        tradingsymbol: getLTPDataRequest.tradingsymbol,
        symboltoken: getLTPDataRequest.symboltoken,
      });

      var config = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": tradingConfig.localIP,
          "X-ClientPublicIP": tradingConfig.publicIP,
          "X-MACAddress": tradingConfig.macAddress,
          "X-PrivateKey": tradingConfig.privateKey,
        },
        data: getLtpJson,
      };

      axios(config)
        .then((response: any) => {
          var result = response.data as Ltp;

          if (result.data) {
            return resolve(result.data.ltp);
          } else {
            return resolve(0);
          }
        })
        .catch((err) => console.log(err));
    });
  }

  gainersLosers = async (
    token: string,
    tradConfig: TradConfig,
    gainersLosers: GainersLosersEnum
  ): Promise<GainersLosers[]> => {
    return new Promise((resolve, reject) => {
      var getGainersLosersJson = JSON.stringify({
        datatype: GainersLosersEnum[gainersLosers],
        expirytype: "NEAR",
      });

      var config = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/secure/angelbroking/marketData/v1/gainersLosers",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": tradConfig.localIP,
          "X-ClientPublicIP": tradConfig.publicIP,
          "X-MACAddress": tradConfig.macAddress,
          "X-PrivateKey": tradConfig.privateKey,
        },
        data: getGainersLosersJson,
      };

      axios(config)
        .then((response: any) => {
          var result = response.data.data as GainersLosers[];
          if (result) {
            return resolve(result);
          }
        })
        .catch(function (error) {
          console.log(`Error gainer and losers ${error}`);
          return reject(error);
        });
    });
  };

  static formatDate(): CandleTimeFrame {
    //===========================================
    var toDate = new Date(Date.now() - 1000 * 60);

    const year1 = toDate.getFullYear();
    const month1 = String(toDate.getMonth() + 1).padStart(2, "0");
    const day1 = String(toDate.getDate()).padStart(2, "0");
    const hours1 = String(toDate.getHours()).padStart(2, "0");
    const minutes1 = String(toDate.getMinutes()).padStart(2, "0");

    //============================================
    var fromdate = new Date(Date.now() - 4000 * 60);
    const year2 = fromdate.getFullYear();
    const month2 = String(fromdate.getMonth() + 1).padStart(2, "0");
    const day2 = String(fromdate.getDate()).padStart(2, "0");
    const hours2 = String(fromdate.getHours()).padStart(2, "0");
    const minutes2 = String(fromdate.getMinutes()).padStart(2, "0");

    //============================================

    let timeFrame = new CandleTimeFrame();

    timeFrame.fromdate = `${year2}-${month2}-${day2} ${hours2}:${minutes2}`;
    timeFrame.todate = `${year1}-${month1}-${day1} ${hours1}:${minutes1}`;
    return timeFrame;
  }

  static formatDateIST(): CandleTimeFrame {
    // Helper function to convert UTC date to IST and format components
    function getISTDateParts(date: Date): {
      year: string;
      month: string;
      day: string;
      hours: string;
      minutes: string;
    } {
      const istDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const year = istDate.getFullYear().toString();
      const month = String(istDate.getMonth() + 1).padStart(2, "0");
      const day = String(istDate.getDate()).padStart(2, "0");
      const hours = String(istDate.getHours()).padStart(2, "0");
      const minutes = String(istDate.getMinutes()).padStart(2, "0");
      return { year, month, day, hours, minutes };
    }

    //===========================================
    const toDate = new Date(Date.now() - 1000 * 60); // 1 minute ago
    const toParts = getISTDateParts(toDate);

    const fromDate = new Date(Date.now() - 4000 * 60); // 4000 minutes ago
    const fromParts = getISTDateParts(fromDate);

    //===========================================
    let timeFrame = new CandleTimeFrame();
    timeFrame.fromdate = `${fromParts.year}-${fromParts.month}-${fromParts.day} ${fromParts.hours}:${fromParts.minutes}`;
    timeFrame.todate = `${toParts.year}-${toParts.month}-${toParts.day} ${toParts.hours}:${toParts.minutes}`;

    return timeFrame;
  }

  static customFormatDateIST(
    intervalMinutes: number,
    lookbackMinutes: number
  ): CandleTimeFrame {
    // Helper function to convert UTC date to IST and format components
    function getISTDateParts(date: Date): {
      year: string;
      month: string;
      day: string;
      hours: string;
      minutes: string;
    } {
      const istDate = new Date(
        date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const year = istDate.getFullYear().toString();
      const month = String(istDate.getMonth() + 1).padStart(2, "0");
      const day = String(istDate.getDate()).padStart(2, "0");
      const hours = String(istDate.getHours()).padStart(2, "0");
      const minutes = String(istDate.getMinutes()).padStart(2, "0");
      return { year, month, day, hours, minutes };
    }

    // ================================
    // Get IST "now"
    const now = new Date();
    const istNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    istNow.setSeconds(0, 0);

    // Floor to the last completed interval
    const minutes = istNow.getMinutes();
    const flooredMinutes = minutes - (minutes % intervalMinutes);
    istNow.setMinutes(flooredMinutes);

    // toDate = last completed interval candle
    const toDate = new Date(istNow);

    // If the interval is 5 minutes or more, adjust `toDate` back by the `intervalMinutes`
    toDate.setMinutes(toDate.getMinutes() - intervalMinutes);

    // fromDate = lookbackMinutes before toDate
    const fromDate = new Date(toDate.getTime() - lookbackMinutes * 60 * 1000);

    // ================================
    const fromParts = getISTDateParts(fromDate);
    const toParts = getISTDateParts(toDate);

    let timeFrame = new CandleTimeFrame();
    timeFrame.fromdate = `${fromParts.year}-${fromParts.month}-${fromParts.day} ${fromParts.hours}:${fromParts.minutes}`;
    timeFrame.todate = `${toParts.year}-${toParts.month}-${toParts.day} ${toParts.hours}:${toParts.minutes}`;

    return timeFrame;
  }

  static formatDateEMA9_26(): CandleTimeFrame {
    // Subtract 1 minute from now
    let toDate = new Date(Date.now() - 1000 * 60);

    const toDateIST = new Date(
      toDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    // Round down to the nearest 5-minute mark
    toDateIST.setMinutes(Math.floor(toDate.getMinutes() / 5) * 5);
    toDateIST.setSeconds(0);
    toDateIST.setMilliseconds(0);

    // Format toDate
    const year1 = toDateIST.getFullYear();
    const month1 = String(toDateIST.getMonth() + 1).padStart(2, "0");
    const day1 = String(toDateIST.getDate()).padStart(2, "0");
    const hours1 = String(toDateIST.getHours()).padStart(2, "0");
    const minutes1 = String(toDateIST.getMinutes()).padStart(2, "0");

    // Calculate last Friday at 2 PM
    const fromDateIST = new Date(
      toDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const lastFridayAt2PM = new Date(fromDateIST);
    let timeFrame = new CandleTimeFrame();

    if (fromDateIST.getDay() === 1) {
      // Monday -> back 3 days to Friday
      lastFridayAt2PM.setDate(fromDateIST.getDate() - 3);
    } else {
      // Any other day -> assume Friday was the day before
      lastFridayAt2PM.setDate(fromDateIST.getDate() - 1);
    }
    lastFridayAt2PM.setHours(14, 0, 0, 0);

    // Format fromdate
    const year2 = lastFridayAt2PM.getFullYear();
    const month2 = String(lastFridayAt2PM.getMonth() + 1).padStart(2, "0");
    const day2 = String(lastFridayAt2PM.getDate()).padStart(2, "0");
    const hours2 = String(lastFridayAt2PM.getHours()).padStart(2, "0");
    const minutes2 = String(lastFridayAt2PM.getMinutes()).padStart(2, "0");

    // timeFrame.fromdate = `${year2}-${month2}-${day2} 09:00`;
    timeFrame.fromdate = `${year2}-${month2}-${day2} ${hours2}:${minutes2}`;
    timeFrame.todate = `${year1}-${month1}-${day1} ${hours1}:${minutes1}`;

    return timeFrame;
  }

  getDateFormat(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  // Example usage:
  // const year = 2025;
  // const month = 1; // September (0-based index, so 8 means September)
  // const lastFriday = getLastFridayOfMonth(year, month);
  // console.log(lastFriday); // Outputs the date of the last Friday of September 2024
  static isLastFridayOfMonth(): boolean {
    // Get the last day of the month  new Date('2024-09-27T01:15:16')
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();

    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the last day (0 = Sunday, 6 = Saturday)
    const lastDayOfWeek = lastDay.getDay();

    // Calculate the difference to the last Friday (5 = Friday)
    const diffToFriday = (lastDayOfWeek + 2) % 7;

    // Subtract the difference from the last day
    lastDay.setDate(lastDay.getDate() - diffToFriday);

    var monthOfLastFridayDate = this.dateToString(lastDay);
    var todaysDate = this.dateToString(date);

    return monthOfLastFridayDate == todaysDate ? true : false;
  }

  static isLastMondayOfMonth(): boolean {
    // Get the last day of the month  new Date('2024-09-27T01:15:16')
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();

    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the last day (0 = Sunday, 6 = Saturday)
    const lastDayOfWeek = lastDay.getDay();

    // Calculate the difference to the last Friday (5 = Friday)
    const diffToFriday = (lastDayOfWeek + 6) % 7;

    // Subtract the difference from the last day
    lastDay.setDate(lastDay.getDate() - diffToFriday);

    var monthOfLastFridayDate = this.dateToString(lastDay);
    var todaysDate = this.dateToString(date);

    return monthOfLastFridayDate == todaysDate ? true : false;
  }

  static dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  static isMultipleOf500(num: number): boolean {
    return num % 500 === 0;
  }

  readCandleData(
    token: string,
    tradConfig: TradConfig,
    getCandleDataRequest: GetCandleDataRequest
  ): Promise<GetCandleDataResponse> {
    //
    return new Promise((resolve, reject) => {
      var getCandleJson = JSON.stringify({
        exchange: getCandleDataRequest.exchange,
        symboltoken: getCandleDataRequest.symboltoken,
        interval: getCandleDataRequest.interval,
        fromdate: getCandleDataRequest.fromdate,
        todate: getCandleDataRequest.todate,
      });

      var config = {
        method: "post",
        url: "https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": tradConfig.localIP,
          "X-ClientPublicIP": tradConfig.publicIP,
          "X-MACAddress": tradConfig.macAddress,
          "X-PrivateKey": tradConfig.privateKey,
        },
        data: getCandleJson,
      };

      axios(config)
        .then((response: any) => {
          var result = response.data.data as GetCandleDataResponse;
          //console.log(JSON.stringify(response.data.data));

          if (result) {
            return resolve(result);
          }
        })
        .catch((err: any) => {
          console.log(
            "ERROR FOUND: readCandleData() method " +
              getCandleDataRequest.symboltoken +
              "\n" +
              err
          );
          //console.log(err);
        });
    });
  }

  engulfingCandlePattern(
    candleData: any | GetCandleDataResponse,
    symbol: string,
    detected: string = ""
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      //
      var candleFirst = new Candle();
      candleFirst.open = candleData[0][1];
      candleFirst.high = candleData[0][2];
      candleFirst.low = candleData[0][3];
      candleFirst.close = candleData[0][4];
      candleFirst.volume = candleData[0][5];

      var candleSecond = new Candle();
      candleSecond.open = candleData[1][1];
      candleSecond.high = candleData[1][2];
      candleSecond.low = candleData[1][3];
      candleSecond.close = candleData[1][4];
      candleSecond.volume = candleData[1][5];

      var isCEDetected = false;
      var isPEDetected = false;

      var candlePatternTrad = new CandlePatternTrad();
      candlePatternTrad.isActive = false;
      candlePatternTrad.targetPoint = 1;

      // RED positive & Green negative diff
      var x = candleFirst.open - candleFirst.close;
      var y = candleSecond.open - candleSecond.close;

      if ((x > 0 && y < 0) || (x < 0 && y < 0)) {
        isCEDetected = true;
      } else if ((x < 0 && y > 0) || (x > 0 && y > 0)) {
        isPEDetected = true;
      }

      // CE PATTERN DETECTED
      if (
        candleFirst.open <= candleSecond.close &&
        candleFirst.close >= candleSecond.open &&
        candleFirst.low >= candleSecond.low &&
        candleFirst.high <= candleSecond.high &&
        isCEDetected
      ) {
        if (candleFirst.volume > candleSecond.volume) {
          if (
            candleFirst.high <= candleSecond.high &&
            candleFirst.low >= candleSecond.low &&
            candleFirst.open < candleSecond.close &&
            candleFirst.close >= candleSecond.open &&
            isCEDetected
          ) {
            return resolve(
              "## STRONG ## CE PATTERN DETECTED BUT VOLUME & PRICE IMBALANCED " +
                symbol
            );
          }
        } else {
          return resolve("## STRONG ## CE PATTERN DETECTED " + symbol);
        }
      }

      return resolve("");
    });
  }
}
