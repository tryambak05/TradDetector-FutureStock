"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandlestickAnatomy = exports.Candle = void 0;
class Candle {
    static setCandleAnatomy(open, close) {
        var candlePrice = open - close;
        if (candlePrice == 0) {
            return CandlestickAnatomy.None;
        }
        else if (candlePrice < 0) {
            return CandlestickAnatomy.Bullish;
        }
        else if (candlePrice > 0) {
            return CandlestickAnatomy.Bearish;
        }
        else {
            return CandlestickAnatomy.NotFound;
        }
    }
}
exports.Candle = Candle;
var CandlestickAnatomy;
(function (CandlestickAnatomy) {
    CandlestickAnatomy[CandlestickAnatomy["Bullish"] = 0] = "Bullish";
    CandlestickAnatomy[CandlestickAnatomy["Bearish"] = 1] = "Bearish";
    CandlestickAnatomy[CandlestickAnatomy["None"] = 2] = "None";
    CandlestickAnatomy[CandlestickAnatomy["NotFound"] = 3] = "NotFound";
})(CandlestickAnatomy || (exports.CandlestickAnatomy = CandlestickAnatomy = {}));
