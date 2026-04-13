export class GainersLosers {
  tradingSymbol: string
  percentChange: number
  symbolToken: number
  opnInterest: number
  netChangeOpnInterest: number
  tradingSide: TradingSideEnum
}

export enum TradingSideEnum {
  Buy,
  Sell
}