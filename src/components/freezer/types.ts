export type FreezerAmount =
  | { kind: "fraction"; num: number; den: number }
  | { kind: "count"; num: number };

export interface FreezerItem {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string | null;
  amount: FreezerAmount;
  weightValue: number | null;
  weightUnit: string | null;
  barcode: string | null;
  notes: string | null;
}

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
