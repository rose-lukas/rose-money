import { FreezerScene, type FreezerItem } from "@/components/freezer/freezer-scene";

// Milestone 1: placeholder items to demo the open animation + amount indicators.
// Real items (with product photos) come in the next milestone.
const PLACEHOLDER_ITEMS: FreezerItem[] = [
  { id: "1", name: "Chicken Nuggets", emoji: "🍗", amount: { kind: "fraction", num: 1, den: 2 } },
  { id: "2", name: "McCain Fries", emoji: "🍟", amount: { kind: "fraction", num: 3, den: 4 } },
  { id: "3", name: "Peas", emoji: "🫛", amount: { kind: "count", num: 3 } },
  { id: "4", name: "Ice Cream", emoji: "🍦", amount: { kind: "fraction", num: 1, den: 3 } },
  { id: "5", name: "Ground Beef", emoji: "🥩", amount: { kind: "count", num: 2 } },
  { id: "6", name: "Pizza", emoji: "🍕", amount: { kind: "fraction", num: 1, den: 2 } },
];

export default function FreezerPage() {
  return <FreezerScene items={PLACEHOLDER_ITEMS} />;
}
