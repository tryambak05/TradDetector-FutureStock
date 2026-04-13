export class StockData {
    id?: number;
    symbol: string;
    latestOI: number;
    prevOI: number;
    changeInOI: number;
    avgInOI: number;
    volume: number;
    futValue: number;
    optValue: number;
    total: number;
    premValue: number;
    underlyingValue: number;
  }
  
  export class StockDataResponse {
    data: StockData[];
  }
  