export class MarketStock {
    symbol!: string;
    series!: string;
    open_price!: number;
    high_price!: number;
    low_price!: number;
    ltp!: number;
    prev_price!: number;
    net_price!: number;
    trade_quantity!: number;
    turnover!: number;
    market_type!: string;
    ca_ex_dt?: string;     // optional, since corporate action date may not always be present
    ca_purpose?: string;   // optional, same reason
    perChange!: number;
  
    constructor(data: Partial<MarketStock>) {
      Object.assign(this, data);
    }
  }
  