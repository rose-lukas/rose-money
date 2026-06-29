export const APP_NAME = "Rose Money";

export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Gas",
  "Dining",
  "Entertainment",
  "Medical",
  "Clothing",
  "Kids",
  "Household",
  "Transportation",
  "House Improvement",
  "Other",
] as const;

export const DEFAULT_INCOME_SOURCES = [
  { name: "Salary", amount: 5465.0 },
  { name: "Child Benefit", amount: 391.33 },
] as const;

export const DEFAULT_FIXED_EXPENSES = [
  { name: "Mortgage & House Tax", amount: 2783.96 },
  { name: "Auto & Home Insurance", amount: 297.43 },
  { name: "POTL Payment", amount: 153.83 },
  { name: "School Debt", amount: 504.21 },
  { name: "WiFi", amount: 50.85 },
  { name: "Koodo (Phone)", amount: 60.63 },
  { name: "Scotiabank Fee", amount: 16.95, notes: "opt out if never under 4000" },
  { name: "Church", amount: 100.0 },
] as const;

export const RECEIPT_MAX_SIZE_MB = 5;
export const RECEIPT_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
