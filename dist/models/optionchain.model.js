"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionChain = void 0;
const tradbook_model_1 = require("./tradbook.model");
class OptionChain {
    constructor() {
        this.ce = new tradbook_model_1.TradBook();
        this.pe = new tradbook_model_1.TradBook();
    }
}
exports.OptionChain = OptionChain;
