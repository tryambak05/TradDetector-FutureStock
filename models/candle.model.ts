export class Candle {
  open!: number;
  high!: number;
  low!: number;
  close!: number;
  volume!: number;
  candleType!: string;
  date!: string;
  candlestickAnatomy!: CandlestickAnatomy;

  static setCandleAnatomy(open: number, close: number): CandlestickAnatomy {
    var candlePrice = open - close;
    if (candlePrice == 0) {
      return CandlestickAnatomy.None;
    } else if (candlePrice < 0) {
      return CandlestickAnatomy.Bullish;
    } else if (candlePrice > 0) {
      return CandlestickAnatomy.Bearish;
    } else {
      return CandlestickAnatomy.NotFound;
    }
  }
}

export enum CandlestickAnatomy {
  Bullish,
  Bearish,
  None,
  NotFound,
}
