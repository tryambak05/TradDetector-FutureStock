export class OrderPlaceResponse {
  status!: boolean;
  message!: string
  errorcode!: string
  data: Data = new Data
}

export class Data {
  script!: string
  orderid!: string
  uniqueorderid!: string
}
