import http from "./http";

export const auth = {
  register: d => http.post("/auth/register/", d),
  login: d => http.post("/auth/login/", d),
  refresh: d => http.post("/auth/refresh/", d),
  me: () => http.get("/auth/me/"),
  updateMe: d => http.patch("/auth/me/", d),
};

const crud = u => ({
  list: () => http.get(u),
  create: d => http.post(u, d),
  update: (id, d) => http.patch(`${u}${id}/`, d),
  remove: id => http.delete(`${u}${id}/`),
});

export const api = {
  categories: crud("/finance/categories/"),
  transactions: crud("/finance/transactions/"),
  budgets: crud("/finance/budgets/"),
  goals: crud("/finance/goals/"),
  recurring: crud("/finance/recurring/"),
  bills: crud("/finance/bills/"),
  debts: crud("/finance/debts/"),
  businesses: crud("/business/businesses/"),
  summary: () => http.get("/reports/personal-summary/"),
  monthlyBreakdown: () => http.get("/reports/monthly-breakdown/"),
  categoryBreakdown: () => http.get("/reports/category-breakdown/"),
  goalContributions: goalId => ({
    list: () => http.get(`/finance/goals/${goalId}/contributions/`),
    create: d => http.post(`/finance/goals/${goalId}/contributions/`, d),
  }),
  debtPayments: debtId => ({
    list: () => http.get(`/finance/debts/${debtId}/payments/`),
    create: d => http.post(`/finance/debts/${debtId}/payments/`, d),
  }),
  attachments: {
    list: () => http.get("/finance/attachments/"),
    upload: (file, transactionId) => {
      const fd = new FormData();
      fd.append("file", file);
      if (transactionId) fd.append("transaction", transactionId);
      return http.post("/finance/attachments/", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    remove: id => http.delete(`/finance/attachments/${id}/`),
  },
};

export const getRows = r => Array.isArray(r.data) ? r.data : (r.data?.results || []);
