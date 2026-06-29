export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type BudgetStatus = "draft" | "active" | "closed";

export interface MonthlyBudget {
  id: string;
  year: number;
  month: number;
  status: BudgetStatus;
  overdraft_from_previous: number;
  overdraft_applied: boolean;
  notes: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface IncomeEntry {
  id: string;
  budget_id: string;
  name: string;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  budget_id: string;
  name: string;
  amount: number;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  budget_id: string;
  date: string;
  amount: number;
  category_id: string;
  store: string | null;
  description: string | null;
  spent_by: string;
  receipt_path: string | null;
  created_at: string;
}

// Joined types for display
export interface ExpenseWithDetails extends Expense {
  category: Category;
  spent_by_profile: Profile;
}

export interface MonthlyBudgetWithDetails extends MonthlyBudget {
  income_entries: IncomeEntry[];
  fixed_expenses: FixedExpense[];
  expenses: Expense[];
}

export interface WeekPeriod {
  start: Date;
  end: Date;
  label: string;
  expenses: Expense[];
  total: number;
}
