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
  { name: "Salary", amount: 0 },
] as const;

export const DEFAULT_FIXED_EXPENSES = [
  { name: "Mortgage/Rent", amount: 0 },
  { name: "Car Payment", amount: 0 },
  { name: "Insurance", amount: 0 },
  { name: "Phone", amount: 0 },
  { name: "Internet", amount: 0 },
] as const;

export const RECEIPT_MAX_SIZE_MB = 5;
export const RECEIPT_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
