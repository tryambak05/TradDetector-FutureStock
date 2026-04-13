import { TradBook } from './tradbook.model'

export class OptionChain {
  strike!: number;
  ce: TradBook = new TradBook();
  pe: TradBook = new TradBook();
  ltp: number;
}
