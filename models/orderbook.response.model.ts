export class OrderBookResponse {
  status!: boolean
  message!: string
  errorcode!: string
  data: Data[] = []
}

export class Data {
  variety!: string
  ordertype!: string
  producttype!: string
  duration!: string
  price!: number
  triggerprice!: number
  quantity!: string
  disclosedquantity!: string
  squareoff!: number
  stoploss!: number
  trailingstoploss!: number
  tradingsymbol!: string
  transactiontype!: string
  exchange!: string
  symboltoken!: string
  ordertag!: string
  instrumenttype!: string
  strikeprice!: number
  optiontype!: string
  expirydate!: string
  lotsize!: string
  cancelsize!: string
  averageprice!: number
  filledshares!: string
  unfilledshares!: string
  orderid!: string
  text!: string
  status!: string
  orderstatus!: string
  updatetime!: string
  exchtime!: string
  exchorderupdatetime!: string
  fillid!: string
  filltime!: string
  parentorderid!: string
  uniqueorderid!: string
}
