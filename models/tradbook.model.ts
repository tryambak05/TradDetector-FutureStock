export class Master {
  strikeChangeRatio!: number;
  amxLtp!: Number;
}

export class TradBook extends Master {
  token!: string
  symbol!: string
  name!: string
  expiry!: string
  expiryDate!: string
  strike!: string
  lotsize!: string
  instrumenttype!: string
  exch_seg!: string
  tick_size!: string
}
