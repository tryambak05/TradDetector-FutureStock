export class Ltp {
  status!: boolean
  message!: string
  errorcode!: string
  data!: Data
}

export class Data {
  exchange!: string
  tradingsymbol!: string
  symboltoken!: string
  open!: number
  high!: number
  low!: number
  close!: number
  ltp!: number
}
