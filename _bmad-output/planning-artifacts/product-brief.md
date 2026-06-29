# Product Brief: Family Budget Tracker

## Vision

A private, mobile-friendly web application that replaces a manually-maintained Word document for monthly household budget tracking. Two users (husband and wife) share a single household budget with full visibility into income, fixed expenses, weekly variable spending, and historical trends.

## Problem Statement

The current workflow involves manually editing a Word document each month to track income, fixed expenses, and daily spending across weekly periods. This approach:

- Requires manual arithmetic and copy-paste of recurring values
- Cannot be easily shared between two people on mobile devices
- Provides no historical analysis, trends, or visualizations
- Has no searchable expense history or categorization
- Cannot store receipt photos

## Target Users

| User | Description |
|------|-------------|
| Primary User | Household budget owner who manages monthly setup |
| Spouse | Shared access to log expenses and view budget status |

Both users have equal access. This app is strictly for personal/family use — no public access, no multi-tenancy.

## Core Features

### 1. Authentication & Access Control

- Simple login (email/password) for 2 users
- No registration flow — accounts are pre-provisioned
- Session persistence on mobile browsers

### 2. Monthly Budget Setup

- At the start of each month, the app proposes a new month based on previous month's template
- User manually reviews and confirms/adjusts before activating:
  - Income sources (Salary, Child Benefit, etc.)
  - Fixed expenses (Mortgage, Insurance, POTL, School Debt, WiFi, Phone, Bank fee, Church, etc.)
- Fixed expenses and income carry forward from previous month as defaults
- Previous Month Overdraft auto-populated if prior month ended negative; user can toggle it off

### 3. Expense Tracking

Each expense entry includes:

| Field | Required | Type |
|-------|----------|------|
| Date | Yes | Date picker |
| Amount | Yes | Currency ($) |
| Category | Yes | Dropdown selector |
| Store/Vendor | No | Free text |
| Who | Yes | Dropdown (User 1 / User 2) |
| Description | No | Free text |
| Receipt Photo | No | Image upload |

**Categories:**
Groceries, Gas, Dining, Entertainment, Medical, Clothing, Kids, Household, Transportation, House Improvement, Other

Categories should be manageable (add/edit/remove) from a settings area.

### 4. Weekly Period Tracking

- Month is divided into true calendar weeks (Mon–Sun)
- Each week shows:
  - List of individual expenses
  - Total spent that week
  - Remaining budget after that week

### 5. Dashboard / Monthly View

- Current month summary:
  - Total income
  - Total fixed expenses
  - Remaining budget (income − fixed − variable spending)
  - Spending by category (pie/bar chart)
  - Spending by week (bar chart)
  - Spending by person
- Quick-add expense button (prominent on mobile)

### 6. Historical Analysis

- Month-over-month comparison charts
- Spending trends by category over time
- Running average monthly spending
- Filterable expense history (by month, category, person, store)

### 7. Printable Monthly Recap

- Rich, print-optimized view of a completed month:
  - Income & fixed expenses summary
  - Weekly spending breakdown with individual line items
  - Category breakdown with totals and percentages
  - Charts (category pie chart, weekly bar chart)
  - End-of-month remaining / overdraft
- Accessible via "Print Recap" button → browser print dialog
- Styled with CSS print media queries for clean paper output

### 8. Overdraft Handling

- If a month ends with spending > budget, the deficit is recorded
- Next month's setup auto-includes a "Previous Month Overdraft" line in fixed expenses
- User can toggle this off (cancel the carry-forward) during month setup

## Out of Scope

- Per-category budget limits / caps
- Budget alerts or notifications
- Importing historical data from Word documents
- Public access or multi-tenancy
- Native mobile app (responsive web is sufficient)
- Bank account integration or automatic transaction import
- Bill reminders or due-date tracking

## Success Criteria

1. Both users can log expenses from their phones in under 15 seconds
2. Monthly setup takes under 2 minutes (review + confirm)
3. Dashboard provides at-a-glance budget status
4. Month recaps produce clean, printable output
5. Historical data is searchable and visualizable
