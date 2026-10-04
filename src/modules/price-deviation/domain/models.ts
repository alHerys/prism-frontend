
export interface PriceSourceItem {
  id: string;
  description: string;
  category: "MATERIAL" | "SERVICE";
  unit: string;
  oe: string;
  offer: string;
  source: string;
}

export interface PricePair {
  id: string;
  description: string;
  category: "MATERIAL" | "SERVICE";
  unit: string;
  oe: string;
  offer: string;
  source: string;
  matched: boolean;
  confirmed: boolean;
  revision: number;
}
