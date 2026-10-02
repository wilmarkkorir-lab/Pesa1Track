# PesaTrack Updated Frontend

This frontend is matched to the implemented routes in `pesatrack_complete_backend`. It deliberately uses only routes that exist in that backend.

## Run
```bash
npm install
# Windows: copy .env.example .env
# Linux/macOS: cp .env.example .env
npm run dev
```
Set Django CORS to allow `http://localhost:5173`.

## Working pages
Landing, login, register, dashboard, categories, transactions, budgets, goals, recurring transactions, bills, debts, businesses, settings.

## Exact API mapping
Auth: `/api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/`, `/api/auth/me/`
Finance: `/api/finance/categories/`, `/api/finance/transactions/`, `/api/finance/budgets/`, `/api/finance/goals/`, `/api/finance/recurring/`, `/api/finance/bills/`, `/api/finance/debts/`
Business: `/api/business/businesses/`
Reports: `/api/reports/personal-summary/`
