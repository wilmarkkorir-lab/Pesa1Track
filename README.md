# PesaTrack Frontend

React + Vite + Tailwind frontend for PesaTrack personal finance tracker.

- Live: https://pesa1-track.vercel.app
- Backend: https://pesatrack.alwaysdata.net
- Frontend repo: https://github.com/wilmarkkorir-lab/Pesa1Track
- Backend repo: https://github.com/wilmarkkorir-lab/PesaTrack

---

## Run locally

```bash
npm install
# Windows:
python -c "open('.env','w').write('VITE_API_BASE_URL=/api\nVITE_GROQ_API_KEY=your_groq_key\n')"
# Linux/macOS:
cp .env.example .env
npm run dev
```

Set Django CORS to allow `http://localhost:5173`.

---

## Environment variables

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `/api` (Vercel proxy — do not change) |
| `VITE_GROQ_API_KEY` | Groq API key from console.groq.com |

Set these in Vercel dashboard under Project → Settings → Environment Variables.

> **Windows note:** Use Python to write `.env` — `echo` in cmd produces UTF-16 which breaks Vite.

---

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Public landing page |
| Login | `/login` | JWT login |
| Register | `/register` | Create account |
| Dashboard | `/app` | Summary, charts, recent transactions |
| Transactions | `/app/transactions` | Income/expense list, add/edit/delete |
| Budgets | `/app/budgets` | Budget limits per category |
| Goals | `/app/goals` | Savings goals with progress |
| Categories | `/app/categories` | Custom categories with icon + color picker |
| Recurring | `/app/recurring` | Recurring transaction templates |
| Bills | `/app/bills` | Bill tracking |
| Debts | `/app/debts` | Debt management |
| Businesses | `/app/businesses` | Business accounts |
| AI Assistant | `/app/ai` | Groq AI chat with financial context |
| Settings | `/app/settings` | Profile, currency, timezone |
| Admin Users | `/app/admin` | Superuser only — view all registered users |

---

## API mapping

```
Auth:
  POST /api/auth/register/
  POST /api/auth/login/
  POST /api/auth/refresh/
  GET  /api/auth/me/           → returns full_name, email, currency, is_staff, is_superuser
  GET  /api/auth/users/        → superuser only, list all users

Finance:
  /api/finance/categories/
  /api/finance/transactions/
  /api/finance/budgets/
  /api/finance/goals/
  /api/finance/recurring/
  /api/finance/bills/
  /api/finance/debts/

Business:
  /api/business/businesses/

Reports:
  /api/reports/personal-summary/
```

---

## CORS / Proxy

Vercel proxies all `/api/*` requests to `https://pesatrack.alwaysdata.net/api/$1`.
The browser never calls alwaysdata directly — no CORS issues.
`BASE = "/api"` is hardcoded in `src/api/http.js`.

`vercel.json` uses a `routes` array with explicit methods and a SPA fallback.

---

## AI Assistant

- Model: `openai/gpt-oss-20b` via Groq API
- Speech-to-text: Groq Whisper (`whisper-large-v3-turbo`)
- Text-to-speech: Browser `SpeechSynthesis` API
- Financial context (summary, transactions, budgets) injected as system prompt

---

## Admin Users page

- Route: `/app/admin`
- Visible only to superuser accounts (`is_superuser: true` from `/auth/me/`)
- Shows: total users, active users, admins, joined today stats
- Search by name or email
- Table: name, email, currency, join date, last login, active/admin status

To create/promote a superuser on the live database, SSH into alwaysdata and run:

```bash
cd pesatrack_complete_backend
python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
u, created = U.objects.get_or_create(email='admin@gmail.com', defaults={'username':'admin'})
u.set_password('your_password')
u.is_staff = True
u.is_superuser = True
u.save()
print('created' if created else 'updated')
"
```

---

## Deployment

- Frontend auto-deploys to Vercel on push to `main` (wilmarkkorir-lab/Pesa1Track)
- Backend deploys to alwaysdata on push to `main` (wilmarkkorir-lab/PesaTrack) but **requires manual restart**
- alwaysdata restart: Dashboard → Web → Sites → ↺ Restart

---

## Layout

- Desktop: fixed 64px sidebar with all 12 nav links
- Mobile: fixed 52px top bar + fixed 52px bottom nav (4 links + More button)
- More drawer: 3-column grid of all pages + logout
- Scrollbars hidden globally

---

## Key files

| File | Purpose |
|---|---|
| `src/api/http.js` | Axios instance, JWT interceptor, refresh logic, offline queue |
| `src/context/AuthContext.jsx` | Auth state, login/logout, user object |
| `src/api/endpoints.js` | All API call functions |
| `src/components/Layout.jsx` | Responsive sidebar + mobile nav |
| `src/pages/AiPage.jsx` | Groq AI chat + STT + TTS |
| `src/pages/AdminPage.jsx` | Superuser-only users table |
| `src/pages/DashboardPage.jsx` | Summary cards + charts |
| `src/styles.css` | Global styles, scrollbar hiding, responsive table |
| `vercel.json` | Vercel proxy routes + SPA fallback |
