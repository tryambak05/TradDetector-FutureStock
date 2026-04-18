"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateZScore = exports.calculateStdDev = exports.calculateMean = void 0;
// Mean
const calculateMean = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length;
exports.calculateMean = calculateMean;
// Standard Deviation
const calculateStdDev = (arr, mean) => Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length);
exports.calculateStdDev = calculateStdDev;
// Z-score
const calculateZScore = (value, mean, std) => std === 0 ? 0 : (value - mean) / std;
exports.calculateZScore = calculateZScore;
