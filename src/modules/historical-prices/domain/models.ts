
export interface HistoricalItem {
  id: string;
  documentName: string;
  description: string;
  functionName: string;
  period: string;
  unit: string;
  price: string;
  source: string;
  comparable: boolean;
}

export interface Estimate {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  referenceIds: string[];
  unitPrice: string;
  total: string;
  min: string;
  max: string;
  median: string;
  createdAt: string;
}

export interface HistoricalStatistics {
  description: string;
  unit: string;
  min: string;
  median: string;
  max: string;
  observations: {
    id: string;
    period: string;
    price: string;
  }[];
  chart: {
    points: {
      x: number;
      y: number;
      period: string;
      price: string;
    }[];
    ticks: {
      y: number;
      price: string;
    }[];
  };
}
