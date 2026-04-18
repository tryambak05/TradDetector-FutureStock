// Mean
export const calculateMean = (arr: number[]): number =>
    arr.reduce((sum, val) => sum + val, 0) / arr.length;
  
  // Standard Deviation
  export const calculateStdDev = (arr: number[], mean: number): number =>
    Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length);
  
  // Z-score
  export const calculateZScore = (value: number, mean: number, std: number): number =>
    std === 0 ? 0 : (value - mean) / std;