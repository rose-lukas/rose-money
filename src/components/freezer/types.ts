export type FreezerAmount =
  | { kind: "fraction"; num: number; den: number }
  | { kind: "count"; num: number };

export interface FreezerItem {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string | null;
  category: string | null;
  amount: FreezerAmount;
  weightValue: number | null;
  weightUnit: string | null;
  barcode: string | null;
  notes: string | null;
}

/** Offered in the picker even before any item uses them. */
export const DEFAULT_CATEGORIES = [
  "Meat",
  "Sweet Treats",
  "Air Fryer",
  "Baked Goods",
  "Fruits",
] as const;

export const UNCATEGORIZED_LABEL = "Uncategorized";

export const WEIGHT_UNITS = ["g", "kg", "lb", "oz"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** Common food emojis for the picker (first one is the default). */
export const FOOD_EMOJIS = [
  "🧊", "🍗", "🍟", "🍕", "🥩", "🍖", "🥓", "🌭",
  "🍔", "🍤", "🐟", "🦐", "🥟", "🧇", "🥞", "🍞",
  "🥖", "🥐", "🍦", "🍨", "🍧", "🎂", "🥧", "🍰",
  "🫐", "🍓", "🍒", "🥦", "🌽", "🥕", "🫛", "🥔",
  "🍅", "🧀", "🥛", "🍲", "🥘", "🍜", "🫕", "🥡",
] as const;
