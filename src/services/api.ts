const API_BASE = "http://localhost:3000/api";

export interface CashPositionResponse {
  cashPosition: {
    expectedClosingCashMinor: string;
    actualBankBalanceMinor: string;
    varianceMinor: string;
    breakdown: Array<{
      cause: string;
      amountMinor: string;
      percentage: number;
      transactionCount: number;
    }>;
    topTransactions: Array<{
      id: string;
      amountMinor: string;
      source: string;
      reason: string;
      status: string;
    }>;
  };
}

let authToken: string | null = null;

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

export const api = {
  setToken(token: string | null) {
    authToken = token;
  },

  async login(email: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }
    return res.json();
  },

  async register(email: string, password: string, name: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Registration failed");
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },

  async uploadData(formData: FormData) {
    // Note: FormData does not use Content-Type: application/json
    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}/imports`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload data");
    return res.json();
  },

  async startRun() {
    const res = await fetch(`${API_BASE}/runs`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to start run");
    return res.json();
  },

  async getRuns() {
    const res = await fetch(`${API_BASE}/runs`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch runs");
    return res.json();
  },

  async getRunDetails(runId: string) {
    const res = await fetch(`${API_BASE}/runs/${runId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch run details");
    return res.json();
  },

  async cancelRun(runId: string) {
    const res = await fetch(`${API_BASE}/runs/${runId}/cancel`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to cancel run");
    }
    return res.json();
  },

  async getRunTransactions(runId: string, statusFilter: string = 'ALL', page: number = 1, limit: number = 50) {
    const res = await fetch(`${API_BASE}/runs/${runId}/transactions?status=${statusFilter}&page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch run transactions");
    return res.json();
  },

  async getExceptions(filters: { status?: string; severity?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.severity) params.append("severity", filters.severity);
    
    const res = await fetch(`${API_BASE}/exceptions?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch exceptions");
    return res.json();
  },

  async getExceptionById(id: string) {
    const res = await fetch(`${API_BASE}/exceptions/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch exception");
    return res.json();
  },

  async resolveException(id: string, payload: { decision: string; targetTransactionId?: string; resolutionNote?: string }) {
    const res = await fetch(`${API_BASE}/exceptions/${id}/resolve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to resolve exception");
    return res.json();
  },

  async askAgent(query: string) {
    const res = await fetch(`${API_BASE}/agent/query`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error("Failed to query agent");
    return res.json();
  },

  async createWorkspace(name: string, role: string) {
    const res = await fetch(`${API_BASE}/workspace`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, role }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getCashPosition(): Promise<CashPositionResponse> {
    const res = await fetch(`${API_BASE}/cash-position`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch cash position");
    return res.json();
  },

  async getDashboardMetrics() {
    const res = await fetch(`${API_BASE}/dashboard/metrics`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
    return res.json();
  },

  async getTransactions(filters: Record<string, any> = {}, page: number = 1, limit: number = 50) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.currency) params.append("currency", filters.currency);
    
    if (filters.source) params.append("source", filters.source);
    if (filters.dateRange?.from) params.append("dateFrom", filters.dateRange.from);
    if (filters.dateRange?.to) params.append("dateTo", filters.dateRange.to);
    if (filters.amountRange?.min !== undefined) params.append("minAmount", filters.amountRange.min.toString());
    if (filters.amountRange?.max !== undefined) params.append("maxAmount", filters.amountRange.max.toString());
    if (filters.runId) params.append("runId", filters.runId);
    if (filters.confidence) params.append("confidence", filters.confidence);
    if (filters.exceptionStatus) params.append("exceptionStatus", filters.exceptionStatus);

    const res = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  },

  async getTransactionDetails(id: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch transaction details");
    return res.json();
  },

  async importDemoData() {
    const res = await fetch(`${API_BASE}/imports/demo`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load demo data");
    }
    return res.json();
  },

  async uploadFile(file: File, sourceType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceType", sourceType);
    
    const headers = getHeaders();
    delete headers["Content-Type"]; // Let browser set it with boundary

    const res = await fetch(`${API_BASE}/imports`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload file");
    }
    return res.json();
  }
};
