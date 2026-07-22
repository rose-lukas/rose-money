export type FreezerAmount =
  | { kind: "fraction"; num: number; den: number }
  | { kind: "count"; num: number };

export interface FreezerItem {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string | null;
  amount: FreezerAmount;
  barcode: string | null;
  notes: string | null;
}

/** Common food emojis for the picker (first one is the default). */
export const FOOD_EMOJIS = [
  "🧊", "🍗", "🍟", "🍕", "🥩", "🍖", "🥓", "🌭",
  "🍔", "🍤", "🐟", "🦐", "🥟", "🧇", "🥞", "🍞",
  "🥖", "🥐", "🍦", "🍨", "🍧", "🎂", "🥧", "🍰",
  "🫐", "🍓", "🍒", "🥦", "🌽", "🥕", "🫛", "🥔",
  "🍅", "🧀", "🥛", "🍲", "🥘", "🍜", "🫕", "🥡",
] as const;
