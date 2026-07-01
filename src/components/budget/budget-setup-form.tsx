"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { MonthlyBudget, IncomeEntry, FixedExpense } from "@/lib/types";
import {
  confirmBudget,
  updateIncomeEntry,
  addIncomeEntry,
  deleteIncomeEntry,
  updateFixedExpense,
  addFixedExpense,
  deleteFixedExpense,
  updateOverdraftApplied,
  closeBudget,
} from "@/app/(authenticated)/budget/actions";

interface BudgetSetupFormProps {
  budget: MonthlyBudget;
  incomeEntries: IncomeEntry[];
  fixedExpenses: FixedExpense[];
}

export function BudgetSetupForm({
  budget,
  incomeEntries,
  fixedExpenses,
}: BudgetSetupFormProps) {
  const [addingIncome, setAddingIncome] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  const totalIncome = incomeEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const overdraft = budget.overdraft_applied ? Number(budget.overdraft_from_previous) : 0;
  const remaining = totalIncome - totalFixed - overdraft;

  const isDraft = budget.status === "draft";
  const isActive = budget.status === "active";
  const isClosed = budget.status === "closed";

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isDraft
              ? "bg-yellow-100 text-yellow-800"
              : isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {budget.status.toUpperCase()}
        </span>
      </div>

      {/* Income Section */}
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-lg">Income</h2>
        <div className="space-y-2">
          {incomeEntries.map((entry) => (
            <EditableLineItem
              key={entry.id}
              id={entry.id}
              name={entry.name}
              amount={Number(entry.amount)}
              disabled={isClosed}
              onSave={(name, amount) =>
                updateIncomeEntry(entry.id, { name, amount })
              }
              onDelete={() => deleteIncomeEntry(entry.id)}
            />
          ))}
        </div>
        {(isDraft || isActive) && !addingIncome && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingIncome(true)}
          >
            + Add Income
          </Button>
        )}
        {addingIncome && (
          <div className="flex gap-2 items-end">
            <input
              type="text"
              placeholder="Name"
              value={newIncomeName}
              onChange={(e) => setNewIncomeName(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={newIncomeAmount}
              onChange={(e) => setNewIncomeAmount(e.target.value)}
              className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (newIncomeName && newIncomeAmount) {
                  await addIncomeEntry(
                    budget.id,
                    newIncomeName,
                    parseFloat(newIncomeAmount)
                  );
                  setNewIncomeName("");
                  setNewIncomeAmount("");
                  setAddingIncome(false);
                }
              }}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAddingIncome(false)}
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-medium">
          <span>Total Income</span>
          <span className="text-green-600">{formatCurrency(totalIncome)}</span>
        </div>
      </section>

      {/* Fixed Expenses Section */}
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-lg">Fixed Expenses</h2>
        <div className="space-y-2">
          {fixedExpenses.map((expense) => (
            <EditableLineItem
              key={expense.id}
              id={expense.id}
              name={expense.name}
              amount={Number(expense.amount)}
              notes={expense.notes}
              disabled={isClosed}
              onSave={(name, amount) =>
                updateFixedExpense(expense.id, { name, amount })
              }
              onDelete={() => deleteFixedExpense(expense.id)}
            />
          ))}
        </div>
        {(isDraft || isActive) && !addingExpense && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingExpense(true)}
          >
            + Add Fixed Expense
          </Button>
        )}
        {addingExpense && (
          <div className="flex gap-2 items-end">
            <input
              type="text"
              placeholder="Name"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (newExpenseName && newExpenseAmount) {
                  await addFixedExpense(
                    budget.id,
                    newExpenseName,
                    parseFloat(newExpenseAmount)
                  );
                  setNewExpenseName("");
                  setNewExpenseAmount("");
                  setAddingExpense(false);
                }
              }}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAddingExpense(false)}
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-medium">
          <span>Total Fixed Expenses</span>
          <span className="text-red-600">−{formatCurrency(totalFixed)}</span>
        </div>
      </section>

      {/* Overdraft Section */}
      {Number(budget.overdraft_from_previous) > 0 && (
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Previous Month Overdraft</h2>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(Number(budget.overdraft_from_previous))} carried
                forward from last month
              </p>
            </div>
            {isDraft && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={budget.overdraft_applied}
                  onChange={(e) =>
                    updateOverdraftApplied(budget.id, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Apply</span>
              </label>
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      <section className="rounded-lg border-2 border-primary p-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Remaining Budget</span>
          <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(remaining)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Income ({formatCurrency(totalIncome)}) − Fixed (
          {formatCurrency(totalFixed)})
          {overdraft > 0 && ` − Overdraft (${formatCurrency(overdraft)})`}
        </p>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        {isDraft && (
          <Button
            onClick={() => confirmBudget(budget.id)}
            className="flex-1"
          >
            Confirm & Activate
          </Button>
        )}
        {isActive && (
          <Button
            variant="outline"
            onClick={() => closeBudget(budget.id)}
          >
            Close Month
          </Button>
        )}
      </div>
    </div>
  );
}

// Inline editable line item component
function EditableLineItem({
  id,
  name,
  amount,
  notes,
  disabled,
  onSave,
  onDelete,
}: {
  id: string;
  name: string;
  amount: number;
  notes?: string | null;
  disabled: boolean;
  onSave: (name: string, amount: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editAmount, setEditAmount] = useState(amount.toString());

  if (editing && !disabled) {
    return (
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
        <input
          type="number"
          step="0.01"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="flex h-8 w-28 rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await onSave(editName, parseFloat(editAmount));
            setEditing(false);
          }}
        >
          ✓
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            await onDelete();
          }}
        >
          ✕
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditName(name);
            setEditAmount(amount.toString());
            setEditing(false);
          }}
        >
          ↩
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex justify-between items-center py-1 ${
        !disabled ? "cursor-pointer hover:bg-accent/50 rounded px-2 -mx-2" : ""
      }`}
      onClick={() => !disabled && setEditing(true)}
    >
      <div>
        <span className="text-sm">{name}</span>
        {notes && (
          <span className="text-xs text-muted-foreground ml-2">({notes})</span>
        )}
      </div>
      <span className="text-sm font-medium">{formatCurrency(amount)}</span>
    </div>
  );
}
